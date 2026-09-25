import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { colors, fonts } from '@/theme/tokens';

const LABELS = ['Not at all', 'A little', 'Somewhat', 'Motivated', 'Pumped'];
const SHADES = ['#F6D8A8', '#F2BFA2', '#EDA79E', '#E8899A', '#C9737F'];

type Props = { value?: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void };

export function MotivationDots({ value, onChange }: Props) {
  return (
    <View>
      <View style={styles.row} accessibilityRole="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = !!value && n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChange(n as 1 | 2 | 3 | 4 | 5);
              }}
              hitSlop={6}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === n }}
              accessibilityLabel={`${n} — ${LABELS[n - 1]}`}
              style={styles.dotWrap}
            >
              {on ? (
                <LinearGradient
                  colors={[SHADES[n - 1], SHADES[Math.min(4, n)]]}
                  style={[styles.dot, value === n && styles.dotSelected]}
                />
              ) : (
                <View style={[styles.dot, styles.dotOff]} />
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>Not at all</Text>
        {value ? <Text style={[styles.end, { color: colors.mauve }]}>{LABELS[value - 1]}</Text> : null}
        <Text style={styles.end}>Pumped</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dotWrap: { alignItems: 'center', justifyContent: 'center' },
  dot: { width: 46, height: 46, borderRadius: 23 },
  dotOff: { backgroundColor: '#F2E4E6' },
  dotSelected: { transform: [{ scale: 1.08 }] },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  end: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
});
