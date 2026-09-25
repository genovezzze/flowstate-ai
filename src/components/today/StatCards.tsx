import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Heart, LayoutGrid, Zap } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { colors, fonts } from '@/theme/tokens';

const CARD_H = 150;

function Label({ icon, text, color }: { icon?: React.ReactNode; text: string; color: string }) {
  return (
    <View style={styles.labelRow}>
      {icon}
      <Text style={[styles.label, { color }]}>{text}</Text>
    </View>
  );
}

export function CycleCard({ day, phase, onPress }: { day: number | null; phase: string; onPress?: () => void }) {
  return (
    <Card color={colors.sage} grainy style={styles.half} onPress={onPress} accessibilityLabel={`Cycle day ${day ?? 'unknown'}, ${phase}`}>
      <View style={styles.fill}>
        <Label icon={<LayoutGrid size={14} color={colors.ink} />} text="Cycle" color={colors.ink} />
        <View>
          <Text variant="metric">{day ? `Day ${day}` : '—'}</Text>
          <Text variant="bodyStrong">{phase}</Text>
        </View>
      </View>
    </Card>
  );
}

export function ReadinessCard({ value, label }: { value: number | null; label: string }) {
  return (
    <Card color={colors.rose} grainy style={styles.half} accessibilityLabel={`Readiness ${value ?? 'not set'}`}>
      <Heart size={96} color="rgba(255,255,255,0.14)" fill="rgba(255,255,255,0.14)" style={styles.bgHeart} />
      <View style={styles.fill}>
        <Label icon={<Zap size={14} color={colors.onDark} fill={colors.onDark} />} text="Readiness" color={colors.onDark} />
        <View>
          <Text variant="metric" color={colors.onDark}>
            {value ? `${value}/7` : '—'}
          </Text>
          <Text variant="bodyStrong" color={colors.onDark}>
            {label}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function ProgressCard({ done, goal }: { done: number; goal: number }) {
  const size = 78;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal ? Math.min(1, done / goal) : 0;

  return (
    <Card color={colors.forest} grainy style={styles.half} accessibilityLabel={`${done} of ${goal} sessions this month`}>
      <View style={styles.fill}>
        <Label text="Progress" color={colors.onDark} />
        <View style={styles.ringWrap}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.22)" strokeWidth={stroke} fill="none" />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={colors.onDark}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${c} ${c}`}
              strokeDashoffset={c * (1 - pct)}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.ringText}>
            <Text style={styles.ringNum}>{done}</Text>
            <Text style={styles.ringGoal}>/{goal}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

export function SleepCard({ hours, goal, week }: { hours: number | null; goal: number; week: number[] }) {
  const max = Math.max(goal, ...week);
  return (
    <Card color={colors.night} grainy style={styles.half} accessibilityLabel={`Sleep ${hours ?? 'unknown'} of ${goal} hours`}>
      <View style={styles.fill}>
        <Label text="Sleep" color={colors.onDark} />
        <View style={styles.sleepRow}>
          <Text variant="metric" color={colors.onDark}>
            {hours != null ? hours.toFixed(1) : '—'}
          </Text>
          <Text style={styles.sleepGoal}> / {goal} hr</Text>
        </View>
        <View style={styles.bars}>
          {week.map((h, i) => {
            const last = i === week.length - 1;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: 3 + (h / max) * 13, backgroundColor: last ? colors.onDark : 'rgba(255,255,255,0.28)' },
                  last && styles.barLast,
                ]}
              />
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1, height: CARD_H },
  fill: { height: CARD_H - 36, justifyContent: 'space-between' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 13 },
  bgHeart: { position: 'absolute', right: -14, bottom: -10 },
  ringWrap: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: -6 },
  ringText: { position: 'absolute', alignItems: 'center' },
  ringNum: { fontFamily: fonts.heavy, fontSize: 18, color: colors.onDark, lineHeight: 20 },
  ringGoal: { fontFamily: fonts.medium, fontSize: 10, color: colors.onDarkMuted },
  sleepRow: { flexDirection: 'row', alignItems: 'flex-end' },
  sleepGoal: { fontFamily: fonts.medium, fontSize: 13, color: colors.onDarkMuted, marginBottom: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 16 },
  bar: { flex: 1, borderRadius: 2 },
  barLast: { flexGrow: 0, flexShrink: 0, flexBasis: 16, width: 16, borderRadius: 3 },
});
