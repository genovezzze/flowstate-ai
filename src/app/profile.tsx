import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Download, FlaskConical, LogOut, Trash2, X } from 'lucide-react-native';
import { authClient, backendEnabled } from '@/lib/api';
import { stopSync } from '@/lib/sync';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Stepper, ToggleRow } from '@/components/Stepper';
import { Text } from '@/components/Text';
import { CONTRACEPTION, DAYS, EQUIPMENT, EXPERIENCE, GOALS, LIMITATIONS, TIME } from '@/lib/options';
import { loadDemoData } from '@/mocks/user';
import { useApp } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useApp((s) => s.profile);
  const cycle = useApp((s) => s.cycle);
  const { updateProfile, updateCycle, deleteAllData } = useApp.getState();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const session = authClient.useSession();
  const email = backendEnabled ? session.data?.user?.email : undefined;

  const signOut = async () => {
    stopSync();
    await authClient.signOut().catch(() => {});
    deleteAllData(); // local copy only — your data stays in your account
    router.dismissAll();
    router.replace('/sign-in');
  };

  const exportData = async () => {
    const s = useApp.getState();
    const data = {
      exportedAt: new Date().toISOString(),
      profile: s.profile,
      cycle: s.cycle,
      periods: s.periods,
      consents: s.consents,
      sessions: s.sessions,
      coach: s.coach,
    };
    await Share.share({ message: JSON.stringify(data, null, 2), title: 'FlowState data export' }).catch(() => {});
  };

  const del = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (backendEnabled) {
      stopSync();
      // Deletes the account and (via ON DELETE CASCADE) all her data in Neon.
      await authClient.deleteUser().catch(() => {});
    }
    deleteAllData();
    router.dismissAll();
    router.replace(backendEnabled ? '/sign-in' : '/onboarding');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text variant="serifTitle">Profile</Text>
        <Pressable onPress={() => router.back()} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Section title="You">
          <TextInput
            value={profile.name}
            onChangeText={(name) => updateProfile({ name })}
            placeholder="Name"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            accessibilityLabel="Name"
          />
        </Section>

        <Section title="Goal">
          <Chips options={GOALS} value={profile.goal} onChange={(goal) => updateProfile({ goal })} />
        </Section>
        <Section title="Experience">
          <Chips options={EXPERIENCE} value={profile.experience} onChange={(experience) => updateProfile({ experience })} />
        </Section>
        <Section title="Days per week">
          <Chips options={DAYS} value={profile.daysPerWeek} onChange={(daysPerWeek) => updateProfile({ daysPerWeek })} />
        </Section>
        <Section title="Where you train">
          <Chips options={EQUIPMENT} value={profile.equipment} onChange={(equipment) => updateProfile({ equipment })} />
        </Section>
        <Section title="Usual session">
          <Chips options={TIME} value={profile.defaultMinutes} onChange={(defaultMinutes) => updateProfile({ defaultMinutes })} />
        </Section>
        <Section title="Go easy on">
          <View style={styles.chips}>
            {LIMITATIONS.map((o) => (
              <Chip
                key={o.v}
                label={o.label}
                selected={profile.limitations.includes(o.v)}
                onPress={() =>
                  updateProfile({
                    limitations: profile.limitations.includes(o.v)
                      ? profile.limitations.filter((x) => x !== o.v)
                      : [...profile.limitations, o.v],
                  })
                }
              />
            ))}
          </View>
        </Section>

        <Section title="Cycle">
          <View style={{ gap: 8 }}>
            <Stepper label="Cycle length" value={cycle.cycleLength} onChange={(v) => updateCycle({ cycleLength: v })} min={21} max={40} format={(v) => `${v} d`} />
            <Stepper label="Period length" value={cycle.periodLength} onChange={(v) => updateCycle({ periodLength: v })} min={2} max={8} format={(v) => `${v} d`} />
            <ToggleRow label="Irregular cycle" value={cycle.irregular} onChange={(irregular) => updateCycle({ irregular })} />
          </View>
        </Section>
        <Section title="Contraception">
          <Chips options={CONTRACEPTION} value={cycle.contraception} onChange={(contraception) => updateCycle({ contraception })} />
        </Section>

        {email ? (
          <Section title="Account">
            <Row icon={<LogOut size={18} color={colors.ink} />} label="Sign out" sub={email} onPress={signOut} />
          </Section>
        ) : null}

        <Section title="Your data">
          <View style={{ gap: 8 }}>
            <Row icon={<Download size={18} color={colors.ink} />} label="Export my data" onPress={exportData} />
            <Row icon={<FlaskConical size={18} color={colors.ink} />} label="Load demo history" sub="Fills 3 weeks of sample sessions — for testing" onPress={() => { loadDemoData(); router.back(); }} />
            <Row
              icon={<Trash2 size={18} color={colors.danger} />}
              label={confirmDelete ? 'Tap again to delete everything' : backendEnabled ? 'Delete my account' : 'Delete all my data'}
              sub={backendEnabled ? 'Permanently deletes your account and all data on the server and this phone' : 'Removes profile, cycle logs, sessions and chats from this device'}
              danger
              onPress={del}
            />
          </View>
        </Section>

        <Card elevated={false} color="#EFE7DF">
          <Text variant="caption">
            FlowState provides general fitness guidance and is not a medical device or medical advice. If something feels
            wrong, stop and talk to a doctor.
          </Text>
          <Text variant="caption" style={{ marginTop: 8 }}>
            Version {Constants.expoConfig?.version ?? '1.0.0'} · beta
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="overline">{title}</Text>
      {children}
    </View>
  );
}

function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Chip key={String(o.v)} label={o.label} selected={value === o.v} onPress={() => onChange(o.v)} />
      ))}
    </View>
  );
}

function Row({ icon, label, sub, onPress, danger }: { icon: React.ReactNode; label: string; sub?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={danger ? colors.danger : undefined}>
          {label}
        </Text>
        {sub ? <Text variant="caption">{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.gutter, paddingBottom: 10 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: space.gutter, gap: 20, paddingTop: 6 },
  input: { height: 52, borderRadius: radii.md, backgroundColor: colors.surface, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radii.md, backgroundColor: colors.surface },
});
