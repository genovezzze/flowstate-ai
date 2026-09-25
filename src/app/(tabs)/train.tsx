import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { Text } from '@/components/Text';
import { candidatesFor, cycleState, EXERCISES, PHASE_LABEL, splitFor, type Pattern } from '@/engine';
import { AiPlanCard, WeekCalendar, WeekRings } from '@/components/train/TrainWidgets';
import { addDays, formatShort, isoDate, weekdayShort } from '@/lib/date';
import { INTENSITY } from '@/lib/format';
import { cycleInputOf, todaySession, useApp } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';

const FILTERS: { v: Pattern | 'all'; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'squat', label: 'Squat' },
  { v: 'hinge', label: 'Hinge' },
  { v: 'lunge', label: 'Lunge' },
  { v: 'glutes', label: 'Glutes' },
  { v: 'push_h', label: 'Push' },
  { v: 'push_v', label: 'Shoulders' },
  { v: 'pull_h', label: 'Row' },
  { v: 'pull_v', label: 'Pull-down' },
  { v: 'arms', label: 'Arms' },
  { v: 'core', label: 'Core' },
  { v: 'mobility', label: 'Mobility' },
];

const VERDICT_LABEL = { PUSH: 'Build', AS_PLANNED: 'Steady', REDUCE: 'Eased off', MODIFY: 'Modified', RECOVER: 'Recovery' } as const;

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const [filter, setFilter] = useState<Pattern | 'all'>('all');

  const done = sessions.filter((s) => s.status === 'done');
  const split = splitFor(profile.daysPerWeek);
  const nextIndex = done.length % split.length;

  const monday = addDays(new Date(), -((new Date().getDay() + 6) % 7));
  const weekDone = done.filter((s) => s.date >= isoDate(monday));
  const thisWeek = weekDone.length;
  const weekVolume = weekDone.reduce(
    (sum, s) => sum + Object.values(s.logs).flat().filter((l) => l.done).reduce((v, l) => v + l.reps * (l.weightKg ?? 0), 0),
    0,
  );
  const weekMinutes = weekDone.reduce((m, s) => m + s.checkin.minutes, 0);
  // Volume goal: last week's volume (min 2 000 kg), so the ring means "match last week".
  const lastMonday = isoDate(addDays(monday, -7));
  const lastWeekVolume = done
    .filter((s) => s.date >= lastMonday && s.date < isoDate(monday))
    .reduce((sum, s) => sum + Object.values(s.logs).flat().filter((l) => l.done).reduce((v, l) => v + l.reps * (l.weightKg ?? 0), 0), 0);
  const volumeGoal = Math.max(2000, Math.round(lastWeekVolume / 500) * 500);

  const cycleSettings = useApp((s) => s.cycle);
  const periods = useApp((s) => s.periods);
  const cyc = cycleState(cycleInputOf({ cycle: cycleSettings, periods }), new Date());
  const today = todaySession(sessions);
  const phaseLine = cyc.phase ? `${PHASE_LABEL[cyc.phase]} phase - Day ${cyc.day}` : cyc.hormonal ? 'Hormonal contraception' : 'Log your period in Cycle';

  const program = useMemo(
    () =>
      split.map((day) => {
        const used = new Set<string>();
        const names: string[] = [];
        for (const slot of day.slots) {
          const e = candidatesFor(slot, profile).find((x) => !used.has(x.slug));
          if (e) {
            used.add(e.slug);
            names.push(e.name);
          }
        }
        return { day, names };
      }),
    [split, profile],
  );

  const library = EXERCISES.filter((e) => filter === 'all' || e.pattern === filter);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bgCheckin }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text variant="display" accessibilityRole="header">
          Sync Training
        </Text>
        <View style={styles.phaseRow}>
          <View style={styles.phaseDot} />
          <Text style={styles.phaseText}>{phaseLine}</Text>
        </View>
      </View>

      <WeekCalendar trainedDates={done.map((s) => s.date)} />

      <WeekRings
        workouts={{ value: thisWeek, goal: profile.daysPerWeek }}
        volume={{ value: weekVolume, goal: volumeGoal }}
        minutes={{ value: weekMinutes, goal: profile.daysPerWeek * profile.defaultMinutes }}
      />

      <AiPlanCard
        minutes={today?.checkin.minutes ?? profile.defaultMinutes}
        subtitle={today ? (today.status === 'done' ? 'Done today' : today.dayName ?? 'Recovery') : `Next: ${split[nextIndex].name}`}
        onPress={() => router.push(today ? (today.status === 'in_progress' ? '/session' : '/plan') : '/checkin')}
      />

      <Text variant="title" style={{ marginTop: 4 }}>
        Recent Sessions
      </Text>
      {done.length === 0 ? (
        <Card>
          <Text>No finished sessions yet. Tap “Generate Workout” on Today to start.</Text>
        </Card>
      ) : (
        [...done].reverse().slice(0, 5).map((s) => {
          const sets = Object.values(s.logs).flat().filter((l) => l.done).length;
          return (
            <Card key={s.id} padding={14}>
              <View style={styles.histRow}>
                <View style={styles.histDate}>
                  <Text style={styles.histDay}>{weekdayShort(s.date)}</Text>
                  <Text style={styles.histNum}>{formatShort(s.date)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{s.dayName ?? 'Recovery'}</Text>
                  <Text variant="caption">
                    {VERDICT_LABEL[s.decision.verdict]} · {sets} sets{s.rpe ? ` · effort ${s.rpe}/10` : ''}
                  </Text>
                </View>
                <CheckCircle2 size={18} color={colors.ok} />
              </View>
            </Card>
          );
        })
      )}

      <Text variant="overline" style={{ marginTop: 8 }}>Your program</Text>
      {program.map(({ day, names }, i) => (
        <Card key={day.key} padding={16}>
          <View style={styles.dayHead}>
            <Text variant="title" style={{ flex: 1 }}>
              {day.name}
            </Text>
            {i === nextIndex && <Chip size="sm" tone="rose" label="Up next" />}
          </View>
          <Text variant="caption" style={{ marginTop: 6 }}>
            {names.join(' · ')}
          </Text>
        </Card>
      ))}
      <Text variant="caption">Each day is adapted after your check-in — exercises and loads can change.</Text>

      <Text variant="overline" style={{ marginTop: 8 }}>
        Exercise library
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {FILTERS.map((f) => (
          <Chip key={f.v} size="sm" label={f.label} selected={filter === f.v} onPress={() => setFilter(f.v)} />
        ))}
      </ScrollView>
      <Card padding={6}>
        {library.map((e, i) => (
          <Pressable
            key={e.slug}
            onPress={() => router.push({ pathname: '/exercise/[slug]', params: { slug: e.slug } })}
            style={[styles.libRow, i > 0 && styles.libBorder]}
            accessibilityRole="button"
          >
            <View style={[styles.libDot, { backgroundColor: INTENSITY[e.intensity].dot }]} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{e.name}</Text>
              <Text variant="caption">{e.muscles.join(', ')}</Text>
            </View>
            <ChevronRight size={16} color={colors.inkMuted} />
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, gap: space.md },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  phaseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
  phaseText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkSoft },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  histDate: { width: 52, alignItems: 'center', paddingVertical: 6, borderRadius: radii.sm, backgroundColor: colors.blush },
  histDay: { fontFamily: fonts.semibold, fontSize: 11, color: colors.mauve },
  histNum: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  libRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  libBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  libDot: { width: 8, height: 8, borderRadius: 4 },
});
