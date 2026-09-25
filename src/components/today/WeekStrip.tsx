import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { colors, fonts } from '@/theme/tokens';
import { isoDate as iso } from '@/lib/date';

const LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** Mon–Sun strip. Past sessions = green check, today = highlighted, future = faint. */
export function WeekStrip({ completed }: { completed: string[] }) {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const todayKey = iso(now);

  return (
    <View style={styles.row}>
      {LABELS.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = iso(d);
        const isToday = key === todayKey;
        const done = completed.includes(key);
        const future = key > todayKey;

        return (
          <View key={label} style={styles.col} accessibilityLabel={`${label} ${d.getDate()}${done ? ', trained' : ''}`}>
            <Text style={[styles.label, isToday && styles.labelToday]}>{label}</Text>
            <View
              style={[
                styles.box,
                done && styles.boxDone,
                isToday && !done && styles.boxToday,
                future && styles.boxFuture,
              ]}
            >
              {done ? (
                <Check size={18} color={colors.onDark} strokeWidth={3} />
              ) : (
                <Text style={[styles.num, isToday && styles.numToday, future && styles.numFuture]}>{d.getDate()}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  labelToday: { fontFamily: fonts.bold, color: colors.ink },
  box: {
    width: '100%',
    maxWidth: 44,
    aspectRatio: 0.92,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4DAD2',
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: colors.forest, borderColor: colors.forest },
  boxToday: {
    backgroundColor: colors.surface,
    borderColor: colors.surface,
    shadowColor: '#6B4A50',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  boxFuture: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  num: { fontFamily: fonts.semibold, fontSize: 15, color: colors.inkMuted },
  numToday: { fontFamily: fonts.heavy, color: colors.ink },
  numFuture: { color: '#B9AFA9' },
});
