import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { useHydrated } from '@/lib/useHydrated';
import { authClient, backendEnabled } from '@/lib/api';
import { startSync, stopSync } from '@/lib/sync';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    DMSerifDisplay_400Regular,
  });

  const hydrated = useHydrated();
  const ready = (loaded || !!error) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      {backendEnabled && <SyncManager />}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="checkin"
          options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: colors.bgCheckin } }}
        />
        <Stack.Screen
          name="generating"
          options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="plan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="sign-in" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="exercise/[slug]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="ask-coach" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

/** Starts / stops background sync with Neon when the user signs in or out. */
function SyncManager() {
  const { data } = authClient.useSession();
  const userId = data?.user?.id;
  useEffect(() => {
    if (userId) startSync(userId);
    else stopSync();
    return () => stopSync();
  }, [userId]);
  return null;
}
