/**
 * App state, persisted on the device (AsyncStorage).
 * When Supabase is connected (M3) this becomes a local cache that syncs to the server.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  buildPlan,
  daysBetween,
  decide,
  type Checkin,
  type Contraception,
  type CycleInput,
  type Decision,
  type ExerciseHistory,
  type Limitation,
  type Minutes,
  type PlanItem,
  type TrainingProfile,
} from '@/engine';
import { isoDate } from '@/lib/date';

export type Profile = TrainingProfile & {
  name: string;
  defaultMinutes: Minutes;
  units: 'kg' | 'lb';
};

export type CycleSettings = {
  cycleLength: number;
  periodLength: number;
  irregular: boolean;
  contraception: Contraception;
};

export type Consents = { health: boolean; disclaimer: boolean; analytics: boolean; at: string };

export type SetLog = { reps: number; weightKg: number | null; done: boolean };

export type Session = {
  id: string;
  date: string;
  dayName: string | null;
  checkin: Checkin;
  sleepHours: number;
  decision: Decision;
  items: PlanItem[];
  logs: Record<string, SetLog[]>;
  status: 'planned' | 'in_progress' | 'done' | 'skipped';
  rpe?: number;
  helpful?: boolean;
  finishedAt?: string;
};

export type CoachMessage = { id: string; role: 'user' | 'assistant'; content: string; at: string };

type Data = {
  /** Account id this local data belongs to (null = offline / not signed in). */
  ownerId: string | null;
  onboarded: boolean;
  consents: Consents | null;
  profile: Profile;
  cycle: CycleSettings;
  periods: { start: string; end?: string }[];
  sessions: Session[];
  coach: CoachMessage[];
};

type Actions = {
  completeOnboarding: (p: { profile: Profile; cycle: CycleSettings; lastPeriodStart: string | null; consents: Consents }) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  updateCycle: (patch: Partial<CycleSettings>) => void;
  logPeriodStart: (date: string) => void;
  logPeriodEnd: (date: string) => void;
  removePeriod: (start: string) => void;
  createTodaySession: (checkin: Checkin, sleepHours: number) => Session;
  updateItem: (sessionId: string, index: number, item: PlanItem) => void;
  setLogs: (sessionId: string, slug: string, logs: SetLog[]) => void;
  startSession: (sessionId: string) => void;
  finishSession: (sessionId: string, rpe: number, helpful: boolean | undefined) => void;
  addCoachMessage: (m: Omit<CoachMessage, 'id' | 'at'>) => void;
  clearCoach: () => void;
  deleteAllData: () => void;
};

export const defaultProfile: Profile = {
  name: '',
  goal: 'muscle',
  experience: 'beginner',
  daysPerWeek: 3,
  equipment: 'gym',
  limitations: [] as Limitation[],
  defaultMinutes: 45,
  units: 'kg',
};

export const defaultCycle: CycleSettings = { cycleLength: 28, periodLength: 5, irregular: false, contraception: 'none' };

const initial: Data = {
  ownerId: null,
  onboarded: false,
  consents: null,
  profile: defaultProfile,
  cycle: defaultCycle,
  periods: [],
  sessions: [],
  coach: [],
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const useApp = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOnboarding: ({ profile, cycle, lastPeriodStart, consents }) =>
        set({
          onboarded: true,
          profile,
          cycle,
          consents,
          periods: lastPeriodStart ? [{ start: lastPeriodStart }] : [],
        }),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      updateCycle: (patch) => set((s) => ({ cycle: { ...s.cycle, ...patch } })),

      logPeriodStart: (date) =>
        set((s) => {
          const others = s.periods.filter((p) => p.start !== date);
          // Close an open period that started before this one.
          const closed = others.map((p) => (!p.end && p.start < date ? { ...p, end: p.start } : p));
          return { periods: [...closed, { start: date }].sort((a, b) => a.start.localeCompare(b.start)) };
        }),

      logPeriodEnd: (date) =>
        set((s) => {
          const open = [...s.periods].reverse().find((p) => !p.end && p.start <= date);
          if (!open) return {};
          return { periods: s.periods.map((p) => (p === open ? { ...p, end: date } : p)) };
        }),

      removePeriod: (start) => set((s) => ({ periods: s.periods.filter((p) => p.start !== start) })),

      createTodaySession: (checkin, sleepHours) => {
        const s = get();
        const today = isoDate(new Date());
        const decision = decide(checkin, cycleInputOf(s), { lastRpe: lastRpe(s.sessions) });
        const doneCount = s.sessions.filter((x) => x.status === 'done').length;
        const { day, items } = buildPlan({
          profile: s.profile,
          splitIndex: doneCount,
          decision,
          minutes: checkin.minutes,
          history: historyOf(s.sessions),
        });
        const session: Session = {
          id: uid(),
          date: today,
          dayName: day?.name ?? null,
          checkin,
          sleepHours,
          decision,
          items,
          logs: {},
          status: 'planned',
        };
        // One session per day: replace today's unfinished one.
        const kept = s.sessions.filter((x) => !(x.date === today && x.status !== 'done'));
        set({ sessions: [...kept, session].slice(-120) });
        return session;
      },

      updateItem: (id, index, item) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, items: x.items.map((it, i) => (i === index ? item : it)) } : x,
          ),
        })),

      setLogs: (id, slug, logs) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, logs: { ...x.logs, [slug]: logs } } : x)),
        })),

      startSession: (id) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id && x.status === 'planned' ? { ...x, status: 'in_progress' } : x)),
        })),

      finishSession: (id, rpe, helpful) =>
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, status: 'done', rpe, helpful, finishedAt: new Date().toISOString() } : x,
          ),
        })),

      addCoachMessage: (m) =>
        set((s) => ({ coach: [...s.coach, { ...m, id: uid(), at: new Date().toISOString() }].slice(-200) })),
      clearCoach: () => set({ coach: [] }),

      deleteAllData: () => set({ ...initial }),
    }),
    {
      name: 'flowstate-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (state) => ({ ownerId: null, ...(state as object) }) as Data & Actions,
    },
  ),
);

// ---------- Selectors / helpers ----------

export function lastPeriodStart(periods: { start: string }[]): string | null {
  return periods.length ? periods[periods.length - 1].start : null;
}

export function cycleInputOf(s: Pick<Data, 'cycle' | 'periods'>): CycleInput {
  return { ...s.cycle, lastPeriodStart: lastPeriodStart(s.periods) };
}

function lastRpe(sessions: Session[]): number | null {
  const done = sessions.filter((x) => x.status === 'done' && x.rpe != null);
  return done.length ? done[done.length - 1].rpe! : null;
}

/** Last logged performance per exercise (for progression). */
export function historyOf(sessions: Session[]): Record<string, ExerciseHistory> {
  const out: Record<string, ExerciseHistory> = {};
  for (const s of sessions) {
    if (s.status !== 'done') continue;
    for (const it of s.items) {
      const logs = (s.logs[it.slug] ?? []).filter((l) => l.done);
      if (!logs.length) continue;
      const weights = logs.map((l) => l.weightKg).filter((w): w is number => w != null);
      out[it.slug] = {
        weightKg: weights.length ? Math.max(...weights) : null,
        targetReps: it.reps,
        repsDone: logs.map((l) => l.reps),
        rpe: s.rpe ?? null,
      };
    }
  }
  return out;
}

export function todaySession(sessions: Session[]): Session | undefined {
  const today = isoDate(new Date());
  return [...sessions].reverse().find((x) => x.date === today);
}

export function daysSincePeriod(periods: { start: string }[]): number | null {
  const last = lastPeriodStart(periods);
  return last ? daysBetween(last, new Date()) : null;
}
