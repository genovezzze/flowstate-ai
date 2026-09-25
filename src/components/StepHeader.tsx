import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, X } from 'lucide-react-native';
import { colors, radii } from '@/theme/tokens';
import { Text } from './Text';

type Props = {
  step: number; // 1-based
  total: number;
  onBack: () => void;
  onClose: () => void;
};

/** Top bar of the check-in: close on step 1, back afterwards, gradient progress, "N/6". */
export function StepHeader({ step, total, onBack, onClose }: Props) {
  const first = step === 1;
  const pct = Math.max(0.08, step / total);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={first ? onClose : onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={first ? 'Close check-in' : 'Previous question'}
        style={styles.iconBtn}
      >
        {first ? <X size={22} color={colors.inkSoft} /> : <ChevronLeft size={24} color={colors.inkSoft} />}
      </Pressable>

      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
        <LinearGradient
          colors={[colors.progressStart, colors.progressEnd]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${pct * 100}%` }]}
        />
      </View>

      <Text variant="caption" style={styles.count}>
        {step}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 44 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  track: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: '#F1E1E3',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
  count: { minWidth: 28, textAlign: 'right' },
});
