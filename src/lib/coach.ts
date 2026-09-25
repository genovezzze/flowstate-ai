/**
 * FlowState Coach client.
 * - If the backend is configured (EXPO_PUBLIC_API_URL), calls /api/coach on our Vercel server (Claude behind it).
 * - Otherwise falls back to a small rule-based coach so the app works offline / in the beta without a backend.
 */
import { PHASE_LABEL } from '@/engine';
import { formatVolume } from '@/lib/format';
import type { CoachMessage, Session } from '@/state/app';

import { apiFetch, backendEnabled } from './api';

export const aiConnected = backendEnabled;

const RED_FLAGS = /(dizz|faint|pass(ed)? out|chest pain|can'?t breathe|pregnan|heavy bleeding|blood clot|sharp pain|worse than usual|injur|головокруж|обмор|беремен|острая боль)/i;

export const MEDICAL_REPLY =
  'That sounds like something to check with a doctor rather than push through. Please stop training for today, rest, and if it’s unusual for you or getting worse, contact a healthcare professional. I can help you plan an easy recovery day once you feel OK.';

export function contextOf(session: Session | undefined) {
  if (!session) return 'No check-in today yet.';
  const d = session.decision;
  const phase = d.cycle.phase ? PHASE_LABEL[d.cycle.phase] : d.cycle.hormonal ? 'hormonal contraception' : 'unknown';
  return [
    `Cycle day ${d.cycle.day ?? '?'} (${phase}).`,
    `Readiness ${d.readiness}/7. Verdict ${d.verdict}, load ${d.adjustmentPct}%.`,
    `Check-in: energy ${session.checkin.energy}/5, sleep ${session.checkin.sleep}, soreness ${session.checkin.soreness.join('+')}, bleeding ${session.checkin.bleeding}, motivation ${session.checkin.motivation}/5, ${session.checkin.minutes} min.`,
    `Plan: ${session.items.map((i) => `${i.name} ${formatVolume(i)}`).join('; ')}.`,
  ].join('\n');
}

export async function askCoach(history: CoachMessage[], session: Session | undefined): Promise<string> {
  const last = history[history.length - 1]?.content ?? '';
  if (RED_FLAGS.test(last)) return MEDICAL_REPLY;

  if (aiConnected) {
    try {
      const res = await apiFetch('/api/coach', {
        method: 'POST',
        body: JSON.stringify({
          messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          context: contextOf(session),
        }),
      });
      if (res.status === 429) return 'You’ve reached today’s coach limit — let’s pick this up tomorrow. The “Feels too heavy?” options still work anytime.';
      if (res.ok) {
        const json = (await res.json()) as { reply?: string };
        if (json.reply) return json.reply;
      }
    } catch {
      // fall through to offline coach
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return offlineReply(last, session);
}

/** Tiny rule-based coach used when the AI backend is not connected. */
export function offlineReply(text: string, session: Session | undefined): string {
  const t = text.toLowerCase();
  const ex = session?.items.find((i) => t.includes(i.name.toLowerCase()));

  if (/(heavy|too hard|can'?t lift|тяжел)/.test(t)) {
    const name = ex?.name ?? 'this exercise';
    return [
      `Totally fine to adjust ${name} today. Try one of these:`,
      '• Drop the weight ~10% and keep 1–2 reps in reserve',
      '• Keep the weight but do 2 fewer reps per set',
      '• Rest 30 s longer between sets',
      '• Or swap to an easier variation with “Feels too heavy? → Swap”',
      'Good form beats heavy weight — especially on lower-energy days.',
    ].join('\n');
  }
  if (/(cramp|period|bleed|месяч|спазм)/.test(t)) {
    return 'On period days many women feel better with lighter loads, longer rests and less core pressure. Keep moves like hip thrusts, rows and mobility; skip heavy squats/deadlifts and intense ab work if cramps are strong. If the pain is unusual for you, check with a doctor.';
  }
  if (/(sore|doms|крепатур|болят мышцы)/.test(t)) {
    return 'Muscle soreness is normal 1–2 days after training. Warm up a bit longer, go lighter on the sore muscles, and focus on the others today. Light movement usually helps more than full rest.';
  }
  if (/(tired|sleep|exhaust|устал|сон)/.test(t)) {
    return 'After poor sleep, strength and focus drop a bit. Keep the session shorter, stop 2 reps before failure, and prioritise the first 2–3 exercises. A good night tonight will do more for progress than pushing today.';
  }
  if (/(motivat|lazy|don'?t want|нет сил|не хочу)/.test(t)) {
    return 'Low-motivation days count too. Try a “minimum session”: just the first two exercises. If you feel better after the warm-up, continue — if not, you still showed up. That consistency is what builds progress.';
  }
  if (/(skip|rest day|пропуст)/.test(t)) {
    return 'Skipping one session won’t hurt your progress. If you feel run-down, a 20-minute walk or mobility flow is a great alternative — and we’ll pick up your program next time.';
  }
  const verdict = session?.decision.headline;
  return `${verdict ? `Today’s plan: ${verdict.toLowerCase()}. ` : ''}I can help with adjusting weights, soreness, low energy, period days or swapping exercises. What feels off today?\n\n(Offline coach — full AI answers arrive once the backend is connected.)`;
}
