/**
 * Demo data for testing and showing the app (Profile → "Load demo history").
 * Creates ~3 weeks of realistic finished sessions so Today / Train / progression have something to show.
 */
import { buildPlan, decide, type Checkin } from '@/engine';
import { addDays, isoDate } from '@/lib/date';
import { cycleInputOf, historyOf, useApp, type Session, type SetLog } from '@/state/app';

const DEMO_CHECKINS: Checkin[] = [
  { energy: 4, sleep: 'good', soreness: ['none'], bleeding: 'no', motivation: 4, minutes: 45 },
  { energy: 5, sleep: 'great', soreness: ['mild'], bleeding: 'no', motivation: 5, minutes: 60 },
  { energy: 3, sleep: 'ok', soreness: ['mild'], bleeding: 'no', motivation: 3, minutes: 45 },
  { energy: 2, sleep: 'poor', soreness: ['none'], bleeding: 'no', motivation: 2, minutes: 30 },
  { energy: 4, sleep: 'good', soreness: ['none'], bleeding: 'no', motivation: 4, minutes: 45 },
];

export function loadDemoData() {
  const store = useApp.getState();
  const today = new Date();

  // Period started 24 days ago → today is late luteal; next period expected soon.
  const periodStart = isoDate(addDays(today, -24));
  useApp.setState({ periods: [{ start: isoDate(addDays(today, -52)), end: isoDate(addDays(today, -48)) }, { start: periodStart, end: isoDate(addDays(today, -20)) }] });

  const sessions: Session[] = [];
  const offsets = [-20, -18, -15, -13, -11, -8, -6, -4, -1];
  offsets.forEach((off, n) => {
    const date = addDays(today, off);
    const checkin = DEMO_CHECKINS[n % DEMO_CHECKINS.length];
    const decision = decide(checkin, cycleInputOf(useApp.getState()), { today: date, lastRpe: 7 });
    const { day, items } = buildPlan({
      profile: store.profile,
      splitIndex: n,
      decision,
      minutes: checkin.minutes,
      history: historyOf(sessions),
    });
    const logs: Record<string, SetLog[]> = {};
    for (const it of items) {
      const w = it.loadable ? (it.weightKg ?? (it.equipment === 'barbell' ? 30 : it.equipment === 'dumbbell' ? 8 : 25)) : null;
      logs[it.slug] = Array.from({ length: it.sets }, () => ({ reps: it.reps, weightKg: w, done: true }));
    }
    sessions.push({
      id: `demo-${n}`,
      date: isoDate(date),
      dayName: day?.name ?? null,
      checkin,
      sleepHours: [7.5, 8, 6.5, 5.5, 7][n % 5],
      decision,
      items,
      logs,
      status: 'done',
      rpe: [6, 7, 7, 8, 6][n % 5],
      helpful: n % 4 !== 3,
      finishedAt: date.toISOString(),
    });
  });

  // Keep the user's own sessions (e.g. today's), replace older demo ones.
  const own = useApp.getState().sessions.filter((x) => !x.id.startsWith('demo-'));
  useApp.setState({ sessions: [...sessions, ...own].sort((a, b) => a.date.localeCompare(b.date)) });
}
