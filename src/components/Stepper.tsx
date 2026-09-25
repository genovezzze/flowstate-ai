import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, fonts, radii } from '@/theme/tokens';

type StepperProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  sublabel?: string;
};

export function Stepper({ label, value, onChange, min, max, step = 1, format, sublabel }: StepperProps) {
  const change = (d: number) => {
    const v = Math.min(max, Math.max(min, Math.round((value + d) / step) * step));
    if (v !== value) {
      Haptics.selectionAsync().catch(() => {});
      onChange(v);
    }
  };
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        {sublabel ? <Text variant="caption">{sublabel}</Text> : null}
      </View>
      <Pressable onPress={() => change(-step)} style={styles.btn} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} hitSlop={8}>
        <Minus size={18} color={colors.ink} />
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`${label}: ${format ? format(value) : value}`}>
        {format ? format(value) : value}
      </Text>
      <Pressable onPress={() => change(step)} style={styles.btn} accessibilityRole="button" accessibilityLabel={`Increase ${label}`} hitSlop={8}>
        <Plus size={18} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function ToggleRow({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{label}</Text>
        {sublabel ? <Text variant="caption" style={{ marginTop: 2 }}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.rose, false: '#E6D9DB' }}
        thumbColor={colors.surface}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: fonts.heavy, fontSize: 17, minWidth: 44, textAlign: 'center', color: colors.ink },
});
