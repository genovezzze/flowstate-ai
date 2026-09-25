import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, shadow } from '@/theme/tokens';

const grain = require('../../assets/textures/grain.png');

type Props = {
  children?: ReactNode;
  color?: string;
  /** Film-grain overlay like on the colored Today cards. */
  grainy?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  elevated?: boolean;
  accessibilityLabel?: string;
};

export function Card({
  children,
  color = colors.surface,
  grainy,
  onPress,
  style,
  padding = 18,
  elevated = true,
  accessibilityLabel,
}: Props) {
  // Outer view carries the shadow, inner view clips the grain to the radius
  // (overflow: hidden on the same view would clip the iOS shadow).
  const inner = (
    <View style={[styles.clip, { backgroundColor: color }]}>
      {grainy ? (
        <Image
          source={grain}
          resizeMode="repeat"
          style={[StyleSheet.absoluteFill, styles.grain]}
        />
      ) : null}
      <View style={{ padding, flexGrow: 1 }}>{children}</View>
    </View>
  );

  const outer = [styles.card, elevated && shadow.card, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [...outer, pressed && styles.pressed]}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={outer}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg },
  clip: { borderRadius: radii.lg, overflow: 'hidden', flexGrow: 1 },
  grain: { opacity: 0.9, pointerEvents: 'none' },
  pressed: { transform: [{ scale: 0.985 }] },
});
