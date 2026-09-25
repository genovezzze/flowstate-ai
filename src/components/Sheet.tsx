import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Text } from './Text';
import { colors, radii, space } from '@/theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/** Simple bottom sheet built on Modal (works in Expo Go without extra native modules). */
export function Sheet({ visible, onClose, title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text variant="title">{title}</Text>
            {subtitle ? <Text variant="caption" style={{ marginTop: 2 }}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color={colors.ink} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body} bounces={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function SheetOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {icon ? <View style={styles.optIcon}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,27,28,0.35)' },
  sheet: {
    backgroundColor: colors.bgCheckinTop,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2D2D5', marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 8 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: space.gutter, paddingTop: 8, gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  optIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
