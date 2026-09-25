import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { CycleCard, ProgressCard, ReadinessCard, SleepCard } from '@/components/today/StatCards';
import { WeekStrip } from '@/components/today/WeekStrip';
import { cycleState, PHASE_LABEL } from '@/engine';
import { addDays, isoDate } from '@/lib/date';
import { cycleInputOf, todaySession, useApp } from '@/state/app';
import { colors, fonts, space } from '@/theme/tokens';

const SLEEP_GOAL = 8;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const cycleSettings = useApp((s) => s.cycle);
  const periods = useApp((s) => s.periods);

  const today = todaySession(sessions);
  const cycle = cycleState(cycleInputOf({ cycle: cycleSettings, periods }), new Date());
  const phaseLabel = cycle.phase
    ? PHASE_LABEL[cycle.phase]
    : cycle.hormonal
      ? 'Hormonal contr.'
      : cycle.day
        ? 'Irregular'
        : 'Log your period';

  const done = sessions.filter((s) => s.status === 'done');
  const monthKey = isoDate(new Date()).slice(0, 7);
  const doneThisMonth = done.filter((s) => s.date.startsWith(monthKey)).length;
  const monthlyGoal = profile.daysPerWeek * 4;

  // Sleep for the last 7 days (0 = no check-in that day).
  const byDate = new Map(sessions.map((s) => [s.date, s.sleepHours]));
  const sleepWeek = Array.from({ length: 7 }, (_, i) => byDate.get(isoDate(addDays(new Date(), i - 6))) ?? 0);
  const lastSleep = [...sessions].reverse().find((s) => s.sleepHours != null)?.sleepHours ?? null;

  const status = today?.status;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text variant="display" accessibilityRole="header">
          Today
        </Text>
        <Pressable style={styles.avatar} onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Profile">
          <Text style={styles.avatarText}>{(profile.name[0] ?? 'F').toUpperCase()}</Text>
        </Pressable>
      </View>

      {/* Daily Alignment */}
      <Card color={colors.forest} grainy padding={0}>
        <LinearGradient
          colors={['rgba(168,187,166,0.55)', 'rgba(78,107,87,0)', 'rgba(63,90,72,0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.alignment}
        >
          <Text style={styles.overline}>FlowState AI</Text>
          <Text variant="serifTitle" color={colors.onDark} style={{ marginTop: 4 }}>
            Daily Alignment
          </Text>

          {!today && (
            <>
              <Text style={styles.alignBody}>Tap to calculate your optimal session for today's phase and readiness.</Text>
              <Button
                variant="light"
                label="Generate Workout"
                icon={<Sparkles size={18} color={colors.ink} />}
                onPress={() => router.push('/checkin')}
                style={styles.alignBtn}
              />
            </>
          )}

          {today && status !== 'done' && (
            <>
              <Text style={styles.alignBody}>
                {today.decision.headline}
                {today.dayName ? ` · ${today.dayName}` : ''}
              </Text>
              <Button
                variant="light"
                label={status === 'in_progress' ? 'Continue workout' : 'View today’s plan'}
                icon={
                  status === 'in_progress' ? <Play size={18} color={colors.ink} fill={colors.ink} /> : <ArrowRight size={18} color={colors.ink} />
                }
                onPress={() => router.push(status === 'in_progress' ? '/session' : '/plan')}
                style={styles.alignBtn}
              />
            </>
          )}

          {status === 'done' && (
            <>
              <View style={styles.doneRow}>
                <CheckCircle2 size={18} color={colors.onDark} />
                <Text style={[styles.alignBody, { marginTop: 0 }]}>Session done — nice work. Recover well.</Text>
              </View>
              <Button
                variant="light"
                label="View summary"
                icon={<ArrowRight size={18} color={colors.ink} />}
                onPress={() => router.push('/plan')}
                style={styles.alignBtn}
              />
            </>
          )}
        </LinearGradient>
      </Card>

      <WeekStrip completed={done.map((s) => s.date)} />

      <View style={styles.grid}>
        <CycleCard day={cycle.day} phase={phaseLabel} onPress={() => router.push('/cycle')} />
        <ReadinessCard value={today?.decision.readiness ?? null} label={today ? today.decision.readinessLabel : 'Check in'} />
      </View>
      <View style={styles.grid}>
        <ProgressCard done={doneThisMonth} goal={monthlyGoal} />
        <SleepCard hours={today?.sleepHours ?? lastSleep} goal={SLEEP_GOAL} week={sleepWeek} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EADFD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  alignment: { padding: 20, paddingBottom: 18 },
  overline: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onDarkMuted },
  alignBody: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.onDarkMuted, marginTop: 8, flexShrink: 1 },
  alignBtn: { marginTop: 18, minHeight: 50 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  grid: { flexDirection: 'row', gap: space.md },
});
