/**
 * Local-first sync: the app always works from the on-device store;
 * when signed in, changes are pushed to Neon (debounced) and pulled on sign-in / app start.
 */
import { apiFetch, backendEnabled } from './api';
import { useApp, type CoachMessage, type Session } from '@/state/app';

let timer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;
let applyingRemote = false;

export async function pull(userId: string) {
  if (!backendEnabled) return;
  const s = useApp.getState();
  // Different account on this phone → start clean so data never mixes.
  if (s.ownerId && s.ownerId !== userId) s.deleteAllData();
  useApp.setState({ ownerId: userId });

  const res = await apiFetch('/api/sync');
  if (!res.ok) return;
  const remote = (await res.json()) as {
    settings: { onboarded: boolean; profile: any; cycle: any; consents: any } | null;
    periods: { start: string; end?: string }[];
    sessions: Session[];
    coach: CoachMessage[];
  };

  applyingRemote = true;
  const local = useApp.getState();
  const byId = new Map<string, Session>();
  for (const x of remote.sessions) byId.set(x.id, x);
  for (const x of local.sessions) byId.set(x.id, x); // local edits win
  const coachIds = new Set(local.coach.map((m) => m.id));

  useApp.setState({
    ...(remote.settings && !local.onboarded
      ? {
          onboarded: remote.settings.onboarded,
          profile: remote.settings.profile ?? local.profile,
          cycle: remote.settings.cycle ?? local.cycle,
          consents: remote.settings.consents ?? local.consents,
        }
      : {}),
    periods: local.periods.length ? local.periods : remote.periods,
    sessions: [...byId.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-120),
    coach: [...remote.coach.filter((m) => !coachIds.has(m.id)), ...local.coach]
      .sort((a, b) => a.at.localeCompare(b.at))
      .slice(-200),
  });
  applyingRemote = false;
  await push();
}

export async function push() {
  if (!backendEnabled) return;
  const s = useApp.getState();
  if (!s.ownerId) return;
  await apiFetch('/api/sync', {
    method: 'PUT',
    body: JSON.stringify({
      settings: { onboarded: s.onboarded, profile: s.profile, cycle: s.cycle, consents: s.consents },
      periods: s.periods,
      sessions: s.sessions.slice(-60),
      coach: s.coach.slice(-100),
    }),
  }).catch(() => {});
}

export function startSync(userId: string) {
  stopSync();
  pull(userId).catch(() => {});
  unsubscribe = useApp.subscribe(() => {
    if (applyingRemote) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => push().catch(() => {}), 2000);
  });
}

export function stopSync() {
  unsubscribe?.();
  unsubscribe = null;
  if (timer) clearTimeout(timer);
  timer = null;
}
