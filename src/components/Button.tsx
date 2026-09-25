import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radii } from '@/theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'light' | 'soft';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palette: Record<Variant, { bg: string; fg: string; bgDisabled: string; fgDisabled: string }> = {
  primary: { bg: colors.mauve, fg: colors.onDark, bgDisabled: '#D9B9C0', fgDisabled: 'rgba(255,255,255,0.8)' },
  light: { bg: colors.surface, fg: colors.ink, bgDisabled: colors.surfaceMuted, fgDisabled: colors.inkMuted },
  soft: { bg: colors.surface, fg: colors.ink, bgDisabled: 'rgba(255,255,255,0.7)', fgDisabled: colors.inkMuted },
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, style }: Props) {
  const p = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive }}
      disabled={inactive}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: inactive ? p.bgDisabled : p.bg },
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, { color: inactive ? p.fgDisabled : p.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 16 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
