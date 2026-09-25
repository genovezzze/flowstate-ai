import { Pressable, StyleSheet, View } from 'react-native';
import { Dumbbell, X } from 'lucide-react-native';
import { Text } from './Text';
import { colors, space } from '@/theme/tokens';

export function CoachHeader({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.head}>
      <View style={styles.icon}>
        <Dumbbell size={20} color={colors.onDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="serifTitle" style={{ fontSize: 24, lineHeight: 28 }} accessibilityRole="header">
          FlowState Coach
        </Text>
        <Text variant="caption">Ask about training, recovery, soreness, or today’s workout.</Text>
      </View>
      {onClose ? (
        <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <X size={18} color={colors.ink} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
});
