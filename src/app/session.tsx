import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleMinus,
  CirclePlus,
  Clock,
  Dumbbell,
  Feather,
  MessageSquareText,
  Minus,
  Plus,
  Repeat,
  Timer,
  X,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Sheet, SheetOption } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { itemFor, swapOptions, type PlanItem } from '@/engine';
import { formatKg, formatVolume, INTENSITY, isTimed } from '@/lib/format';
import { historyOf, todaySession, useApp, type SetLog } from '@/state/app';
import { colors, fonts, radii, shadow, space } from '@/theme/tokens';

const weightStep = (ex: PlanItem) => (ex.equipment === 'barbell' || ex.equipment === 'machine' ? 2.5 : 1);
/** Sensible first weight when the user has never logged this exercise. */
const startWeight = (ex: PlanItem) =>
  ex.equipment === 'dumbbell' ? 4 : ex.equipment === 'barbell' ? 20 : ex.equipment === 'machine' ? 20 : 15;

const initialLogs = (ex: PlanItem): SetLog[] =>
  Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weightKg: ex.weightKg, done: false }));

export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const session = useApp((s) => todaySession(s.sessions));
  const profile = useApp((s) => s.profile);
  const sessions = useApp((s) => s.sessions);
  const { setLogs, updateItem, finishSession } = useApp.getState();

  const [expanded, setExpanded] = useState(0);
  const [heavyFor, setHeavyFor] = useState<number | null>(null);
  const [swapFor, setSwapFor] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rest, setRest] = useState<{ until: number; total: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (rest && now >= rest.until) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setRest(null);
    }
  }, [now, rest]);

  const history = useMemo(() => historyOf(sessions), [sessions]);

  if (!session) return <Redirect href="/" />;
  if (session.status === 'done') return <Redirect href="/plan" />;

  const { items } = session;
  const logsFor = (ex: PlanItem) => session.logs[ex.slug] ?? initialLogs(ex);
  const totalSets = items.reduce((n, ex) => n + logsFor(ex).length, 0);
  const doneSets = items.reduce((n, ex) => n + logsFor(ex).filter((l) => l.done).length, 0);

  const update = (ex: PlanItem, index: number, patch: Partial<SetLog>) => {
    const logs = logsFor(ex).map((l, i) => (i === index ? { ...l, ...patch } : l));
    setLogs(session.id, ex.slug, logs);
  };

  const toggleDone = (ex: PlanItem, exIndex: number, setIndex: number) => {
    const logs = logsFor(ex);
    const wasDone = logs[setIndex].done;
    update(ex, setIndex, { done: !wasDone });
    if (!wasDone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (ex.restSec > 0) setRest({ until: Date.now() + ex.restSec * 1000, total: ex.restSec });
      const allDone = logs.every((l, i) => i === setIndex || l.done);
      if (allDone && exIndex < items.length - 1) setExpanded(exIndex + 1);
    }
  };

  /** Apply a "feels too heavy" adjustment to the remaining (not done) sets. */
  const lighten = (exIndex: number, kind: 'weight' | 'reps' | 'rest') => {
    const ex = items[exIndex];
    if (kind === 'rest') {
      updateItem(session.id, exIndex, { ...ex, restSec: ex.restSec + 30, hint: 'Extra 30 s rest between sets' });
    } else {
      const step = weightStep(ex);
      const logs = logsFor(ex).map((l) => {
        if (l.done) return l;
        if (kind === 'weight' && l.weightKg != null)
          return { ...l, weightKg: Math.max(step, Math.round((l.weightKg * 0.9) / step) * step) };
        if (kind === 'reps') return { ...l, reps: Math.max(isTimed(ex) ? 10 : 3, l.reps - (isTimed(ex) ? 10 : 2)) };
        return l;
      });
      setLogs(session.id, ex.slug, logs);
    }
    setHeavyFor(null);
  };

  const askCoach = (ex: PlanItem) => {
    const logs = logsFor(ex)
      .map((l, i) => `set ${i + 1}: ${l.reps}${isTimed(ex) ? ' s' : ' reps'}${l.weightKg != null ? ` at ${formatKg(l.weightKg)} kg` : ''}`)
      .join(', ');
    const msg = `I am doing ${ex.name} in today's workout and it feels too heavy. The plan is ${formatVolume(ex)}, ${INTENSITY[ex.intensity].label.toLowerCase()}, ${ex.restSec}s rest. Current sets: ${logs}. Can you help me adjust this exercise safely?`;
    setHeavyFor(null);
    router.push({ pathname: '/ask-coach', params: { prefill: msg } });
  };

  const elapsed = Math.floor((now - startedAt) / 1000);
  const restLeft = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;
  const heavyEx = heavyFor != null ? items[heavyFor] : null;
  const swapEx = swapFor != null ? items[swapFor] : null;
  const swapList = swapEx
    ? swapOptions(swapEx.slug, profile, session.decision).filter((e) => !items.some((i) => i.slug === e.slug))
    : [];

  return (
    <LinearGradient colors={[colors.bgCheckinTop, colors.bgCheckin]} style={{ flex: 1 }}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Minimise session">
          <X size={20} color={colors.ink} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text variant="title">Generated Session</Text>
          <Text variant="caption">
            {doneSets}/{totalSets} sets · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }]} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}>
        {items.map((ex, exIndex) => {
          const logs = logsFor(ex);
          const open = expanded === exIndex;
          const complete = logs.every((l) => l.done);
          const timed = isTimed(ex);
          return (
            <View key={ex.slug} style={[styles.card, shadow.card]}>
              <Pressable
                onPress={() => setExpanded(open ? -1 : exIndex)}
                style={styles.cardHead}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${ex.name}${complete ? ', done' : ''}`}
              >
                <View style={styles.exIcon}>
                  <Dumbbell size={18} color={colors.rose} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="title">{ex.name}</Text>
                  <Text variant="caption" style={{ marginTop: 2 }}>
                    {formatVolume(ex)} · {INTENSITY[ex.intensity].label} · rest {ex.restSec}s
                  </Text>
                </View>
                {complete ? (
                  <View style={styles.doneDot}>
                    <Check size={12} color={colors.onDark} strokeWidth={3} />
                  </View>
                ) : null}
                {open ? <ChevronUp size={20} color={colors.inkSoft} /> : <ChevronDown size={20} color={colors.inkSoft} />}
              </Pressable>

              {open && (
                <View style={styles.cardBody}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/exercise/[slug]', params: { slug: ex.slug } })}
                    style={styles.tutorial}
                    accessibilityRole="button"
                  >
                    <Text style={styles.tutorialText}>▶ How to do it</Text>
                  </Pressable>

                  {logs.map((l, i) => (
                    <View key={i} style={[styles.setRow, l.done && styles.setRowDone]}>
                      <Text style={styles.setLabel}>Set {i + 1}</Text>

                      <View style={styles.valueBox}>
                        <Text style={styles.valueNum}>{l.reps}</Text>
                        <Text style={styles.valueUnit}>{timed ? 's' : 'reps'}</Text>
                      </View>
                      <View style={styles.pm}>
                        <Pressable onPress={() => update(ex, i, { reps: Math.max(1, l.reps - (timed ? 5 : 1)) })} style={styles.pmBtn} accessibilityLabel={`Fewer reps, set ${i + 1}`} hitSlop={4}>
                          <Minus size={16} color={colors.ink} />
                        </Pressable>
                        <View style={styles.pmDivider} />
                        <Pressable onPress={() => update(ex, i, { reps: l.reps + (timed ? 5 : 1) })} style={styles.pmBtn} accessibilityLabel={`More reps, set ${i + 1}`} hitSlop={4}>
                          <Plus size={16} color={colors.ink} />
                        </Pressable>
                      </View>

                      {ex.loadable ? (
                        <View style={styles.kg}>
                          <Pressable
                            onPress={() => update(ex, i, { weightKg: l.weightKg == null ? startWeight(ex) : Math.max(0, l.weightKg - weightStep(ex)) })}
                            accessibilityLabel={`Less weight, set ${i + 1}`}
                            hitSlop={6}
                          >
                            <CircleMinus size={20} color={colors.inkMuted} />
                          </Pressable>
                          <Text style={styles.kgText}>{l.weightKg != null ? `${formatKg(l.weightKg)} kg` : '— kg'}</Text>
                          <Pressable
                            onPress={() => update(ex, i, { weightKg: l.weightKg == null ? startWeight(ex) : l.weightKg + weightStep(ex) })}
                            accessibilityLabel={`More weight, set ${i + 1}`}
                            hitSlop={6}
                          >
                            <CirclePlus size={20} color={colors.rose} />
                          </Pressable>
                        </View>
                      ) : (
                        <View style={{ flex: 1 }} />
                      )}

                      <Pressable
                        onPress={() => toggleDone(ex, exIndex, i)}
                        style={[styles.check, l.done && styles.checkOn]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: l.done }}
                        accessibilityLabel={`Set ${i + 1} done`}
                      >
                        <Check size={16} color={l.done ? colors.onDark : colors.inkMuted} strokeWidth={3} />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable onPress={() => setHeavyFor(exIndex)} style={styles.heavy} accessibilityRole="button">
                    <Feather size={14} color={colors.inkSoft} />
                    <Text style={styles.heavyText}>Feels too heavy?</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={['rgba(252,239,240,0)', colors.bgCheckin, colors.bgCheckin]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {rest && (
          <View style={styles.rest}>
            <Timer size={18} color={colors.onDark} />
            <Text style={styles.restText}>
              Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}
            </Text>
            <Pressable onPress={() => setRest((r) => (r ? { ...r, until: r.until + 15000 } : r))} style={styles.restBtn} accessibilityLabel="Add 15 seconds">
              <Text style={styles.restBtnText}>+15s</Text>
            </Pressable>
            <Pressable onPress={() => setRest(null)} style={styles.restBtn} accessibilityLabel="Skip rest">
              <Text style={styles.restBtnText}>Skip</Text>
            </Pressable>
          </View>
        )}
        <Button label="Finish session" onPress={() => setFinishing(true)} disabled={doneSets === 0} />
      </View>

      <Sheet visible={heavyEx != null} onClose={() => setHeavyFor(null)} title="Feels too heavy?" subtitle={heavyEx?.name}>
        {heavyEx?.loadable && (
          <SheetOption icon={<Minus size={16} color={colors.mauve} />} title="Lower the weight ~10%" subtitle="Applies to the sets you haven’t done" onPress={() => lighten(heavyFor!, 'weight')} />
        )}
        <SheetOption
          icon={<Minus size={16} color={colors.mauve} />}
          title={heavyEx && isTimed(heavyEx) ? 'Shorter holds (−10 s)' : 'Do 2 fewer reps'}
          onPress={() => lighten(heavyFor!, 'reps')}
        />
        <SheetOption icon={<Clock size={16} color={colors.mauve} />} title="Rest 30 s longer" onPress={() => lighten(heavyFor!, 'rest')} />
        <SheetOption
          icon={<Repeat size={16} color={colors.mauve} />}
          title="Swap for an easier exercise"
          onPress={() => {
            const i = heavyFor;
            setHeavyFor(null);
            setSwapFor(i);
          }}
        />
        <SheetOption icon={<MessageSquareText size={16} color={colors.mauve} />} title="Ask FlowState Coach" onPress={() => heavyEx && askCoach(heavyEx)} />
      </Sheet>

      <Sheet visible={swapEx != null} onClose={() => setSwapFor(null)} title={swapEx ? `Swap ${swapEx.name}` : ''}>
        {swapList.length === 0 && <Text>No easier alternative fits today — try fewer reps or a lighter weight.</Text>}
        {swapList.map((e) => (
          <SheetOption
            key={e.slug}
            icon={<Repeat size={16} color={colors.mauve} />}
            title={e.name}
            subtitle={`${INTENSITY[e.intensity].label} · ${e.muscles.join(', ')}`}
            onPress={() => {
              if (swapFor == null) return;
              updateItem(session.id, swapFor, itemFor(e, profile, session.decision, history));
              setSwapFor(null);
            }}
          />
        ))}
      </Sheet>

      <FinishSheet
        visible={finishing}
        onClose={() => setFinishing(false)}
        onFinish={(rpe, helpful) => {
          finishSession(session.id, rpe, helpful);
          setFinishing(false);
          router.replace('/');
        }}
      />
    </LinearGradient>
  );
}

function FinishSheet({
  visible,
  onClose,
  onFinish,
}: {
  visible: boolean;
  onClose: () => void;
  onFinish: (rpe: number, helpful: boolean | undefined) => void;
}) {
  const [rpe, setRpe] = useState(7);
  const [helpful, setHelpful] = useState<boolean | undefined>(undefined);
  return (
    <Sheet visible={visible} onClose={onClose} title="How hard was it?" subtitle="1 = very easy · 10 = max effort">
      <View style={styles.rpeRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => setRpe(n)}
            style={[styles.rpe, rpe === n && styles.rpeOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: rpe === n }}
            accessibilityLabel={`Effort ${n}`}
          >
            <Text style={[styles.rpeText, rpe === n && { color: colors.onDark }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <Text variant="bodyStrong" style={{ marginTop: 12 }}>
        Were today’s adjustments helpful?
      </Text>
      <View style={styles.thumbs}>
        {[
          { v: true, label: '👍 Yes' },
          { v: false, label: '👎 Not really' },
        ].map((o) => (
          <Pressable
            key={String(o.v)}
            onPress={() => setHelpful(helpful === o.v ? undefined : o.v)}
            style={[styles.thumb, helpful === o.v && styles.thumbOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: helpful === o.v }}
          >
            <Text variant="bodyStrong">{o.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Save session" onPress={() => onFinish(rpe, helpful)} style={{ marginTop: 12 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingBottom: 10 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 4, marginHorizontal: space.gutter, borderRadius: 2, backgroundColor: '#F1E1E3', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.rose, borderRadius: 2 },
  content: { paddingHorizontal: space.gutter, paddingTop: 14, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  exIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  doneDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.ok, alignItems: 'center', justifyContent: 'center' },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  tutorial: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.sm, backgroundColor: '#FBE8EB' },
  tutorialText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.mauve },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 6, borderRadius: radii.sm },
  setRowDone: { backgroundColor: '#F1F6EF' },
  setLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted, width: 42 },
  valueBox: { width: 38, alignItems: 'center' },
  valueNum: { fontFamily: fonts.heavy, fontSize: 18, color: colors.ink, lineHeight: 20 },
  valueUnit: { fontFamily: fonts.medium, fontSize: 10, color: colors.inkMuted },
  pm: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4E9EB', borderRadius: radii.sm },
  pmBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  pmDivider: { width: 1, height: 18, backgroundColor: '#E2D2D5' },
  kg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  kgText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, minWidth: 44, textAlign: 'center' },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#E2D2D5', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.ok, borderColor: colors.ok },
  heavy: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: '#F4E9EB' },
  heavyText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkSoft },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.gutter, paddingTop: 36, gap: 10 },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.night, borderRadius: radii.pill, paddingVertical: 8, paddingLeft: 16, paddingRight: 8 },
  restText: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.onDark },
  restBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  restBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.onDark },
  rpeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rpe: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  rpeOn: { backgroundColor: colors.mauve },
  rpeText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  thumbs: { flexDirection: 'row', gap: 8, marginTop: 8 },
  thumb: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: 'transparent' },
  thumbOn: { borderColor: colors.roseSoft, backgroundColor: '#FDEBEE' },
});
