import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { CoachChat } from '@/components/CoachChat';
import { CoachHeader } from '@/components/CoachHeader';
import { colors } from '@/theme/tokens';

/** Coach opened from inside a workout ("Feels too heavy? → Ask coach"). */
export default function AskCoachScreen() {
  const insets = useSafeAreaInsets();
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={styles.flex}>
      <View style={[styles.flex, { paddingTop: Math.max(insets.top, 16) }]}>
        <CoachChat prefill={prefill} header={<CoachHeader onClose={() => router.back()} />} bottomInset={insets.bottom + 12} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
