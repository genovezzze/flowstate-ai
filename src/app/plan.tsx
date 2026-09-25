import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import {
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplet,
  HeartPulse,
  Repeat,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Sheet, SheetOption } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { itemFor, PHASE_LABEL, swapOptions, type PlanItem, type Verdict } from '@/engine';
import { isoDate } from '@/lib/date';
import { formatVolume, INTENSITY } from '@/lib/format';
import { historyOf, todaySession, useApp } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';

const MODE: Record<Verdict, string> = {
  PUSH: 'Build',
  AS_PLANNED: 'Steady',
  REDUCE: 'Ease off',
  MODIFY: 'Modify',
  RECOVER: 'Rest & recover',
};

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const session = useApp((s) => todaySession(s.sessions));
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const periods = useApp((s) => s.periods);
  const { updateItem, startSession, logPeriodStart } = useApp.getState();
  const [open, setOpen] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  if (!session) return <Redirect href="/" />;
  const { decision, items, status } = session;
  const phase = decision.cycle.phase ?? (session.checkin.bleeding === 'yes' ? 'menstrual' : null);
  const badge = `${phase ? PHASE_LABEL[phase] + ' · ' : ''}${MODE[decision.verdict]}`;
  const todayIso = isoDate(new Date());
  const suggestPeriod =
    session.checkin.bleeding === 'yes' && decision.cycle.phase !== 'menstrual' && !periods.some((p) => p.start === todayIso);
  const editable = status === 'planned' || status === 'in_progress';

  const swapping = swapIndex != null ? items[swapIndex] : null;
  const options = swapping ? swapOptions(swapping.slug, profile, decision).filter((e) => !items.some((i) => i.slug === e.slug)) : [];

  const start = () => {
    startSession(session.id);
    router.replace('/session');
  };

  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={styles.flex}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <X size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.topTitle}>
          <HeartPulse size={16} color={colors.rose} />
          <Text variant="title">Train</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {/* Recommendation */}
        <Card padding={18}>
          <View style={styles.recHead}>
            <View style={styles.recIcon}>
              <Sparkles size={14} color={colors.mauve} />
            </View>
            <Text variant="overline">Today's recommendation</Text>
          </View>
          <Text style={styles.headline}>{decision.headline}</Text>

          <Pressable
            onPress={() => setOpen((o) => !o)}
            style={styles.why}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityLabel="Why this recommendation"
          >
            <Text style={styles.whyText}>Why?</Text>
            <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <ChevronDown size={16} color={colors.mauve} />
            </View>
          </Pressable>

          {open && (
            <View style={styles.whyBody}>
              {decision.why.map((w) => (
                <View key={w} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={{ flex: 1 }}>{w}</Text>
                </View>
              ))}
              <Text variant="caption" style={{ marginTop: 6 }}>
                Alternative
              </Text>
              <Text>{decision.alternative}</Text>
              <Text variant="caption" style={{ marginTop: 6 }}>
                General fitness guidance, not medical advice.
              </Text>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.factors}>
            {decision.factors.map((f) => (
              <Chip
                key={f.key}
                size="sm"
                tone={f.key === 'phase' ? 'rose' : f.key === 'readiness' ? 'sage' : 'neutral'}
                label={f.label}
                icon={
                  f.key === 'phase' ? (
                    <Droplet size={12} color={colors.mauve} fill={colors.mauve} />
                  ) : f.key === 'readiness' ? (
                    <Zap size={12} color={colors.forest} fill={colors.forest} />
                  ) : f.key === 'volume' ? (
                    <BarChart3 size={12} color={colors.rose} />
                  ) : undefined
                }
              />
            ))}
          </ScrollView>
        </Card>

        {suggestPeriod && (
          <Card color="#FFF4F1" elevated={false}>
            <View style={styles.periodRow}>
              <CalendarPlus size={18} color={colors.danger} />
              <Text style={{ flex: 1 }}>Did your period start today?</Text>
              <Pressable onPress={() => logPeriodStart(todayIso)} style={styles.periodBtn} accessibilityRole="button">
                <Text style={styles.periodBtnText}>Log it</Text>
              </Pressable>
            </View>
          </Card>
        )}

        <View style={styles.badge}>
          <Droplet size={12} color={colors.onDark} fill={colors.onDark} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>

        <View>
          <Text style={styles.h1} accessibilityRole="header">
            {status === 'done' ? 'Today’s session' : 'Your plan for today'}
          </Text>
          <Text style={{ color: colors.inkMuted, marginTop: 6 }}>
            {session.dayName ? `${session.dayName} · ` : ''}
            {session.checkin.minutes} min · adjusted to your readiness and cycle.
          </Text>
        </View>

        {status === 'done' && (
          <Card>
            <View style={styles.periodRow}>
              <CheckCircle2 size={20} color={colors.forest} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                Completed · effort {session.rpe}/10
              </Text>
            </View>
          </Card>
        )}

        {items.map((ex, i) => (
          <ExerciseCard
            key={ex.slug}
            ex={ex}
            done={(session.logs[ex.slug] ?? []).filter((l) => l.done).length}
            onOpen={() => router.push({ pathname: '/exercise/[slug]', params: { slug: ex.slug } })}
            onCustomize={editable ? () => setSwapIndex(i) : undefined}
          />
        ))}
      </ScrollView>

      {editable && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient
            colors={['rgba(252,239,240,0)', colors.bgCheckin, colors.bgCheckin]}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Button label={status === 'in_progress' ? 'Continue session' : 'Start session'} onPress={start} />
        </View>
      )}

      <Sheet
        visible={swapping != null}
        onClose={() => setSwapIndex(null)}
        title={swapping ? `Swap ${swapping.name}` : ''}
        subtitle="Options that fit today and your setup"
      >
        {options.length === 0 && <Text>No alternatives fit today — you can skip this exercise in the session.</Text>}
        {options.map((e) => (
          <SheetOption
            key={e.slug}
            icon={<Repeat size={16} color={colors.mauve} />}
            title={e.name}
            subtitle={`${INTENSITY[e.intensity].label} · ${e.muscles.join(', ')}`}
            onPress={() => {
              if (swapIndex == null) return;
              updateItem(session.id, swapIndex, itemFor(e, profile, decision, historyOf(sessions)));
              setSwapIndex(null);
            }}
          />
        ))}
      </Sheet>
    </LinearGradient>
  );
}

function ExerciseCard({
  ex,
  done,
  onOpen,
  onCustomize,
}: {
  ex: PlanItem;
  done: number;
  onOpen: () => void;
  onCustomize?: () => void;
}) {
  const it = INTENSITY[ex.intensity];
  return (
    <Card padding={16} onPress={onOpen} accessibilityLabel={`${ex.name}, ${formatVolume(ex)}`}>
      <View style={styles.exHead}>
        <View style={{ flex: 1 }}>
          <Text variant="title">{ex.name}</Text>
          <Text variant="caption" style={{ marginTop: 2 }}>
            {formatVolume(ex)}
            {done ? ` · ${done}/${ex.sets} sets done` : ''}
          </Text>
        </View>
        <View style={styles.intensity}>
          <View style={[styles.intDot, { backgroundColor: it.dot }]} />
          <Text style={styles.intText}>{it.label}</Text>
        </View>
      </View>

      <View style={styles.hint}>
        <TrendingUp size={14} color={colors.mauve} />
        <Text style={styles.hintText}>{ex.hint}</Text>
      </View>

      <View style={styles.exFoot}>
        <View style={styles.rest}>
          <Clock size={13} color={colors.inkMuted} />
          <Text variant="caption">{ex.restSec >= 60 ? `${+(ex.restSec / 60).toFixed(1)} min rest` : `${ex.restSec}s rest`}</Text>
        </View>
        {onCustomize ? (
          <Pressable onPress={onCustomize} style={styles.customize} accessibilityRole="button" accessibilityLabel={`Customize ${ex.name}`} hitSlop={6}>
            <SlidersHorizontal size={13} color={colors.rose} />
            <Text style={styles.customizeText}>Customize</Text>
          </Pressable>
        ) : (
          <ChevronRight size={16} color={colors.inkMuted} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingBottom: 8,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  content: { paddingHorizontal: space.gutter, paddingTop: 8, gap: 14 },
  recHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { fontFamily: fonts.heavy, fontSize: 19, lineHeight: 24, color: colors.ink, marginTop: 10 },
  why: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#FBE8EB',
    borderWidth: 1,
    borderColor: '#F2CDD3',
  },
  whyText: { fontFamily: fonts.bold, fontSize: 13, color: colors.mauve },
  whyBody: { marginTop: 12, gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.rose, marginTop: 8 },
  factors: { gap: 6, marginTop: 14 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.danger },
  periodBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onDark },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    marginTop: 4,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onDark },
  h1: { fontFamily: fonts.heavy, fontSize: 28, letterSpacing: -0.4, color: colors.ink },
  exHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  intensity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: '#F6EFEF',
  },
  intDot: { width: 7, height: 7, borderRadius: 4 },
  intText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkSoft },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#F2D6DA',
    backgroundColor: '#FFF8F8',
  },
  hintText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: colors.inkSoft },
  exFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  customize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#FBE8EB',
  },
  customizeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.rose },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.gutter, paddingTop: 36 },
});
