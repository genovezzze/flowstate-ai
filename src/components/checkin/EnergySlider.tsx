import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { colors, fonts, radii } from '@/theme/tokens';

export const ENERGY_LABELS = ['Drained', 'Low', 'OK', 'Ready', 'On fire'] as const;
const LABEL_COLORS = ['#B08A3E', '#A7964A', '#7E8F5A', '#5F8F6B', '#4E6B57'];
const KNOB = 28;

type Props = { value: number; onChange: (v: 1 | 2 | 3 | 4 | 5) => void };

/** 5-step snapping slider with the yellow→green gradient from the design. */
export function EnergySlider({ value, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const lastRef = useRef(value);

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const v = (Math.round(ratio * 4) + 1) as 1 | 2 | 3 | 4 | 5;
    if (v !== lastRef.current) {
      lastRef.current = v;
      Haptics.selectionAsync().catch(() => {});
      onChange(v);
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const pos = ((value - 1) / 4) * width;

  return (
    <View>
      <Text style={[styles.value, { color: LABEL_COLORS[value - 1] }]} accessibilityLiveRegion="polite">
        {ENERGY_LABELS[value - 1]}
      </Text>

      <View
        style={styles.hit}
        onLayout={onLayout}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Energy"
        accessibilityValue={{ text: ENERGY_LABELS[value - 1] }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && value < 5) onChange((value + 1) as 1 | 2 | 3 | 4 | 5);
          if (e.nativeEvent.actionName === 'decrement' && value > 1) onChange((value - 1) as 1 | 2 | 3 | 4 | 5);
        }}
      >
        <View style={styles.track} pointerEvents="none">
          <LinearGradient
            colors={['#F2E3A2', '#9DBB8C', colors.forest]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fill, { width: Math.max(pos, 6) }]}
          />
        </View>
        <View pointerEvents="none" style={[styles.knob, { left: pos - KNOB / 2 }]} />
      </View>

      <View style={styles.ends}>
        <Text style={styles.end}>Drained</Text>
        <Text style={styles.end}>On fire</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontFamily: fonts.heavy, fontSize: 28, textAlign: 'center', marginBottom: 18 },
  hit: { height: 40, justifyContent: 'center', marginHorizontal: KNOB / 2 },
  track: { height: 8, borderRadius: radii.pill, backgroundColor: '#F1E1E3', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.forest,
    borderWidth: 3,
    borderColor: '#DDE7DA',
    top: (40 - KNOB) / 2,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  end: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted },
});
