import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Dumbbell, X } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';
import { EXERCISE_BY_SLUG } from '@/engine';
import { INTENSITY } from '@/lib/format';
import { colors, fonts, radii, space } from '@/theme/tokens';

const EQUIPMENT_LABEL: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  band: 'Band',
};

export default function ExerciseScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const ex = EXERCISE_BY_SLUG[slug ?? ''];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgCheckinTop }}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <X size={20} color={colors.ink} />
        </Pressable>
        <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
          {ex?.name ?? 'Exercise'}
        </Text>
      </View>

      {!ex ? (
        <Text style={{ padding: space.gutter }}>Exercise not found.</Text>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          {/* Media placeholder — licensed video/animation goes here (SPEC §9) */}
          <Card color={colors.night} grainy padding={0}>
            <LinearGradient colors={['rgba(201,115,127,0.35)', 'rgba(42,42,44,0)']} style={styles.media}>
              <View style={styles.mediaIcon}>
                <Dumbbell size={34} color={colors.onDark} />
              </View>
              <Text style={styles.mediaText}>Video tutorial coming soon</Text>
            </LinearGradient>
          </Card>

          <View style={styles.chips}>
            <Chip size="sm" label={INTENSITY[ex.intensity].label} tone="rose" />
            <Chip size="sm" label={EQUIPMENT_LABEL[ex.equipment]} />
            {ex.muscles.map((m) => (
              <Chip key={m} size="sm" label={m} tone="sage" />
            ))}
          </View>

          <Card>
            <Text variant="overline">How to do it</Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              {ex.cues.map((c, i) => (
                <View key={c} style={styles.cue}>
                  <View style={styles.cueNum}>
                    <Text style={styles.cueNumText}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1 }}>{c}</Text>
                </View>
              ))}
            </View>
          </Card>

          {ex.substitutes.length > 0 && (
            <Card>
              <Text variant="overline">Easier alternatives</Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {ex.substitutes.map((s) => {
                  const alt = EXERCISE_BY_SLUG[s];
                  if (!alt) return null;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => router.setParams({ slug: s })}
                      style={styles.alt}
                      accessibilityRole="button"
                    >
                      <Text variant="bodyStrong" style={{ flex: 1 }}>
                        {alt.name}
                      </Text>
                      <Text variant="caption">{INTENSITY[alt.intensity].label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          )}

          <Text variant="caption" align="center">
            Stop if you feel sharp pain. This is general guidance, not medical advice.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingBottom: 10 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.gutter, gap: 14 },
  media: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mediaIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  mediaText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onDarkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cue: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cueNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  cueNumText: { fontFamily: fonts.bold, fontSize: 12, color: colors.mauve },
  alt: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radii.md, backgroundColor: '#FBF4F4' },
});
