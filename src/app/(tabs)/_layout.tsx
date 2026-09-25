import { Redirect, Tabs } from 'expo-router';
import { useApp } from '@/state/app';
import { authClient, backendEnabled } from '@/lib/api';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { colors } from '@/theme/tokens';

// Nutrition tab is intentionally hidden for the MVP (see docs/SPEC.md §2).
export default function TabsLayout() {
  const onboarded = useApp((s) => s.onboarded);
  const session = authClient.useSession();
  if (backendEnabled) {
    if (session.isPending) return null;
    if (!session.data) return <Redirect href="/sign-in" />;
  }
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="cycle" options={{ title: 'Cycle' }} />
      <Tabs.Screen name="coach" options={{ title: 'Coach' }} />
    </Tabs>
  );
}
