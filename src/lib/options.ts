import type { Contraception, EquipmentAccess, Experience, Goal, Limitation, Minutes } from '@/engine';

export const TIME: { v: Minutes; label: string; sub: string }[] = [
  { v: 20, label: '20 min', sub: 'Quick & focused' },
  { v: 30, label: '30 min', sub: 'Tight but complete' },
  { v: 45, label: '45 min', sub: 'Standard session' },
  { v: 60, label: '60+ min', sub: 'Full workout' },
];

export const GOALS: { v: Goal; label: string; sub: string; emoji: string }[] = [
  { v: 'strength', label: 'Get stronger', sub: 'Heavier lifts, lower reps', emoji: '🏋️‍♀️' },
  { v: 'muscle', label: 'Build muscle', sub: 'Shape and size', emoji: '💪' },
  { v: 'tone', label: 'Tone & feel good', sub: 'Health, energy, consistency', emoji: '🌿' },
  { v: 'weight_loss', label: 'Lose weight', sub: 'More movement, shorter rests', emoji: '🔥' },
];

export const EXPERIENCE: { v: Experience; label: string; sub: string }[] = [
  { v: 'beginner', label: 'Just starting', sub: 'Less than 6 months' },
  { v: 'intermediate', label: 'Some experience', sub: '6 months – 2 years' },
  { v: 'advanced', label: 'Experienced', sub: '2+ years of regular training' },
];

export const DAYS: { v: 2 | 3 | 4 | 5; label: string; sub: string }[] = [
  { v: 2, label: '2 days', sub: 'Full body ×2' },
  { v: 3, label: '3 days', sub: 'Full body ×3' },
  { v: 4, label: '4 days', sub: 'Upper / Lower split' },
  { v: 5, label: '5+ days', sub: 'Upper / Lower + extra' },
];

export const EQUIPMENT: { v: EquipmentAccess; label: string; sub: string }[] = [
  { v: 'gym', label: 'Gym', sub: 'Machines, barbells, dumbbells' },
  { v: 'dumbbells', label: 'Home with dumbbells', sub: 'Dumbbells and bands' },
  { v: 'bodyweight', label: 'Bodyweight only', sub: 'No equipment' },
];

export const LIMITATIONS: { v: Limitation; label: string }[] = [
  { v: 'knees', label: 'Knees' },
  { v: 'back', label: 'Lower back' },
  { v: 'shoulders', label: 'Shoulders' },
  { v: 'wrists', label: 'Wrists' },
];

export const CONTRACEPTION: { v: Contraception; label: string; sub?: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'pill', label: 'Pill', sub: 'Combined or progestin-only' },
  { v: 'hormonal_iud', label: 'Hormonal IUD' },
  { v: 'copper_iud', label: 'Copper IUD', sub: 'Non-hormonal' },
  { v: 'implant_ring_patch', label: 'Implant, ring or patch' },
  { v: 'other', label: 'Other' },
  { v: 'undisclosed', label: 'Prefer not to say' },
];
