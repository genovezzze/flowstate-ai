import { create } from 'zustand';
import type { Bleeding, BleedingLevel, Checkin, Energy, Minutes, Motivation, SleepQuality, Soreness } from '@/engine';
import { useApp, type Session } from './app';

export type CheckinDraft = {
  energy: Energy;
  sleep?: SleepQuality;
  sleepHours: number;
  soreness: Soreness[];
  bleeding?: Bleeding;
  bleedingLevel?: BleedingLevel;
  motivation?: Motivation;
  minutes?: Minutes;
};

const emptyDraft = (): CheckinDraft => ({
  energy: 4,
  sleepHours: 7,
  soreness: [],
  minutes: useApp.getState().profile.defaultMinutes,
});

type State = {
  draft: CheckinDraft;
  set: (patch: Partial<CheckinDraft>) => void;
  toggleSoreness: (s: Soreness) => void;
  reset: () => void;
  submit: () => Session | null;
};

/** In-progress daily check-in (not persisted — only the resulting session is). */
export const useCheckin = create<State>((setState, get) => ({
  draft: emptyDraft(),

  set: (patch) => setState((s) => ({ draft: { ...s.draft, ...patch } })),

  toggleSoreness: (value) =>
    setState((s) => {
      const cur = s.draft.soreness;
      let next: Soreness[];
      if (value === 'none') next = cur.includes('none') ? [] : ['none'];
      else {
        const without = cur.filter((x) => x !== 'none');
        next = without.includes(value) ? without.filter((x) => x !== value) : [...without, value];
      }
      return { draft: { ...s.draft, soreness: next } };
    }),

  reset: () => setState({ draft: emptyDraft() }),

  submit: () => {
    const d = get().draft;
    if (!d.sleep || !d.bleeding || !d.motivation || !d.minutes) return null;
    const checkin: Checkin = {
      energy: d.energy,
      sleep: d.sleep,
      soreness: d.soreness.length ? d.soreness : ['none'],
      bleeding: d.bleeding,
      bleedingLevel: d.bleeding === 'yes' ? (d.bleedingLevel ?? 'medium') : undefined,
      motivation: d.motivation,
      minutes: d.minutes,
    };
    const session = useApp.getState().createTodaySession(checkin, d.sleepHours);
    setState({ draft: emptyDraft() });
    return session;
  },
}));

export function stepComplete(step: number, d: CheckinDraft): boolean {
  switch (step) {
    case 1:
      return true;
    case 2:
      return !!d.sleep;
    case 3:
      return d.soreness.length > 0;
    case 4:
      return !!d.bleeding && (d.bleeding !== 'yes' || !!d.bleedingLevel);
    case 5:
      return !!d.motivation;
    case 6:
      return !!d.minutes;
    default:
      return false;
  }
}
