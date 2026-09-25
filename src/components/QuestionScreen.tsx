import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from './Button';
import { StepHeader } from './StepHeader';
import { Text } from './Text';
import { colors, space } from '@/theme/tokens';

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel: string;
  canContinue: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  direction?: 1 | -1;
  closeIcon?: boolean;
};

/** Shared layout for one-question-per-screen flows (check-in, onboarding). */
export function QuestionScreen({
  step,
  total,
  title,
  subtitle,
  children,
  ctaLabel,
  canContinue,
  onNext,
  onBack,
  onClose,
  direction = 1,
}: Props) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [step, anim]);

  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={styles.flex}>
      <KeyboardAvoidingView style={[styles.flex, { paddingTop: insets.top + 8 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.pad}>
          <StepHeader step={step} total={total} onBack={onBack} onClose={onClose} />
        </View>

        <ScrollView contentContainerStyle={[styles.pad, styles.body]} keyboardShouldPersistTaps="handled">
          <Animated.View
            style={{
              opacity: anim,
              transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [24 * direction, 0] }) }],
            }}
          >
            <Text variant="question" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            <View style={styles.answers}>{children}</View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.pad, { paddingBottom: insets.bottom + 16, paddingTop: 12 }]}>
          <Button label={ctaLabel} onPress={onNext} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: space.gutter },
  body: { paddingTop: 28, paddingBottom: 24 },
  sub: { marginTop: 8, color: colors.inkMuted, fontSize: 14 },
  answers: { marginTop: 28, gap: 10 },
});
