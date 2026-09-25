import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachChat } from '@/components/CoachChat';
import { CoachHeader } from '@/components/CoachHeader';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { colors } from '@/theme/tokens';

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={styles.flex}>
      <View style={[styles.flex, { paddingTop: insets.top + 8 }]}>
        <CoachChat header={<CoachHeader />} bottomInset={insets.bottom + TAB_BAR_HEIGHT + 24} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
