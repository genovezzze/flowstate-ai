// Run: npm test   (uses node --experimental-strip-types, no extra deps)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyAdjustment, buildPlan, cycleState, decide, EXERCISE_BY_SLUG, EXERCISES, readinessScore, splitFor, swapOptions } from '../index.ts';

const today = new Date(2026, 8, 25); // 25 Sep 2026
const natural = { lastPeriodStart: '2026-09-25', cycleLength: 28, periodLength: 5, irregular: false, contraception: 'none' };
const good = { energy: 4, sleep: 'good', soreness: ['none'], bleeding: 'no', motivation: 4, minutes: 45 };

test('cycle: day 1 is menstrual', () => {
  const s = cycleState(natural, today);
  assert.equal(s.day, 1);
  assert.equal(s.phase, 'menstrual');
  assert.equal(s.confidence, 'high');
});

test('cycle: phases across a 28-day cycle', () => {
  const at = (d) => cycleState(natural, new Date(2026, 8, 25 + d - 1)).phase;
  assert.equal(at(5), 'menstrual');
  assert.equal(at(8), 'follicular');
  assert.equal(at(14), 'ovulatory');
  assert.equal(at(20), 'luteal');
  assert.equal(at(26), 'late_luteal');
  assert.equal(at(29), 'menstrual'); // next cycle
});

test('cycle: hormonal contraception has no phase', () => {
  const s = cycleState({ ...natural, contraception: 'pill' }, today);
  assert.equal(s.phase, null);
  assert.equal(s.hormonal, true);
  assert.equal(s.confidence, 'low');
});

test('cycle: missing date → unknown', () => {
  assert.equal(cycleState({ ...natural, lastPeriodStart: null }, today).day, null);
});

test('readiness: bounds 1..7', () => {
  const worst = { energy: 1, sleep: 'poor', soreness: ['worse_than_usual'], bleeding: 'no', motivation: 1, minutes: 20 };
  const best = { energy: 5, sleep: 'great', soreness: ['none'], bleeding: 'no', motivation: 5, minutes: 60 };
  assert.equal(readinessScore(worst, 10), 1);
  assert.equal(readinessScore(best, 6), 7);
});

test('good day in follicular phase → PUSH', () => {
  const best = { energy: 5, sleep: 'great', soreness: ['none'], bleeding: 'no', motivation: 5, minutes: 45 };
  const d = decide(best, { ...natural, lastPeriodStart: '2026-09-17' }, { today }); // day 9
  assert.equal(d.cycle.phase, 'follicular');
  assert.equal(d.verdict, 'PUSH');
  assert.equal(d.adjustmentPct, 5);
});

test('pain worse than usual → RECOVER + red flag', () => {
  const d = decide({ ...good, soreness: ['worse_than_usual'] }, natural, { today });
  assert.equal(d.verdict, 'RECOVER');
  assert.equal(d.redFlag, true);
  assert.match(d.why.join(' '), /doctor/);
});

test('menstrual day 1 with cramps → MODIFY, no heavy / axial / core', () => {
  const d = decide({ ...good, soreness: ['cramps'], bleeding: 'yes', bleedingLevel: 'medium' }, natural, { today });
  assert.equal(d.verdict, 'MODIFY');
  assert.ok(d.adjustmentPct < 0);
  for (const t of ['heavy', 'axial_heavy', 'core_intense']) assert.ok(d.avoidTags.includes(t), t);
});

test('adjustment never outside -40..+5', () => {
  for (const energy of [1, 2, 3, 4, 5])
    for (const sleep of ['poor', 'ok', 'good', 'great'])
      for (const motivation of [1, 3, 5]) {
        const d = decide({ ...good, energy, sleep, motivation }, natural, { today });
        assert.ok(d.adjustmentPct >= -40 && d.adjustmentPct <= 5);
      }
});

const item = (over) => ({ slug: 'x', name: 'X', sets: 3, reps: 8, restSec: 90, weightKg: null, loadable: false, intensity: 'moderate', equipment: 'bodyweight', tags: [], hint: '', ...over });
const profile = { goal: 'muscle', experience: 'intermediate', daysPerWeek: 3, equipment: 'gym', limitations: [] };

test('bodyweight exercise never gets a weight hint', () => {
  const d = decide({ ...good, energy: 2, sleep: 'poor' }, natural, { today });
  const out = applyAdjustment(item({ slug: 'push-up' }), d);
  assert.equal(out.weightKg, null);
  assert.doesNotMatch(out.hint, /weight|kg/i);
  assert.ok(out.reps < 8);
});

test('dumbbell weight is reduced and rounded to 1 kg', () => {
  const d = decide({ ...good, energy: 2, sleep: 'ok' }, natural, { today });
  const out = applyAdjustment(item({ weightKg: 8, loadable: true, equipment: 'dumbbell' }), d);
  assert.ok(out.weightKg < 8);
  assert.equal(out.weightKg % 1, 0);
});

test('unknown weight → asks to pick a weight, not "0 kg"', () => {
  const d = decide(good, natural, { today });
  const out = applyAdjustment(item({ loadable: true, equipment: 'dumbbell' }), d);
  assert.equal(out.weightKg, null);
  assert.match(out.hint, /Pick a weight/);
});

test('library: every substitute exists and slugs are unique', () => {
  const slugs = new Set();
  for (const e of EXERCISES) {
    assert.ok(!slugs.has(e.slug), e.slug);
    slugs.add(e.slug);
    for (const s of e.substitutes) assert.ok(EXERCISE_BY_SLUG[s], `${e.slug} → ${s}`);
  }
});

test('split sizes', () => {
  assert.equal(splitFor(2).length, 2);
  assert.equal(splitFor(3).length, 3);
  assert.equal(splitFor(4).length, 4);
});

test('plan respects time budget and has no duplicates', () => {
  const d = decide(good, natural, { today: new Date(2026, 9, 3) });
  for (const minutes of [20, 30, 45, 60]) {
    for (let i = 0; i < 4; i++) {
      const { items } = buildPlan({ profile, splitIndex: i, decision: d, minutes });
      assert.ok(items.length > 0 && items.length <= { 20: 3, 30: 4, 45: 5, 60: 7 }[minutes]);
      assert.equal(new Set(items.map((x) => x.slug)).size, items.length);
    }
  }
});

test('cramps on day 1 → no heavy, axial or core-intense exercises', () => {
  const d = decide({ ...good, soreness: ['cramps'], bleeding: 'yes', bleedingLevel: 'heavy' }, natural, { today });
  for (let i = 0; i < 3; i++) {
    const { items } = buildPlan({ profile, splitIndex: i, decision: d, minutes: 60 });
    for (const x of items) {
      const e = EXERCISE_BY_SLUG[x.slug];
      assert.notEqual(e.intensity, 'heavy', x.slug);
      assert.ok(!e.tags.some((t) => ['axial_heavy', 'core_intense', 'high_impact'].includes(t)), x.slug);
    }
  }
});

test('equipment + limitations are respected', () => {
  const p = { ...profile, equipment: 'bodyweight', limitations: ['wrists'] };
  const d = decide(good, natural, { today: new Date(2026, 9, 3) });
  const { items } = buildPlan({ profile: p, splitIndex: 0, decision: d, minutes: 60 });
  for (const x of items) {
    assert.ok(['bodyweight', 'band'].includes(x.equipment), x.slug);
    assert.ok(!x.tags.includes('wrist_load'), x.slug);
  }
});

test('beginner never gets heavy exercises', () => {
  const p = { ...profile, experience: 'beginner' };
  const d = decide({ ...good, energy: 5, sleep: 'great', motivation: 5 }, natural, { today: new Date(2026, 9, 3) });
  for (let i = 0; i < 3; i++)
    for (const x of buildPlan({ profile: p, splitIndex: i, decision: d, minutes: 60 }).items) assert.notEqual(x.intensity, 'heavy');
});

test('red flag → recovery session only', () => {
  const d = decide({ ...good, soreness: ['worse_than_usual'] }, natural, { today });
  const { day, items } = buildPlan({ profile, splitIndex: 0, decision: d, minutes: 45 });
  assert.equal(day, null);
  for (const x of items) assert.equal(x.intensity, 'light');
});

test('progression: +weight when last session was easy and today is normal', () => {
  const d = decide(good, natural, { today: new Date(2026, 9, 3) });
  const { items } = buildPlan({ profile, splitIndex: 0, decision: d, minutes: 60 });
  const first = items.find((x) => x.loadable);
  const history = { [first.slug]: { weightKg: 20, targetReps: first.reps, repsDone: [first.reps, first.reps, first.reps], rpe: 6 } };
  const next = buildPlan({ profile, splitIndex: 0, decision: d, minutes: 60, history }).items.find((x) => x.slug === first.slug);
  assert.ok(next.weightKg > 20, `${next.weightKg}`);
});

test('swap options are easier alternatives that pass the profile', () => {
  const opts = swapOptions('back-squat', profile);
  assert.ok(opts.length > 0);
  assert.ok(opts.every((e) => e.slug !== 'back-squat'));
});
