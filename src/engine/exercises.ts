/**
 * Starter exercise library (MVP). Must be reviewed by the coach (Aļika) — see SPEC §9.
 * Pure data, no imports, so engine tests can load it with plain Node.
 *
 * Tags used by the engine:
 *  axial_heavy  – heavy spinal loading (avoid with cramps / heavy bleeding / back issues)
 *  high_impact  – jumps, running
 *  core_intense – hard bracing / crunching (avoid with cramps / bleeding)
 *  knee_stress, back_stress, overhead, wrist_load – mapped from onboarding limitations
 *  timed        – "reps" are seconds
 */

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'glutes'
  | 'push_h'
  | 'push_v'
  | 'pull_h'
  | 'pull_v'
  | 'arms'
  | 'core'
  | 'mobility'
  | 'cardio';

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'band';
export type Intensity = 'light' | 'moderate' | 'moderate_heavy' | 'heavy';

export type Exercise = {
  slug: string;
  name: string;
  pattern: Pattern;
  kind: 'compound' | 'isolation' | 'mobility';
  equipment: Equipment;
  intensity: Intensity;
  muscles: string[];
  tags: string[];
  sets: number;
  reps: number;
  restSec: number;
  /** Easier alternatives, first = preferred swap. */
  substitutes: string[];
  cues: string[];
};

export const EXERCISES: Exercise[] = [
  // ---------- Squat ----------
  { slug: 'goblet-squat', name: 'Goblet Squat', pattern: 'squat', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate', muscles: ['Quads', 'Glutes'], tags: ['knee_stress'], sets: 3, reps: 10, restSec: 90, substitutes: ['box-squat', 'leg-press'], cues: ['Hold the dumbbell at your chest', 'Sit between your heels, chest up', 'Knees track over toes', 'Push the floor away to stand'] },
  { slug: 'back-squat', name: 'Barbell Back Squat', pattern: 'squat', kind: 'compound', equipment: 'barbell', intensity: 'heavy', muscles: ['Quads', 'Glutes', 'Core'], tags: ['axial_heavy', 'knee_stress', 'back_stress'], sets: 4, reps: 6, restSec: 150, substitutes: ['goblet-squat', 'leg-press'], cues: ['Bar on upper back, grip tight', 'Brace before you descend', 'Hips and knees bend together', 'Drive up through mid-foot'] },
  { slug: 'leg-press', name: 'Leg Press', pattern: 'squat', kind: 'compound', equipment: 'machine', intensity: 'moderate_heavy', muscles: ['Quads', 'Glutes'], tags: ['knee_stress'], sets: 3, reps: 10, restSec: 120, substitutes: ['goblet-squat', 'box-squat'], cues: ['Feet hip-width in the middle of the plate', 'Lower until hips start to tuck', 'Do not lock knees at the top'] },
  { slug: 'box-squat', name: 'Bodyweight Box Squat', pattern: 'squat', kind: 'compound', equipment: 'bodyweight', intensity: 'light', muscles: ['Quads', 'Glutes'], tags: ['bodyweight'], sets: 3, reps: 12, restSec: 60, substitutes: ['glute-bridge'], cues: ['Sit back to a bench', 'Touch lightly, do not collapse', 'Stand tall and squeeze glutes'] },

  // ---------- Hinge ----------
  { slug: 'romanian-deadlift', name: 'Romanian Deadlift (Dumbbell)', pattern: 'hinge', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate_heavy', muscles: ['Hamstrings', 'Glutes'], tags: ['back_stress'], sets: 3, reps: 10, restSec: 90, substitutes: ['hip-thrust', 'glute-bridge'], cues: ['Soft knees, push hips back', 'Dumbbells slide along your legs', 'Flat back, stop at mid-shin', 'Squeeze glutes to stand'] },
  { slug: 'deadlift', name: 'Barbell Deadlift', pattern: 'hinge', kind: 'compound', equipment: 'barbell', intensity: 'heavy', muscles: ['Hamstrings', 'Glutes', 'Back'], tags: ['axial_heavy', 'back_stress'], sets: 3, reps: 5, restSec: 180, substitutes: ['romanian-deadlift', 'hip-thrust'], cues: ['Bar over mid-foot', 'Brace and pull slack out of the bar', 'Push the floor away', 'Lock out with glutes, not your lower back'] },
  { slug: 'kb-swing', name: 'Kettlebell Swing', pattern: 'hinge', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate', muscles: ['Glutes', 'Hamstrings'], tags: ['high_impact', 'back_stress'], sets: 3, reps: 15, restSec: 60, substitutes: ['glute-bridge'], cues: ['Hike the bell back between legs', 'Snap hips forward', 'Arms just guide the bell'] },

  // ---------- Lunge ----------
  { slug: 'reverse-lunge', name: 'Reverse Lunge (Dumbbell)', pattern: 'lunge', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate', muscles: ['Quads', 'Glutes'], tags: ['knee_stress'], sets: 3, reps: 8, restSec: 75, substitutes: ['step-up', 'box-squat'], cues: ['Step back, not to the side', 'Both knees ~90°', 'Push through the front heel'] },
  { slug: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', pattern: 'lunge', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate_heavy', muscles: ['Quads', 'Glutes'], tags: ['knee_stress'], sets: 3, reps: 8, restSec: 90, substitutes: ['reverse-lunge', 'step-up'], cues: ['Rear foot on a bench', 'Lean slightly forward for more glutes', 'Control the way down'] },
  { slug: 'step-up', name: 'Step-Up', pattern: 'lunge', kind: 'compound', equipment: 'bodyweight', intensity: 'light', muscles: ['Quads', 'Glutes'], tags: ['bodyweight'], sets: 3, reps: 10, restSec: 60, substitutes: ['box-squat'], cues: ['Whole foot on the box', 'Drive through the top leg', 'Step down slowly'] },

  // ---------- Glutes ----------
  { slug: 'hip-thrust', name: 'Hip Thrust', pattern: 'glutes', kind: 'compound', equipment: 'barbell', intensity: 'moderate_heavy', muscles: ['Glutes'], tags: [], sets: 3, reps: 10, restSec: 90, substitutes: ['glute-bridge', 'cable-kickback'], cues: ['Upper back on bench, chin tucked', 'Shins vertical at the top', 'Pause and squeeze for 1 second'] },
  { slug: 'glute-bridge', name: 'Glute Bridge', pattern: 'glutes', kind: 'compound', equipment: 'bodyweight', intensity: 'light', muscles: ['Glutes'], tags: ['bodyweight'], sets: 3, reps: 12, restSec: 45, substitutes: [], cues: ['Feet close to hips', 'Press through heels', 'Ribs down, squeeze at the top'] },
  { slug: 'cable-kickback', name: 'Cable Glute Kickback', pattern: 'glutes', kind: 'isolation', equipment: 'cable', intensity: 'moderate', muscles: ['Glutes'], tags: [], sets: 3, reps: 12, restSec: 45, substitutes: ['glute-bridge'], cues: ['Slight forward lean', 'Kick back and slightly out', 'Do not arch your lower back'] },
  { slug: 'hip-abduction', name: 'Hip Abduction Machine', pattern: 'glutes', kind: 'isolation', equipment: 'machine', intensity: 'light', muscles: ['Glute medius'], tags: [], sets: 3, reps: 15, restSec: 45, substitutes: ['banded-side-walk'], cues: ['Sit tall', 'Push knees out with control', 'Slow on the way back'] },
  { slug: 'banded-side-walk', name: 'Banded Side Walk', pattern: 'glutes', kind: 'isolation', equipment: 'band', intensity: 'light', muscles: ['Glute medius'], tags: ['bodyweight'], sets: 2, reps: 12, restSec: 30, substitutes: [], cues: ['Band above knees', 'Half squat position', 'Small steps, keep tension'] },

  // ---------- Push horizontal ----------
  { slug: 'db-bench-press', name: 'Dumbbell Bench Press', pattern: 'push_h', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate_heavy', muscles: ['Chest', 'Triceps'], tags: [], sets: 3, reps: 10, restSec: 90, substitutes: ['incline-push-up', 'machine-chest-press'], cues: ['Shoulder blades pulled back', 'Lower to chest level', 'Press up and slightly in'] },
  { slug: 'machine-chest-press', name: 'Machine Chest Press', pattern: 'push_h', kind: 'compound', equipment: 'machine', intensity: 'moderate', muscles: ['Chest', 'Triceps'], tags: [], sets: 3, reps: 10, restSec: 75, substitutes: ['incline-push-up'], cues: ['Handles at mid-chest', 'Press without shrugging', 'Slow return'] },
  { slug: 'push-up', name: 'Push-Up', pattern: 'push_h', kind: 'compound', equipment: 'bodyweight', intensity: 'moderate', muscles: ['Chest', 'Triceps', 'Core'], tags: ['bodyweight', 'wrist_load'], sets: 3, reps: 8, restSec: 90, substitutes: ['incline-push-up'], cues: ['Hands under shoulders', 'Body in one straight line', 'Chest to the floor, elbows ~45°'] },
  { slug: 'incline-push-up', name: 'Incline Push-Up', pattern: 'push_h', kind: 'compound', equipment: 'bodyweight', intensity: 'light', muscles: ['Chest', 'Triceps'], tags: ['bodyweight', 'wrist_load'], sets: 3, reps: 10, restSec: 60, substitutes: [], cues: ['Hands on a bench', 'Straight line head to heels', 'Chest to the edge'] },

  // ---------- Push vertical ----------
  { slug: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', pattern: 'push_v', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate_heavy', muscles: ['Shoulders', 'Triceps'], tags: ['overhead'], sets: 3, reps: 10, restSec: 90, substitutes: ['lateral-raise', 'landmine-press'], cues: ['Seated or standing, ribs down', 'Press up and slightly back', 'Do not arch your lower back'] },
  { slug: 'landmine-press', name: 'Landmine Press', pattern: 'push_v', kind: 'compound', equipment: 'barbell', intensity: 'moderate', muscles: ['Shoulders', 'Chest'], tags: [], sets: 3, reps: 10, restSec: 75, substitutes: ['lateral-raise'], cues: ['Half-kneeling or standing', 'Press up and forward', 'Keep core braced'] },
  { slug: 'lateral-raise', name: 'Lateral Raise', pattern: 'push_v', kind: 'isolation', equipment: 'dumbbell', intensity: 'light', muscles: ['Side delts'], tags: [], sets: 3, reps: 12, restSec: 45, substitutes: [], cues: ['Soft elbows', 'Lead with elbows to shoulder height', 'Lower slowly'] },

  // ---------- Pull horizontal ----------
  { slug: 'db-row', name: 'One-Arm Dumbbell Row', pattern: 'pull_h', kind: 'compound', equipment: 'dumbbell', intensity: 'moderate', muscles: ['Back', 'Biceps'], tags: [], sets: 3, reps: 10, restSec: 60, substitutes: ['seated-cable-row', 'band-row'], cues: ['Hand and knee on bench', 'Pull elbow to your hip', 'No twisting'] },
  { slug: 'seated-cable-row', name: 'Seated Cable Row', pattern: 'pull_h', kind: 'compound', equipment: 'cable', intensity: 'moderate', muscles: ['Back', 'Biceps'], tags: [], sets: 3, reps: 10, restSec: 75, substitutes: ['band-row'], cues: ['Sit tall', 'Pull to your belly button', 'Squeeze shoulder blades'] },
  { slug: 'band-row', name: 'Band Row', pattern: 'pull_h', kind: 'compound', equipment: 'band', intensity: 'light', muscles: ['Back'], tags: ['bodyweight'], sets: 3, reps: 15, restSec: 45, substitutes: [], cues: ['Anchor band at chest height', 'Elbows back, shoulders down'] },

  // ---------- Pull vertical ----------
  { slug: 'lat-pulldown', name: 'Lat Pulldown', pattern: 'pull_v', kind: 'compound', equipment: 'cable', intensity: 'moderate', muscles: ['Lats', 'Biceps'], tags: [], sets: 3, reps: 10, restSec: 90, substitutes: ['band-pulldown', 'seated-cable-row'], cues: ['Grip just wider than shoulders', 'Pull bar to upper chest', 'Lead with elbows, chest up'] },
  { slug: 'assisted-pull-up', name: 'Assisted Pull-Up', pattern: 'pull_v', kind: 'compound', equipment: 'machine', intensity: 'moderate_heavy', muscles: ['Lats', 'Biceps'], tags: [], sets: 3, reps: 6, restSec: 120, substitutes: ['lat-pulldown'], cues: ['Full hang at the bottom', 'Chin over the bar', 'Control the descent'] },
  { slug: 'band-pulldown', name: 'Band Pulldown', pattern: 'pull_v', kind: 'compound', equipment: 'band', intensity: 'light', muscles: ['Lats'], tags: ['bodyweight'], sets: 3, reps: 15, restSec: 45, substitutes: [], cues: ['Anchor band high', 'Pull elbows down to ribs'] },

  // ---------- Arms ----------
  { slug: 'db-curl-alt', name: 'Bicep Curl (Dumbbell, Alternating)', pattern: 'arms', kind: 'isolation', equipment: 'dumbbell', intensity: 'moderate', muscles: ['Biceps'], tags: [], sets: 3, reps: 8, restSec: 60, substitutes: ['hammer-curl'], cues: ['Seated or standing', 'Curl one dumbbell, rotating palm up', 'Lower slowly, alternate sides'] },
  { slug: 'hammer-curl', name: 'Hammer Curl', pattern: 'arms', kind: 'isolation', equipment: 'dumbbell', intensity: 'light', muscles: ['Biceps', 'Forearms'], tags: [], sets: 3, reps: 10, restSec: 45, substitutes: [], cues: ['Palms face each other', 'Elbows fixed at your sides'] },
  { slug: 'triceps-pushdown', name: 'Triceps Pushdown', pattern: 'arms', kind: 'isolation', equipment: 'cable', intensity: 'moderate', muscles: ['Triceps'], tags: [], sets: 3, reps: 12, restSec: 45, substitutes: ['overhead-triceps'], cues: ['Elbows pinned to sides', 'Push down to full extension', 'Slow return'] },
  { slug: 'overhead-triceps', name: 'Overhead Triceps Extension', pattern: 'arms', kind: 'isolation', equipment: 'dumbbell', intensity: 'light', muscles: ['Triceps'], tags: ['overhead'], sets: 3, reps: 12, restSec: 45, substitutes: [], cues: ['Hold one dumbbell with both hands', 'Elbows point forward', 'Lower behind your head'] },

  // ---------- Core ----------
  { slug: 'plank', name: 'Plank', pattern: 'core', kind: 'isolation', equipment: 'bodyweight', intensity: 'moderate', muscles: ['Core'], tags: ['core_intense', 'bodyweight', 'timed'], sets: 3, reps: 30, restSec: 45, substitutes: ['dead-bug'], cues: ['Elbows under shoulders', 'Squeeze glutes, ribs down', 'Breathe steadily'] },
  { slug: 'dead-bug', name: 'Dead Bug', pattern: 'core', kind: 'isolation', equipment: 'bodyweight', intensity: 'light', muscles: ['Core'], tags: ['bodyweight'], sets: 3, reps: 8, restSec: 30, substitutes: ['cat-cow'], cues: ['Lower back gently pressed down', 'Opposite arm and leg reach', 'Move slowly'] },
  { slug: 'cable-crunch', name: 'Cable Crunch', pattern: 'core', kind: 'isolation', equipment: 'cable', intensity: 'moderate', muscles: ['Abs'], tags: ['core_intense'], sets: 3, reps: 12, restSec: 45, substitutes: ['dead-bug'], cues: ['Kneel facing the cable', 'Curl ribs toward hips', 'Hips stay still'] },

  // ---------- Mobility / recovery ----------
  { slug: 'hip-circle', name: 'Hip Circle (Standing)', pattern: 'mobility', kind: 'mobility', equipment: 'bodyweight', intensity: 'light', muscles: ['Hips'], tags: ['bodyweight'], sets: 2, reps: 10, restSec: 30, substitutes: [], cues: ['Hands on hips', 'Big slow circles', 'Both directions'] },
  { slug: 'cat-cow', name: 'Cat-Cow', pattern: 'mobility', kind: 'mobility', equipment: 'bodyweight', intensity: 'light', muscles: ['Spine'], tags: ['bodyweight'], sets: 2, reps: 10, restSec: 20, substitutes: [], cues: ['On hands and knees', 'Round, then arch, with your breath'] },
  { slug: 'childs-pose', name: "Child's Pose Breathing", pattern: 'mobility', kind: 'mobility', equipment: 'bodyweight', intensity: 'light', muscles: ['Back', 'Hips'], tags: ['bodyweight', 'timed'], sets: 2, reps: 45, restSec: 15, substitutes: [], cues: ['Knees wide, hips to heels', 'Slow breaths into your lower back'] },
  { slug: 'worlds-greatest', name: "World's Greatest Stretch", pattern: 'mobility', kind: 'mobility', equipment: 'bodyweight', intensity: 'light', muscles: ['Hips', 'Thoracic spine'], tags: ['bodyweight'], sets: 2, reps: 5, restSec: 20, substitutes: [], cues: ['Lunge forward, hand inside foot', 'Rotate and reach to the ceiling'] },
  { slug: 'easy-walk', name: 'Easy Walk', pattern: 'cardio', kind: 'mobility', equipment: 'bodyweight', intensity: 'light', muscles: ['Full body'], tags: ['bodyweight', 'timed'], sets: 1, reps: 900, restSec: 0, substitutes: [], cues: ['Comfortable pace', 'You should be able to chat'] },
];

export const EXERCISE_BY_SLUG: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.slug, e]));
