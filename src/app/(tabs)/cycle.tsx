import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Droplet, Info } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { Sheet, SheetOption } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { cycleState, PHASE_LABEL, type Phase } from '@/engine';
import { addDays, formatShort, isoDate, MONTHS_LONG, parseIso } from '@/lib/date';
import { cycleInputOf, useApp } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';

const PHASE_COLOR: Record<Phase, string> = {
  menstrual: colors.rose,
  follicular: colors.sage,
  ovulatory: colors.forest,
  luteal: '#E7C38E',
  late_luteal: '#D9A06A',
};

const PHASE_TIP: Record<Phase, string> = {
  menstrual: 'Energy can dip in the first days. Lighter loads, more rest and mobility are all good choices.',
  follicular: 'Many women feel stronger and recover faster now — a good window to progress weights.',
  ovulatory: 'Strength often peaks. Warm up well and enjoy heavier sets if you feel good.',
  luteal: 'Your body runs a bit warmer. Keep water close; steady training works well.',
  late_luteal: 'Pre-period days can feel heavier. Reducing volume is smart training, not a step back.',
};

export default function CycleScreen() {
  const insets = useSafeAreaInsets();
  const settings = useApp((s) => s.cycle);
  const periods = useApp((s) => s.periods);
  const { logPeriodStart, logPeriodEnd, removePeriod } = useApp.getState();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState<string | null>(null);

  const today = new Date();
  const todayIso = isoDate(today);
  const input = cycleInputOf({ cycle: settings, periods });
  const state = cycleState(input, today);
  const L = settings.cycleLength;
  const open = periods.find((p) => !p.end);
  const nextIn = state.day ? L - state.day + 1 : null;

  // Logged + predicted period days
  const { logged, predicted } = useMemo(() => {
    const logged = new Set<string>();
    for (const p of periods) {
      const endIso = p.end ?? isoDate(addDays(parseIso(p.start), settings.periodLength - 1));
      for (let d = parseIso(p.start); isoDate(d) <= endIso; d = addDays(d, 1)) logged.add(isoDate(d));
    }
    const predicted = new Set<string>();
    if (input.lastPeriodStart && !settings.irregular) {
      for (let k = 1; k <= 3; k++) {
        const start = addDays(parseIso(input.lastPeriodStart), L * k);
        for (let i = 0; i < settings.periodLength; i++) {
          const key = isoDate(addDays(start, i));
          if (key > todayIso) predicted.add(key);
        }
      }
    }
    return { logged, predicted };
  }, [periods, settings, input.lastPeriodStart, L, todayIso]);

  const pickedIsStart = picked ? periods.some((p) => p.start === picked) : false;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="display" accessibilityRole="header">
        Cycle
      </Text>

      <Card padding={20}>
        <View style={styles.ringWrap}>
          <CycleRing length={L} periodLength={settings.periodLength} day={state.day} hormonal={state.hormonal} />
          <View style={styles.ringCenter}>
            <Text variant="metric">{state.day ? `Day ${state.day}` : '—'}</Text>
            <Text variant="bodyStrong" color={colors.inkSoft}>
              {state.phase ? PHASE_LABEL[state.phase] : state.hormonal ? 'Hormonal contraception' : 'Log your period'}
            </Text>
            {nextIn != null && !state.hormonal && !settings.irregular && (
              <Text variant="caption" style={{ marginTop: 4 }}>
                Next period in ~{nextIn} {nextIn === 1 ? 'day' : 'days'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {open ? (
            <Button label="Period ended today" onPress={() => logPeriodEnd(todayIso)} style={{ flex: 1 }} />
          ) : (
            <Button
              label="Period started today"
              icon={<Droplet size={16} color={colors.onDark} fill={colors.onDark} />}
              onPress={() => logPeriodStart(todayIso)}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </Card>

      {state.phase && (
        <Card color={colors.sage} grainy>
          <View style={styles.tipRow}>
            <Info size={16} color={colors.ink} />
            <Text variant="bodyStrong">{PHASE_LABEL[state.phase]} phase</Text>
          </View>
          <Text style={{ marginTop: 6, color: colors.ink }}>{PHASE_TIP[state.phase]}</Text>
          <Text variant="caption" color={colors.inkSoft} style={{ marginTop: 8 }}>
            Everyone is different — your daily check-in always matters more than the phase.
          </Text>
        </Card>
      )}
      {state.hormonal && (
        <Card>
          <Text>
            With hormonal contraception there are no natural cycle phases, so FlowState adapts to how you feel each day and to any
            bleeding you log.
          </Text>
        </Card>
      )}

      {/* Calendar */}
      <Card padding={16}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={10} accessibilityLabel="Previous month">
            <ChevronLeft size={22} color={colors.ink} />
          </Pressable>
          <Text variant="title">
            {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
          </Text>
          <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={10} accessibilityLabel="Next month">
            <ChevronRight size={22} color={colors.ink} />
          </Pressable>
        </View>
        <MonthGrid month={month} todayIso={todayIso} logged={logged} predicted={predicted} onPick={setPicked} />
        <View style={styles.legend}>
          <Legend color={colors.rose} label="Period" />
          <Legend color={colors.rose} label="Predicted" dashed />
        </View>
      </Card>

      <Sheet visible={picked != null} onClose={() => setPicked(null)} title={picked ? formatShort(picked) : ''}>
        {picked && !pickedIsStart && picked <= todayIso && (
          <SheetOption
            icon={<Droplet size={16} color={colors.mauve} />}
            title="Period started this day"
            onPress={() => {
              logPeriodStart(picked);
              setPicked(null);
            }}
          />
        )}
        {picked && open && picked >= open.start && picked <= todayIso && (
          <SheetOption
            title="Period ended this day"
            onPress={() => {
              logPeriodEnd(picked);
              setPicked(null);
            }}
          />
        )}
        {picked && pickedIsStart && (
          <SheetOption
            title="Remove this period"
            onPress={() => {
              removePeriod(picked);
              setPicked(null);
            }}
          />
        )}
        {picked && picked > todayIso && <Text>You can only log days up to today.</Text>}
      </Sheet>
    </ScrollView>
  );
}

function CycleRing({ length, periodLength, day, hormonal }: { length: number; periodLength: number; day: number | null; hormonal: boolean }) {
  const size = 240;
  const stroke = 16;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const ov = length - 14;

  const segs: { from: number; to: number; phase: Phase }[] = [
    { from: 1, to: periodLength, phase: 'menstrual' },
    { from: periodLength + 1, to: ov - 2, phase: 'follicular' },
    { from: ov - 1, to: ov + 1, phase: 'ovulatory' },
    { from: ov + 2, to: length - 5, phase: 'luteal' },
    { from: length - 4, to: length, phase: 'late_luteal' },
  ];

  const angle = (d: number) => ((d - 1) / length) * 2 * Math.PI - Math.PI / 2;
  const pt = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arc = (from: number, to: number) => {
    const gap = 0.02;
    const a0 = angle(from) + gap;
    const a1 = angle(to + 1) - gap;
    const [x0, y0] = pt(a0);
    const [x1, y1] = pt(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  const marker = day ? pt(angle(day + 0.5)) : null;

  return (
    <Svg width={size} height={size}>
      {hormonal ? (
        <Circle cx={cx} cy={cy} r={r} stroke="#EADCDD" strokeWidth={stroke} fill="none" />
      ) : (
        segs
          .filter((s) => s.to >= s.from)
          .map((s) => (
            <Path key={s.phase} d={arc(s.from, s.to)} stroke={PHASE_COLOR[s.phase]} strokeWidth={stroke} strokeLinecap="round" fill="none" />
          ))
      )}
      {marker && (
        <>
          <Circle cx={marker[0]} cy={marker[1]} r={14} fill={colors.surface} />
          <Circle cx={marker[0]} cy={marker[1]} r={8} fill={colors.ink} />
        </>
      )}
    </Svg>
  );
}

function MonthGrid({
  month,
  todayIso,
  logged,
  predicted,
  onPick,
}: {
  month: Date;
  todayIso: string;
  logged: Set<string>;
  predicted: Set<string>;
  onPick: (iso: string) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => isoDate(new Date(month.getFullYear(), month.getMonth(), i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={styles.weekHead}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekHeadText}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={i} style={styles.cell} />;
          const isLogged = logged.has(iso);
          const isPred = predicted.has(iso);
          const isToday = iso === todayIso;
          return (
            <Pressable key={iso} style={styles.cell} onPress={() => onPick(iso)} accessibilityLabel={`${formatShort(iso)}${isLogged ? ', period' : isPred ? ', predicted period' : ''}`}>
              <View style={[styles.day, isLogged && styles.dayLogged, isPred && !isLogged && styles.dayPred, isToday && styles.dayToday]}>
                <Text style={[styles.dayText, isLogged && { color: colors.onDark }, isToday && !isLogged && { fontFamily: fonts.heavy }]}>
                  {parseIso(iso).getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, dashed ? { borderWidth: 1.5, borderColor: color, borderStyle: 'dashed' } : { backgroundColor: color }]} />
      <Text variant="caption">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, gap: space.lg },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', paddingHorizontal: 40 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  weekHead: { flexDirection: 'row' },
  weekHeadText: { flex: 1, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayLogged: { backgroundColor: colors.rose },
  dayPred: { borderWidth: 1.5, borderColor: colors.roseSoft, borderStyle: 'dashed' },
  dayToday: { borderWidth: 2, borderColor: colors.ink },
  dayText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});
