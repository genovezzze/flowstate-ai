import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';
import { Text } from './Text';

type Props = {
  label: string;
  icon?: ReactNode;
  tone?: 'neutral' | 'rose' | 'sage' | 'danger' | 'amber';
  selected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
};

const tones = {
  neutral: { bg: colors.surface, fg: colors.inkSoft, border: colors.border },
  rose: { bg: '#FBE8EB', fg: colors.mauve, border: '#F2CDD3' },
  sage: { bg: '#EAF1E8', fg: colors.forest, border: '#D3E1D0' },
  danger: { bg: colors.danger, fg: colors.onDark, border: colors.danger },
  amber: { bg: '#FBF1E1', fg: '#9A6A22', border: '#F1DDBC' },
} as const;

export function Chip({ label, icon, tone = 'neutral', selected, onPress, size = 'md' }: Props) {
  const t = selected ? tones.rose : tones[tone];
  const body = (
    <View
      style={[
        styles.chip,
        size === 'sm' && styles.sm,
        { backgroundColor: t.bg, borderColor: selected ? colors.rose : t.border },
      ]}
    >
      {icon}
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: t.fg }]}>{label}</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 10, paddingVertical: 5 },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
  labelSm: { fontSize: 12 },
});
