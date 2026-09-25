import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import type { Phase } from '@/engine';
import { todaySession, useApp } from '@/state/app';
import { colors, fonts } from '@/theme/tokens';

const STATUS = ['Reading your cycle phase…', 'Weighing sleep and energy…', 'Adjusting today’s load…', 'Picking your exercises…'];

const FACTS: Record<Phase | 'hormonal' | 'unknown', string> = {
  menstrual: 'Early in your period, energy and strength can dip — lighter sessions still keep your progress going.',
  follicular: 'In the follicular phase, many women feel stronger and recover faster from heavy lifting.',
  ovulatory: 'Around ovulation strength often peaks — a good moment to test a slightly heavier set.',
  luteal: 'In the luteal phase your body runs a little warmer — keep water close and rest a bit longer.',
  late_luteal: 'Pre-period days can feel heavier. Reducing volume is smart training, not a step back.',
  hormonal: 'With hormonal contraception we focus on how you feel today rather than cycle phases.',
  unknown: 'Log your period in the Cycle tab and your plans will get more personal.',
};

const MIN_MS = 2400;

export default function GeneratingScreen() {
  const today = useApp((s) => todaySession(s.sessions));
  const [i, setI] = useState(0);
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    if (!today) {
      router.back();
      return;
    }
    const loops = dots.map((d, k) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(k * 160),
          Animated.timing(d, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 380, useNativeDriver: true }),
          Animated.delay((2 - k) * 160),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    const tick = setInterval(() => setI((x) => Math.min(STATUS.length - 1, x + 1)), MIN_MS / STATUS.length);
    const done = setTimeout(() => router.replace('/plan'), MIN_MS);
    return () => {
      loops.forEach((l) => l.stop());
      clearInterval(tick);
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = today?.decision.cycle;
  const factKey = c?.phase ?? (c?.hormonal ? 'hormonal' : 'unknown');

  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={styles.wrap}>
      <View style={styles.dots}>
        {dots.map((d, k) => (
          <Animated.View key={k} style={[styles.dot, { opacity: d, transform: [{ scale: d }] }]} />
        ))}
      </View>
      <Text variant="question" align="center" accessibilityRole="header">
        Synthesising your plan…
      </Text>
      <Text style={styles.status} accessibilityLiveRegion="polite">
        {STATUS[i]}
      </Text>
      <Text align="center" style={styles.fact}>
        {FACTS[factKey]}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.rose },
  status: { fontFamily: fonts.semibold, fontSize: 14, color: colors.rose, textAlign: 'center' },
  fact: { color: colors.inkMuted, fontSize: 15, lineHeight: 22, maxWidth: 320 },
});
