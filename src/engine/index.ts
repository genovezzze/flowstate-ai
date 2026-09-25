/**
 * FlowState recommendation engine — pure TypeScript, no React / network.
 * Rules follow docs/SPEC.md §6. Every rule change needs a test in __tests__.
 *
 * Keep this file free of path aliases and non-erasable TS syntax (enums etc.)
 * so the tests can run with plain `node --experimental-strip-types`.
 */

import { EXERCISE_BY_SLUG, EXERCISES, type Equipment, type Exercise, type Intensity, type Pattern } from './exercises.ts';

export { EXERCISES, EXERCISE_BY_SLUG } from './exercises.ts';
export type { Exercise, Pattern, Equipment, Intensity } from './exercises.ts';

// ---------- Types ----------

export type Energy = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 'poor' | 'ok' | 'good' | 'great';
export type Soreness = 'none' | 'mild' | 'strong' | 'cramps' | 'worse_than_usual';
export type Bleeding = 'yes' | 'spotting' | 'no';
export type BleedingLevel = 'light' | 'medium' | 'heavy';
export type Motivation = 1 | 2 | 3 | 4 | 5;
export type Minutes = 20 | 30 | 45 | 60;

export type Checkin = {
  energy: Energy;
  sleep: SleepQuality;
  soreness: Soreness[];
  bleeding: Bleeding;
  bleedingLevel?: BleedingLevel;
  motivation: Motivation;
  minutes: Minutes;
};

export type Contraception =
  | 'none'
  | 'pill'
  | 'hormonal_iud'
  | 'copper_iud'
  | 'implant_ring_patch'
  | 'other'
  | 'undisclosed';

export type CycleInput = {
  lastPeriodStart: string | null; // ISO date YYYY-MM-DD
  cycleLength: number; // 21..40
  periodLength: number; // 2..8
  irregular: boolean;
  contraception: Contraception;
};

export type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'late_luteal';

export type CycleState = {
  day: number | null;
  phase: Phase | null;
  confidence: 'high' | 'low';
  hormonal: boolean;
};

export type Verdict = 'PUSH' | 'AS_PLANNED' | 'REDUCE' | 'MODIFY' | 'RECOVER';

export type Factor = { key: string; label: string; impact: 'up' | 'down' | 'neutral' };

export type Decision = {
  verdict: Verdict;
  adjustmentPct: number; // -40..+5
  readiness: number; // 1..7
  readinessLabel: string;
  cycle: CycleState;
  factors: Factor[];
  redFlag: boolean;
  avoidTags: string[]; // exercise tags to exclude (MODIFY)
  headline: string;
  why: string[];
  alternative: string;
};

// ---------- Cycle ----------

const HORMONAL: Contraception[] = ['pill', 'hormonal_iud', 'implant_ring_patch'];

export function daysBetween(fromIso: string, to: Date): number {
  const [y, m, d] = fromIso.split('-').map(Number);
  const from = Date.UTC(y, m - 1, d);
  const t = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((t - from) / 86_400_000);
}

export function cycleState(input: CycleInput, today: Date): CycleState {
  const hormonal = HORMONAL.includes(input.contraception);
  if (!input.lastPeriodStart) return { day: null, phase: null, confidence: 'low', hormonal };

  const diff = daysBetween(input.lastPeriodStart, today);
  if (diff < 0) return { day: null, phase: null, confidence: 'low', hormonal };

  const L = clamp(Math.round(input.cycleLength || 28), 21, 40);
  const P = clamp(Math.round(input.periodLength || 5), 2, 8);
  const day = (diff % L) + 1;
  // Long gap since last logged period → prediction is unreliable.
  const stale = diff >= L * 2;

  const ovulation = L - 14;
  let phase: Phase;
  if (day <= P) phase = 'menstrual';
  else if (day >= ovulation - 1 && day <= ovulation + 1) phase = 'ovulatory';
  else if (day < ovulation - 1) phase = 'follicular';
  else if (day > L - 5) phase = 'late_luteal';
  else phase = 'luteal';

  const confidence = input.irregular || hormonal || stale ? 'low' : 'high';
  return { day, phase: hormonal ? null : phase, confidence, hormonal };
}

export const PHASE_LABEL: Record<Phase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
  late_luteal: 'Late luteal',
};

// ---------- Readiness ----------

const SLEEP_SCORE: Record<SleepQuality, number> = { poor: 0, ok: 0.4, good: 0.75, great: 1 };
const SORENESS_SCORE: Record<Soreness, number> = {
  none: 1,
  mild: 0.7,
  strong: 0.3,
  cramps: 0.4,
  worse_than_usual: 0,
};

/** lastRpe: RPE of the previous session (1..10) or null. */
export function readinessScore(c: Checkin, lastRpe: number | null): number {
  const energy = (c.energy - 1) / 4;
  const sleep = SLEEP_SCORE[c.sleep];
  const soreness = c.soreness.length ? Math.min(...c.soreness.map((s) => SORENESS_SCORE[s])) : 1;
  const motivation = (c.motivation - 1) / 4;
  const prev = lastRpe == null ? 0.7 : lastRpe <= 7 ? 1 : lastRpe === 8 ? 0.6 : 0.3;

  const score = 0.3 * energy + 0.25 * sleep + 0.2 * soreness + 0.15 * motivation + 0.1 * prev;
  return 1 + Math.round(score * 6); // 1..7
}

export function readinessLabel(r: number): string {
  if (r <= 2) return 'Low';
  if (r <= 3) return 'Moderate';
  if (r <= 6) return 'Ready';
  return 'Peak';
}

// ---------- Decision ----------

const READINESS_MOD: Record<number, number> = { 7: 5, 6: 0, 5: 0, 4: -10, 3: -20, 2: -30, 1: -40 };

export function decide(
  c: Checkin,
  cycleInput: CycleInput,
  opts: { today?: Date; lastRpe?: number | null } = {},
): Decision {
  const today = opts.today ?? new Date();
  const cycle = cycleState(cycleInput, today);
  const readiness = readinessScore(c, opts.lastRpe ?? null);
  const factors: Factor[] = [];

  const heavyBleeding = c.bleeding === 'yes' && c.bleedingLevel === 'heavy';
  const worsePain = c.soreness.includes('worse_than_usual');
  const cramps = c.soreness.includes('cramps');

  // Red flags first (§6.8)
  const redFlag = worsePain || (heavyBleeding && c.sleep === 'poor' && c.energy === 1);

  // Phase modifier — only when we trust the phase (§6.3/6.4)
  let phaseMod = 0;
  const effectivePhase: Phase | null = cycle.phase ?? (c.bleeding === 'yes' ? 'menstrual' : null);
  if (cycle.confidence === 'high' && cycle.phase) {
    if (cycle.phase === 'menstrual' && (heavyBleeding || cramps)) phaseMod = -10;
    else if ((cycle.phase === 'follicular' || cycle.phase === 'ovulatory') && readiness >= 6) phaseMod = 5;
    else if (cycle.phase === 'late_luteal') phaseMod = -5;
  } else if (heavyBleeding || (c.bleeding === 'yes' && cramps)) {
    // Symptoms still count without a reliable phase (e.g. withdrawal bleed on the pill).
    phaseMod = -10;
  }

  let adjustment = clamp(READINESS_MOD[readiness] + phaseMod, -40, 5);

  let verdict: Verdict;
  if (redFlag || readiness === 1 || adjustment < -30) verdict = 'RECOVER';
  else if (cramps || c.soreness.includes('strong')) verdict = 'MODIFY';
  else if (adjustment >= 5) verdict = 'PUSH';
  else if (adjustment >= -5) verdict = 'AS_PLANNED';
  else verdict = 'REDUCE';

  if (verdict === 'RECOVER') adjustment = -40;

  const avoidTags: string[] = [];
  if (cramps || c.bleeding === 'yes') avoidTags.push('core_intense', 'high_impact');
  if (cramps || heavyBleeding) avoidTags.push('axial_heavy');
  if (verdict === 'RECOVER' || effectivePhase === 'menstrual') avoidTags.push('heavy');

  // Factors shown as chips
  if (effectivePhase) {
    factors.push({
      key: 'phase',
      label: PHASE_LABEL[effectivePhase],
      impact: phaseMod < 0 ? 'down' : phaseMod > 0 ? 'up' : 'neutral',
    });
  } else if (cycle.hormonal) {
    factors.push({ key: 'phase', label: 'Hormonal contraception', impact: 'neutral' });
  }
  factors.push({
    key: 'readiness',
    label: `Readiness ${readiness}/7`,
    impact: readiness >= 6 ? 'up' : readiness <= 4 ? 'down' : 'neutral',
  });
  if (c.sleep === 'poor' || c.sleep === 'ok') factors.push({ key: 'sleep', label: `Sleep: ${c.sleep}`, impact: 'down' });
  if (adjustment !== 0)
    factors.push({ key: 'volume', label: `${adjustment > 0 ? '+' : '−'}${Math.abs(adjustment)}% volume`, impact: adjustment > 0 ? 'up' : 'down' });

  const { headline, why, alternative } = explainTemplate(verdict, adjustment, c, effectivePhase, readiness, redFlag);

  return {
    verdict,
    adjustmentPct: adjustment,
    readiness,
    readinessLabel: readinessLabel(readiness),
    cycle,
    factors,
    redFlag,
    avoidTags: Array.from(new Set(avoidTags)),
    headline,
    why,
    alternative,
  };
}

// ---------- Template explanation (fallback when AI is unavailable) ----------

function explainTemplate(
  verdict: Verdict,
  adj: number,
  c: Checkin,
  phase: Phase | null,
  readiness: number,
  redFlag: boolean,
): { headline: string; why: string[]; alternative: string } {
  if (redFlag) {
    return {
      headline: 'Rest and recover today',
      why: [
        'You reported pain that is worse than usual.',
        'If this pain is unusual for you, it is worth checking with a doctor.',
      ],
      alternative: 'A gentle 15-minute walk or light stretching, only if it feels good.',
    };
  }

  const why: string[] = [];
  if (c.energy <= 2) why.push('Your energy is low today.');
  if (c.sleep === 'poor') why.push('You slept poorly, which lowers strength and recovery.');
  if (c.soreness.includes('cramps')) why.push('Cramps — we swap moves that load the core and lower back.');
  if (c.soreness.includes('strong')) why.push('Strong soreness — we give those muscles a lighter day.');
  if (phase === 'menstrual') why.push('Early in your period strength can dip — lighter loads are fine.');
  if (phase === 'late_luteal') why.push('Pre-period days often feel heavier; a small reduction helps.');
  if ((phase === 'follicular' || phase === 'ovulatory') && readiness >= 6)
    why.push('You feel strong and your phase supports harder training.');
  if (c.motivation <= 2) why.push('Motivation is low — a shorter, easier plan is easier to finish.');
  if (why.length === 0) why.push(`Your readiness is ${readiness}/7 — a normal training day.`);

  switch (verdict) {
    case 'PUSH':
      return { headline: 'Good day to push a little', why, alternative: 'Keep your usual weights if the extra feels too much.' };
    case 'AS_PLANNED':
      return { headline: 'Train as planned', why, alternative: 'Stop 1–2 reps before failure if anything feels off.' };
    case 'REDUCE':
      return { headline: `Reduce intensity by ~${Math.abs(adj)}% today`, why, alternative: 'Keep your weights but stop 2 reps before failure.' };
    case 'MODIFY':
      return {
        headline: adj < 0 ? `Modify & reduce by ~${Math.abs(adj)}%` : 'Modify some exercises today',
        why,
        alternative: 'Use the Customize button to swap any move that does not feel right.',
      };
    case 'RECOVER':
      return { headline: 'Recovery day', why, alternative: 'Mobility, stretching or an easy walk — 15–25 minutes.' };
  }
}

// ---------- Profile & program (§5.1, §6.7) ----------

export type Goal = 'strength' | 'muscle' | 'tone' | 'weight_loss';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentAccess = 'gym' | 'dumbbells' | 'bodyweight';
export type Limitation = 'knees' | 'back' | 'shoulders' | 'wrists';

export type TrainingProfile = {
  goal: Goal;
  experience: Experience;
  daysPerWeek: 2 | 3 | 4 | 5;
  equipment: EquipmentAccess;
  limitations: Limitation[];
};

export type SplitDay = { key: string; name: string; slots: Pattern[] };

const FULL_A: SplitDay = { key: 'full_a', name: 'Full Body A', slots: ['squat', 'push_h', 'pull_v', 'hinge', 'glutes', 'arms', 'core'] };
const FULL_B: SplitDay = { key: 'full_b', name: 'Full Body B', slots: ['hinge', 'push_v', 'pull_h', 'lunge', 'glutes', 'arms', 'core'] };
const FULL_C: SplitDay = { key: 'full_c', name: 'Full Body C', slots: ['lunge', 'push_h', 'pull_h', 'squat', 'glutes', 'arms', 'core'] };
const UPPER_A: SplitDay = { key: 'upper_a', name: 'Upper A', slots: ['push_v', 'pull_v', 'push_h', 'pull_h', 'arms', 'arms', 'core'] };
const LOWER_A: SplitDay = { key: 'lower_a', name: 'Lower A', slots: ['squat', 'hinge', 'glutes', 'lunge', 'glutes', 'core'] };
const UPPER_B: SplitDay = { key: 'upper_b', name: 'Upper B', slots: ['push_h', 'pull_h', 'push_v', 'pull_v', 'arms', 'arms', 'core'] };
const LOWER_B: SplitDay = { key: 'lower_b', name: 'Lower B', slots: ['hinge', 'lunge', 'glutes', 'squat', 'glutes', 'core'] };

export function splitFor(daysPerWeek: number): SplitDay[] {
  if (daysPerWeek <= 2) return [FULL_A, FULL_B];
  if (daysPerWeek === 3) return [FULL_A, FULL_B, FULL_C];
  return [UPPER_A, LOWER_A, UPPER_B, LOWER_B];
}

const LIMITATION_TAGS: Record<Limitation, string[]> = {
  knees: ['knee_stress', 'high_impact'],
  back: ['axial_heavy', 'back_stress'],
  shoulders: ['overhead'],
  wrists: ['wrist_load'],
};

const EQUIPMENT_ALLOWED: Record<EquipmentAccess, Equipment[]> = {
  gym: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band'],
  dumbbells: ['dumbbell', 'bodyweight', 'band'],
  bodyweight: ['bodyweight', 'band'],
};

function profileAllows(e: Exercise, p: TrainingProfile): boolean {
  if (!EQUIPMENT_ALLOWED[p.equipment].includes(e.equipment)) return false;
  if (p.experience === 'beginner' && e.intensity === 'heavy') return false;
  const banned = p.limitations.flatMap((l) => LIMITATION_TAGS[l]);
  return !e.tags.some((t) => banned.includes(t));
}

function decisionAllows(e: Exercise, d: Decision): boolean {
  if (d.avoidTags.includes('heavy') && e.intensity === 'heavy') return false;
  return !e.tags.some((t) => d.avoidTags.includes(t));
}

/** Candidates for a movement pattern, best first (compound, harder first for experienced users). */
export function candidatesFor(pattern: Pattern, p: TrainingProfile): Exercise[] {
  const order: Intensity[] =
    p.experience === 'beginner'
      ? ['moderate', 'light', 'moderate_heavy', 'heavy']
      : ['moderate_heavy', 'heavy', 'moderate', 'light'];
  return EXERCISES.filter((e) => e.pattern === pattern && profileAllows(e, p)).sort(
    (a, b) => order.indexOf(a.intensity) - order.indexOf(b.intensity),
  );
}

/** Easier swap options for an exercise that pass profile (and decision, if given). */
export function swapOptions(slug: string, p: TrainingProfile, d?: Decision): Exercise[] {
  const ex = EXERCISE_BY_SLUG[slug];
  if (!ex) return [];
  const listed = ex.substitutes.map((s) => EXERCISE_BY_SLUG[s]).filter(Boolean);
  const samePattern = EXERCISES.filter((e) => e.pattern === ex.pattern && e.slug !== slug);
  const seen = new Set<string>();
  return [...listed, ...samePattern].filter((e) => {
    if (seen.has(e.slug)) return false;
    seen.add(e.slug);
    return profileAllows(e, p) && (!d || decisionAllows(e, d));
  });
}

// ---------- Building the day's plan (§6.5–6.7) ----------

export type PlanItem = {
  slug: string;
  name: string;
  sets: number;
  reps: number;
  restSec: number;
  /** null → bodyweight, or weight not known yet (see `loadable`). */
  weightKg: number | null;
  loadable: boolean;
  intensity: Intensity;
  equipment: Equipment;
  tags: string[];
  hint: string;
};

export type ExerciseHistory = {
  weightKg: number | null;
  targetReps: number;
  repsDone: number[];
  rpe: number | null;
};

const EXERCISES_FOR_MINUTES: Record<Minutes, number> = { 20: 3, 30: 4, 45: 5, 60: 7 };
const INTENSITY_ORDER: Intensity[] = ['light', 'moderate', 'moderate_heavy', 'heavy'];
const RECOVERY_SLUGS = ['cat-cow', 'hip-circle', 'worlds-greatest', 'childs-pose', 'easy-walk'];

export function buildPlan(args: {
  profile: TrainingProfile;
  splitIndex: number;
  decision: Decision;
  minutes: Minutes;
  history?: Record<string, ExerciseHistory>;
}): { day: SplitDay | null; items: PlanItem[] } {
  const { profile, splitIndex, decision: d, minutes } = args;
  const history = args.history ?? {};

  if (d.verdict === 'RECOVER') {
    const items = RECOVERY_SLUGS.map((s) => EXERCISE_BY_SLUG[s]).map((e) => ({
      ...toItem(e, null),
      hint: 'Move gently — stop if anything hurts',
    }));
    return { day: null, items: minutes <= 20 ? items.slice(0, 3) : items };
  }

  const split = splitFor(profile.daysPerWeek);
  const day = split[((splitIndex % split.length) + split.length) % split.length];
  const used = new Set<string>();
  const picked: Exercise[] = [];

  for (const slot of day.slots) {
    const options = candidatesFor(slot, profile).filter((e) => !used.has(e.slug));
    let choice = options.find((e) => decisionAllows(e, d));
    if (!choice && options[0]) choice = swapOptions(options[0].slug, profile, d).find((e) => !used.has(e.slug));
    if (choice) {
      used.add(choice.slug);
      picked.push(choice);
    }
  }

  const rank = (e: Exercise) => (e.kind === 'compound' ? 0 : e.kind === 'isolation' ? 1 : 2);
  const ordered = picked
    .map((e, i) => ({ e, i }))
    .sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i)
    .map((x) => x.e)
    .slice(0, EXERCISES_FOR_MINUTES[minutes]);

  const items = ordered.map((e) => itemFor(e, profile, d, history));
  return { day, items };
}

/** Full pipeline for one exercise: goal → progression → today's adjustment. Used for swaps too. */
export function itemFor(
  e: Exercise,
  profile: TrainingProfile,
  d: Decision,
  history: Record<string, ExerciseHistory> = {},
): PlanItem {
  if (d.verdict === 'RECOVER') return { ...toItem(e, null), hint: 'Move gently — stop if anything hurts' };
  const base = withGoal(toItem(e, history[e.slug]?.weightKg ?? null), profile.goal, e);
  const progressed = progress(base, history[e.slug], d);
  const out = applyAdjustment(progressed.item, d);
  if (progressed.note && d.adjustmentPct >= 0) out.hint = progressed.note;
  if (d.adjustmentPct <= -10) {
    const i = INTENSITY_ORDER.indexOf(out.intensity);
    out.intensity = INTENSITY_ORDER[Math.max(0, i - 1)];
  }
  return out;
}

function toItem(e: Exercise, weightKg: number | null): PlanItem {
  const loadable = e.equipment !== 'bodyweight' && e.equipment !== 'band';
  return {
    slug: e.slug,
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    restSec: e.restSec,
    weightKg: loadable ? weightKg : null,
    loadable,
    intensity: e.intensity,
    equipment: e.equipment,
    tags: e.tags,
    hint: '',
  };
}

function withGoal(item: PlanItem, goal: Goal, e: Exercise): PlanItem {
  if (item.tags.includes('timed') || e.kind === 'mobility') return item;
  if (goal === 'strength' && e.kind === 'compound')
    return { ...item, reps: Math.max(5, item.reps - 3), restSec: item.restSec + 30 };
  if (goal === 'tone' || goal === 'weight_loss')
    return { ...item, reps: item.reps + 2, restSec: Math.max(30, item.restSec - 15) };
  return item;
}

function progress(item: PlanItem, h: ExerciseHistory | undefined, d: Decision): { item: PlanItem; note?: string } {
  if (!h || h.weightKg == null || !item.loadable) return { item };
  const allDone = h.repsDone.length > 0 && h.repsDone.every((r) => r >= h.targetReps);
  const easy = h.rpe == null || h.rpe <= 7;
  if (allDone && easy && (d.verdict === 'PUSH' || d.verdict === 'AS_PLANNED')) {
    const step = item.equipment === 'barbell' || item.equipment === 'machine' ? 2.5 : 1;
    const w = h.weightKg + step;
    return { item: { ...item, weightKg: w }, note: `+${step} kg — you owned it last time` };
  }
  return { item, note: 'Maintain current weight — lock in technique' };
}

// ---------- Applying the adjustment to one exercise (§6.5) ----------

export function applyAdjustment(ex: PlanItem, d: Decision): PlanItem {
  const adj = d.adjustmentPct;
  let { sets, reps, restSec, weightKg } = ex;

  if (adj <= -20) {
    sets = Math.max(1, sets - 1);
    restSec += 30;
  }

  let hint: string;
  if (!ex.loadable) {
    // Bodyweight: never talk about weight, change reps instead.
    if (adj < 0 && !ex.tags.includes('timed')) reps = Math.max(3, reps - Math.min(3, Math.ceil(Math.abs(adj) / 10)));
    if (adj < 0 && ex.tags.includes('timed')) reps = Math.max(15, Math.round((reps * (100 + adj)) / 100 / 5) * 5);
    hint = adj < 0 ? 'Easier variation is fine — keep clean form' : 'Controlled reps, full range';
  } else if (weightKg == null) {
    hint = `Pick a weight you could lift ~${reps + (adj < 0 ? 4 : 2)} times`;
  } else {
    const step = ex.equipment === 'barbell' || ex.equipment === 'machine' ? 2.5 : 1;
    const target = roundTo(weightKg * (1 + adj / 100), step);
    weightKg = Math.max(step, target);
    hint =
      adj < 0
        ? `Use ~${formatKg(weightKg)} kg today — lock in technique`
        : adj > 0
          ? `Try ${formatKg(weightKg)} kg if the warm-up feels good`
          : 'Maintain current weight';
  }

  return { ...ex, sets, reps, restSec, weightKg, hint };
}

// ---------- utils ----------

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function roundTo(v: number, step: number) {
  return Math.round(v / step) * step;
}

function formatKg(v: number) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
