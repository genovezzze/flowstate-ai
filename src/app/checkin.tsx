import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { AlertCircle, Minus } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { OptionCard } from '@/components/OptionCard';
import { QuestionScreen } from '@/components/QuestionScreen';
import { Stepper } from '@/components/Stepper';
import { Text } from '@/components/Text';
import { EnergySlider } from '@/components/checkin/EnergySlider';
import { MotivationDots } from '@/components/checkin/MotivationDots';
import type { SleepQuality, Soreness } from '@/engine';
import { TIME } from '@/lib/options';
import { stepComplete, useCheckin } from '@/state/checkin';
import { colors } from '@/theme/tokens';

const TOTAL = 6;

const QUESTIONS: { title: string; sub: string }[] = [
  { title: "How's your energy today?", sub: 'Be honest — your plan will match where you actually are.' },
  { title: 'How did you sleep?', sub: 'Sleep quality shapes today’s intensity.' },
  { title: 'Any soreness or pain?', sub: 'Pick everything that applies.' },
  { title: 'Are you bleeding today?', sub: 'Helps FlowState fine-tune intensity.' },
  { title: 'How motivated do you feel to train?', sub: 'Be honest — the plan will match.' },
  { title: 'How much time do you have today?', sub: 'We’ll tailor the plan to fit.' },
];

const SLEEP: { v: SleepQuality; label: string; emoji: string }[] = [
  { v: 'poor', label: 'Poor', emoji: '😴' },
  { v: 'ok', label: 'OK', emoji: '😪' },
  { v: 'good', label: 'Good', emoji: '😌' },
  { v: 'great', label: 'Great', emoji: '✨' },
];

const SORENESS: { v: Soreness; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'mild', label: 'Mild soreness' },
  { v: 'strong', label: 'Strong soreness' },
  { v: 'cramps', label: 'Cramps' },
  { v: 'worse_than_usual', label: 'Pain worse than usual' },
];


export default function CheckinScreen() {
  const { draft, set, toggleSoreness, reset, submit } = useCheckin();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<1 | -1>(1);

  const close = () => {
    reset();
    router.back();
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(1, s - 1));
  };
  const next = () => {
    if (step < TOTAL) {
      setDir(1);
      setStep((s) => s + 1);
      return;
    }
    if (submit()) router.replace('/generating');
  };

  const q = QUESTIONS[step - 1];

  return (
    <QuestionScreen
      step={step}
      total={TOTAL}
      title={q.title}
      subtitle={q.sub}
      ctaLabel={step === TOTAL ? 'Generate plan' : 'Next'}
      canContinue={stepComplete(step, draft)}
      onNext={next}
      onBack={back}
      onClose={close}
      direction={dir}
    >
      {step === 1 && (
        <Card padding={22}>
          <EnergySlider value={draft.energy} onChange={(energy) => set({ energy })} />
        </Card>
      )}

      {step === 2 && (
        <>
          {SLEEP.map((o) => (
            <OptionCard
              key={o.v}
              title={o.label}
              leading={<Text style={styles.emoji}>{o.emoji}</Text>}
              selected={draft.sleep === o.v}
              onPress={() => set({ sleep: o.v })}
            />
          ))}
          <View style={{ marginTop: 8 }}>
            <Stepper
              label="Hours slept"
              value={draft.sleepHours}
              onChange={(sleepHours) => set({ sleepHours })}
              min={0}
              max={14}
              step={0.5}
              format={(v) => v.toFixed(1)}
            />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <View style={styles.chips}>
            {SORENESS.map((o) => (
              <Chip key={o.v} label={o.label} selected={draft.soreness.includes(o.v)} onPress={() => toggleSoreness(o.v)} />
            ))}
          </View>
          {draft.soreness.includes('worse_than_usual') && (
            <Card color="#FFF4F1" elevated={false} style={{ marginTop: 8 }}>
              <View style={styles.noticeRow}>
                <AlertCircle size={18} color={colors.danger} />
                <Text style={{ flex: 1 }}>
                  We’ll suggest a recovery day. If this pain is unusual for you, it’s worth checking with a doctor.
                </Text>
              </View>
            </Card>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <OptionCard
            title="Yes"
            leading={<Text style={styles.emoji}>🩸</Text>}
            selected={draft.bleeding === 'yes'}
            onPress={() => set({ bleeding: 'yes' })}
          />
          <OptionCard
            title="Spotting"
            leading={<Text style={styles.emoji}>💧</Text>}
            selected={draft.bleeding === 'spotting'}
            onPress={() => set({ bleeding: 'spotting', bleedingLevel: undefined })}
          />
          <OptionCard
            title="No"
            leading={<Minus size={20} color={colors.ink} strokeWidth={3} />}
            selected={draft.bleeding === 'no'}
            onPress={() => set({ bleeding: 'no', bleedingLevel: undefined })}
          />
          {draft.bleeding === 'yes' && (
            <View style={{ marginTop: 6 }}>
              <Text variant="caption" style={{ marginBottom: 8 }}>
                How heavy?
              </Text>
              <View style={styles.chips}>
                {(['light', 'medium', 'heavy'] as const).map((lvl) => (
                  <Chip
                    key={lvl}
                    label={lvl[0].toUpperCase() + lvl.slice(1)}
                    selected={draft.bleedingLevel === lvl}
                    onPress={() => set({ bleedingLevel: lvl })}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {step === 5 && (
        <Card padding={22}>
          <MotivationDots value={draft.motivation} onChange={(motivation) => set({ motivation })} />
        </Card>
      )}

      {step === 6 &&
        TIME.map((o) => (
          <OptionCard
            key={o.v}
            title={o.label}
            subtitle={o.sub}
            selected={draft.minutes === o.v}
            onPress={() => set({ minutes: o.v })}
          />
        ))}
    </QuestionScreen>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noticeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
