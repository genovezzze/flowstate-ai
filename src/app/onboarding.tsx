import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { OptionCard } from '@/components/OptionCard';
import { QuestionScreen } from '@/components/QuestionScreen';
import { Stepper, ToggleRow } from '@/components/Stepper';
import { Text } from '@/components/Text';
import type { Limitation } from '@/engine';
import { addDays, formatShort, isoDate } from '@/lib/date';
import { CONTRACEPTION, DAYS, EQUIPMENT, EXPERIENCE, GOALS, LIMITATIONS, TIME } from '@/lib/options';
import { defaultCycle, defaultProfile, useApp, type CycleSettings, type Profile } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';
import { authClient, backendEnabled } from '@/lib/api';

const STEPS = [
  { title: 'What should we call you?', sub: 'Just a first name or nickname.' },
  { title: 'What’s your main goal?', sub: 'You can change it anytime.' },
  { title: 'How long have you been training?', sub: 'So we pick the right exercises and loads.' },
  { title: 'How many days a week do you train?', sub: 'We’ll build your split around it.' },
  { title: 'Where do you train?', sub: 'We only suggest exercises you can actually do.' },
  { title: 'Usual session length?', sub: 'You can adjust it every day in your check-in.' },
  { title: 'Anything we should go easy on?', sub: 'We’ll avoid exercises that load these areas.' },
  { title: 'When did your last period start?', sub: 'Used to estimate your cycle phase.' },
  { title: 'Tell us about your cycle', sub: 'Averages are fine — we learn as you log.' },
  { title: 'Do you use hormonal contraception?', sub: 'It changes how cycle phases affect training.' },
  { title: 'Your data, your choice', sub: 'Cycle and health data stay on your phone in this beta.' },
];
const TOTAL = STEPS.length;

export default function Onboarding() {
  const complete = useApp((s) => s.completeOnboarding);
  const session = authClient.useSession();
  const [step, setStep] = useState(backendEnabled ? 1 : 0); // 0 = welcome (sign-in screen replaces it when online)
  const [dir, setDir] = useState<1 | -1>(1);

  const [profile, setProfile] = useState<Profile>(() => ({
    ...defaultProfile,
    name: session.data?.user?.name && !session.data.user.name.includes('@') ? session.data.user.name : '',
  }));
  const [cycle, setCycle] = useState<CycleSettings>(defaultCycle);
  const [daysAgo, setDaysAgo] = useState(3);
  const [unknownDate, setUnknownDate] = useState(false);
  const [limitsNone, setLimitsNone] = useState(false);
  const [consents, setConsents] = useState({ health: false, disclaimer: false, analytics: false });

  const p = (patch: Partial<Profile>) => setProfile((x) => ({ ...x, ...patch }));
  const c = (patch: Partial<CycleSettings>) => setCycle((x) => ({ ...x, ...patch }));

  if (step === 0) return <Welcome onStart={() => setStep(1)} />;

  const valid = [
    profile.name.trim().length > 0,
    true,
    true,
    true,
    true,
    true,
    limitsNone || profile.limitations.length > 0,
    true,
    true,
    true,
    consents.health && consents.disclaimer,
  ][step - 1];

  const finish = () => {
    complete({
      profile: { ...profile, name: profile.name.trim() },
      cycle,
      lastPeriodStart: unknownDate ? null : isoDate(addDays(new Date(), -daysAgo)),
      consents: { ...consents, at: new Date().toISOString() },
    });
    router.replace('/');
  };

  const next = () => {
    if (step < TOTAL) {
      setDir(1);
      setStep(step + 1);
    } else finish();
  };
  const back = () => {
    setDir(-1);
    setStep(Math.max(backendEnabled ? 1 : 0, step - 1));
  };

  const toggleLimit = (l: Limitation) => {
    setLimitsNone(false);
    p({ limitations: profile.limitations.includes(l) ? profile.limitations.filter((x) => x !== l) : [...profile.limitations, l] });
  };

  const s = STEPS[step - 1];

  return (
    <QuestionScreen
      step={step}
      total={TOTAL}
      title={s.title}
      subtitle={s.sub}
      ctaLabel={step === TOTAL ? 'Start using FlowState' : 'Next'}
      canContinue={valid}
      onNext={next}
      onBack={back}
      onClose={back}
      direction={dir}
    >
      {step === 1 && (
        <TextInput
          value={profile.name}
          onChangeText={(name) => p({ name })}
          placeholder="Your name"
          placeholderTextColor={colors.inkMuted}
          autoFocus
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => profile.name.trim() && next()}
          style={styles.input}
          maxLength={30}
          accessibilityLabel="Your name"
        />
      )}

      {step === 2 &&
        GOALS.map((o) => (
          <OptionCard
            key={o.v}
            title={o.label}
            subtitle={o.sub}
            leading={<Text style={styles.emoji}>{o.emoji}</Text>}
            selected={profile.goal === o.v}
            onPress={() => p({ goal: o.v })}
          />
        ))}

      {step === 3 &&
        EXPERIENCE.map((o) => (
          <OptionCard key={o.v} title={o.label} subtitle={o.sub} selected={profile.experience === o.v} onPress={() => p({ experience: o.v })} />
        ))}

      {step === 4 &&
        DAYS.map((o) => (
          <OptionCard key={o.v} title={o.label} subtitle={o.sub} selected={profile.daysPerWeek === o.v} onPress={() => p({ daysPerWeek: o.v })} />
        ))}

      {step === 5 &&
        EQUIPMENT.map((o) => (
          <OptionCard key={o.v} title={o.label} subtitle={o.sub} selected={profile.equipment === o.v} onPress={() => p({ equipment: o.v })} />
        ))}

      {step === 6 &&
        TIME.map((o) => (
          <OptionCard key={o.v} title={o.label} subtitle={o.sub} selected={profile.defaultMinutes === o.v} onPress={() => p({ defaultMinutes: o.v })} />
        ))}

      {step === 7 && (
        <View style={styles.chips}>
          <Chip
            label="Nothing"
            selected={limitsNone}
            onPress={() => {
              setLimitsNone(!limitsNone);
              p({ limitations: [] });
            }}
          />
          {LIMITATIONS.map((o) => (
            <Chip key={o.v} label={o.label} selected={profile.limitations.includes(o.v)} onPress={() => toggleLimit(o.v)} />
          ))}
        </View>
      )}

      {step === 8 && (
        <>
          {!unknownDate && (
            <Stepper
              label={daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`}
              sublabel={formatShort(isoDate(addDays(new Date(), -daysAgo)))}
              value={daysAgo}
              onChange={setDaysAgo}
              min={0}
              max={60}
            />
          )}
          <ToggleRow label="I don’t remember" sublabel="You can log it later in the Cycle tab" value={unknownDate} onChange={setUnknownDate} />
        </>
      )}

      {step === 9 && (
        <>
          <Stepper label="Cycle length" sublabel="From day 1 to the next day 1" value={cycle.cycleLength} onChange={(v) => c({ cycleLength: v })} min={21} max={40} format={(v) => `${v} d`} />
          <Stepper label="Period length" value={cycle.periodLength} onChange={(v) => c({ periodLength: v })} min={2} max={8} format={(v) => `${v} d`} />
          <ToggleRow label="My cycle is irregular" sublabel="We’ll rely more on how you feel each day" value={cycle.irregular} onChange={(irregular) => c({ irregular })} />
        </>
      )}

      {step === 10 &&
        CONTRACEPTION.map((o) => (
          <OptionCard key={o.v} title={o.label} subtitle={o.sub} selected={cycle.contraception === o.v} onPress={() => c({ contraception: o.v })} />
        ))}

      {step === 11 && (
        <>
          <ToggleRow
            label="Use my health & cycle data"
            sublabel="Required to personalise workouts. Stored on this device; you can delete it anytime in Profile."
            value={consents.health}
            onChange={(health) => setConsents((x) => ({ ...x, health }))}
          />
          <ToggleRow
            label="I understand this is not medical advice"
            sublabel="FlowState gives general fitness guidance and is not a medical device."
            value={consents.disclaimer}
            onChange={(disclaimer) => setConsents((x) => ({ ...x, disclaimer }))}
          />
          <ToggleRow
            label="Share anonymous usage stats"
            sublabel="Optional. Never includes cycle or health data."
            value={consents.analytics}
            onChange={(analytics) => setConsents((x) => ({ ...x, analytics }))}
          />
        </>
      )}
    </QuestionScreen>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.welcome, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <Card color={colors.forest} grainy padding={0} style={styles.hero}>
          <LinearGradient
            colors={['rgba(168,187,166,0.6)', 'rgba(78,107,87,0)', 'rgba(201,115,127,0.45)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroInner}
          >
            <View style={styles.logo}>
              <Sparkles size={26} color={colors.forest} />
            </View>
            <Text variant="display" color={colors.onDark} style={{ marginTop: 28 }}>
              FlowState
            </Text>
            <Text style={styles.tagline}>Train with your cycle,{'\n'}not despite it.</Text>
          </LinearGradient>
        </Card>

        <View style={{ gap: 10 }}>
          {[
            'A 30-second daily check-in',
            'A workout adapted to your energy, sleep and cycle',
            'A clear “why” behind every change',
          ].map((t) => (
            <View key={t} style={styles.point}>
              <View style={styles.pointDot} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {t}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Button label="Get started" onPress={onStart} />
          <Text variant="caption" align="center">
            Beta · takes about 2 minutes
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.ink,
  },
  welcome: { flex: 1, paddingHorizontal: space.gutter, justifyContent: 'space-between', gap: 24 },
  hero: {},
  heroInner: { padding: 26, minHeight: 300, justifyContent: 'flex-end' },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: colors.onDark, marginTop: 8 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rose },
});
