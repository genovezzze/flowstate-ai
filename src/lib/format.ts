import type { Intensity, PlanItem } from '@/engine';
import { colors } from '@/theme/tokens';

export const INTENSITY: Record<Intensity, { label: string; dot: string }> = {
  light: { label: 'Light', dot: colors.ok },
  moderate: { label: 'Moderate', dot: '#5B7FD6' },
  moderate_heavy: { label: 'Moderate-heavy', dot: colors.amber },
  heavy: { label: 'Heavy', dot: colors.danger },
};

export const isTimed = (ex: Pick<PlanItem, 'tags'>) => ex.tags.includes('timed');

export function formatSeconds(s: number) {
  if (s >= 120) return `${Math.round(s / 60)} min`;
  return `${s} s`;
}

export function formatKg(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** "3×8 reps · 6 kg", "3×30 s", "15 min" */
export function formatVolume(ex: PlanItem) {
  if (isTimed(ex)) return ex.reps >= 120 ? formatSeconds(ex.reps) : `${ex.sets}×${ex.reps} s`;
  const w = ex.weightKg != null ? ` · ${formatKg(ex.weightKg)} kg` : '';
  return `${ex.sets}×${ex.reps} reps${w}`;
}
