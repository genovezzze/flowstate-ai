import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Sparkles } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { addDays, isoDate } from '@/lib/date';
import { colors, fonts, radii } from '@/theme/tokens';

export const RING = { workouts: '#F2385A', volume: '#9BD63A', minutes: '#35B6F2' } as const;
const LIME = '#B9E84F';
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "Calendar" card: current week, today in lime, dot under days with a finished session. */
export function WeekCalendar({ trainedDates }: { trainedDates: string[] }) {
  const now = new Date();
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const today = isoDate(now);
  return (
    <Card padding={16}>
      <Text variant="title" style={{ marginBottom: 12 }}>
        Calendar
      </Text>
      <View style={styles.weekRow}>
        {DAY_NAMES.map((name, i) => {
          const d = addDays(monday, i);
          const key = isoDate(d);
          const isToday = key === today;
          const trained = trainedDates.includes(key);
          return (
            <View key={name} style={[styles.dayCol, isToday && styles.dayToday]} accessibilityLabel={`${name} ${d.getDate()}${trained ? ', trained' : ''}`}>
              <Text style={[styles.dayName, isToday && { color: colors.ink }]}>{name}</Text>
              <Text style={styles.dayNum}>{d.getDate()}</Text>
              <View style={[styles.dot, { backgroundColor: trained ? (isToday ? colors.ink : colors.forest) : 'transparent' }]} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

type RingValue = { value: number; goal: number };

/** "This Week" card with three concentric activity rings. */
export function WeekRings({
  workouts,
  volume,
  minutes,
}: {
  workouts: RingValue;
  volume: RingValue;
  minutes: RingValue;
}) {
  const size = 124;
  const stroke = 11;
  const gap = 4;
  const rings = [
    { ...workouts, color: RING.workouts },
    { ...volume, color: RING.volume },
    { ...minutes, color: RING.minutes },
  ];
  return (
    <Card padding={16}>
      <Text variant="title" style={{ marginBottom: 10 }}>
        This Week
      </Text>
      <View style={styles.ringsRow}>
        <Svg width={size} height={size}>
          {rings.map((r, i) => {
            const radius = size / 2 - stroke / 2 - i * (stroke + gap);
            const c = 2 * Math.PI * radius;
            const pct = r.goal > 0 ? Math.min(1, r.value / r.goal) : 0;
            return (
              <G key={i}>
                <Circle cx={size / 2} cy={size / 2} r={radius} stroke={r.color} strokeOpacity={0.16} strokeWidth={stroke} fill="none" />
                {pct > 0 && (
                  <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={r.color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${c} ${c}`}
                    strokeDashoffset={c * (1 - Math.max(pct, 0.02))}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                )}
              </G>
            );
          })}
        </Svg>
        <View style={{ flex: 1, gap: 10 }}>
          <Legend label="Workouts" value={`${workouts.value}/${workouts.goal}`} unit="days" color={RING.workouts} />
          <Legend label="Volume" value={`${fmt(volume.value)}/${fmt(volume.goal)}`} unit="kg" color={RING.volume} />
          <Legend label="Minutes" value={`${minutes.value}/${minutes.goal}`} unit="min" color={RING.minutes} />
        </View>
      </View>
    </Card>
  );
}

function Legend({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View>
      <Text style={styles.legendLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <Text style={[styles.legendValue, { color }]}>{value}</Text>
        <Text style={styles.legendUnit}>{unit.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const fmt = (n: number) => Math.round(n).toLocaleString('de-DE'); // 6.000 like the design

/** Dark "FlowState AI Plan" hero card (original illustration — no stock photo). */
export function AiPlanCard({ minutes, subtitle, onPress }: { minutes: number; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open FlowState AI Plan" style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}>
      <Card color="#2E3A33" grainy padding={0}>
        <LinearGradient colors={['#6F8F72', '#34453A', '#232A26']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.plan}>
          <Svg width={180} height={150} style={styles.leaf} viewBox="0 0 180 150">
            {/* stylised fern */}
            <Path d="M20 140 C60 100 100 60 170 10" stroke="#A9C98D" strokeWidth={3} fill="none" />
            {Array.from({ length: 9 }, (_, i) => {
              const t = 0.12 + i * 0.1;
              const x = 20 + 150 * t;
              const y = 140 - 130 * t;
              const len = 34 - i * 2.5;
              return (
                <G key={i}>
                  <Path d={`M${x} ${y} q ${-len * 0.4} ${-len * 0.7} ${-len * 0.1} ${-len}`} stroke="#94BF74" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.9} />
                  <Path d={`M${x} ${y} q ${len * 0.7} ${len * 0.1} ${len} ${-len * 0.25}`} stroke="#86B266" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85} />
                </G>
              );
            })}
          </Svg>
          <View style={styles.planBadge}>
            <Sparkles size={12} color={colors.onDark} />
            <Text style={styles.planBadgeText}>{subtitle}</Text>
          </View>
          <View>
            <Text style={styles.planTitle}>FlowState AI Plan</Text>
            <View style={styles.planMeta}>
              <Clock size={13} color={colors.onDarkMuted} />
              <Text style={styles.planMetaText}>{minutes} mins</Text>
            </View>
          </View>
        </LinearGradient>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4, paddingVertical: 8, width: 40, borderRadius: radii.md },
  dayToday: { backgroundColor: LIME },
  dayName: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
  dayNum: { fontFamily: fonts.heavy, fontSize: 17, color: colors.ink },
  dot: { width: 5, height: 5, borderRadius: 3 },
  ringsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legendLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6, color: colors.inkSoft, textTransform: 'uppercase' },
  legendValue: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 24 },
  legendUnit: { fontFamily: fonts.bold, fontSize: 11, color: colors.inkSoft },
  plan: { height: 170, padding: 18, justifyContent: 'space-between' },
  leaf: { position: 'absolute', right: -10, top: -6, opacity: 0.9 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.16)' },
  planBadgeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.onDark },
  planTitle: { fontFamily: fonts.heavy, fontSize: 22, color: colors.onDark },
  planMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  planMetaText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onDarkMuted },
});
