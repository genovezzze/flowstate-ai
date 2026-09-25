import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Activity, Dumbbell, House, MessageSquareText, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, radii, shadow } from '@/theme/tokens';
import { Text } from './Text';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  train: Dumbbell,
  cycle: Activity,
  coach: MessageSquareText,
};

export const TAB_BAR_HEIGHT = 68;

// Real frosted glass on iOS; an almost-opaque surface elsewhere (Android/web blur is unreliable).
function Bar({ style, children }: { style: object; children: React.ReactNode }) {
  if (Platform.OS === 'ios')
    return (
      <BlurView intensity={50} tint="light" style={style}>
        {children}
      </BlurView>
    );
  return <View style={style}>{children}</View>;
}

/** Floating frosted "pill" tab bar from the demo design. */
export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={[styles.shadow, shadow.float]}>
        <Bar style={styles.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = options.title ?? route.name;
            const Icon = ICONS[route.name] ?? House;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                style={[styles.item, focused && styles.itemActive]}
              >
                <Icon size={22} color={focused ? colors.rose : colors.ink} strokeWidth={focused ? 2.4 : 2} />
                <Text style={[styles.label, { color: focused ? colors.rose : colors.ink }]}>{label}</Text>
              </Pressable>
            );
          })}
        </Bar>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  shadow: { borderRadius: radii.pill, width: '100%' },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: radii.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.55)' : 'rgba(255,253,252,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  item: {
    flex: 1,
    height: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemActive: { backgroundColor: 'rgba(246,218,223,0.75)' },
  label: { fontFamily: fonts.semibold, fontSize: 11 },
});
