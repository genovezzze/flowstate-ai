import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Text } from '@/components/Text';
import { authClient } from '@/lib/api';
import { pull } from '@/lib/sync';
import { colors, fonts, radii, space } from '@/theme/tokens';

type Mode = 'sign-in' | 'sign-up';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('sign-up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<null | 'email' | 'apple' | 'google'>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const done = async () => {
    const s = await authClient.getSession();
    if (s.data?.user) await pull(s.data.user.id).catch(() => {});
    router.replace('/');
  };

  const withEmail = async () => {
    setError(null);
    setBusy('email');
    try {
      const res =
        mode === 'sign-up'
          ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.split('@')[0] })
          : await authClient.signIn.email({ email: email.trim(), password });
      if (res.error) setError(res.error.message ?? 'Something went wrong');
      else await done();
    } catch {
      setError('Can’t reach the server. Check your internet connection.');
    } finally {
      setBusy(null);
    }
  };

  const withApple = async () => {
    setError(null);
    setBusy('apple');
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) throw new Error('no token');
      const res = await authClient.signIn.social({ provider: 'apple', idToken: { token: cred.identityToken } });
      if (res.error) setError(res.error.message ?? 'Apple sign-in failed');
      else await done();
    } catch (e: unknown) {
      if ((e as { code?: string })?.code !== 'ERR_REQUEST_CANCELED') setError('Apple sign-in failed. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const withGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      const res = await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
      if (res?.error) setError(res.error.message ?? 'Google sign-in failed');
      else {
        const s = await authClient.getSession();
        if (s.data) await done();
      }
    } catch {
      setError('Google sign-in failed. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const validEmail = /.+@.+\..+/.test(email.trim()) && password.length >= 8;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Card color={colors.forest} grainy padding={0}>
          <LinearGradient
            colors={['rgba(168,187,166,0.6)', 'rgba(78,107,87,0)', 'rgba(201,115,127,0.45)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.logo}>
              <Sparkles size={24} color={colors.forest} />
            </View>
            <Text variant="display" color={colors.onDark} style={{ marginTop: 20 }}>
              FlowState
            </Text>
            <Text style={styles.tagline}>Train with your cycle, not despite it.</Text>
          </LinearGradient>
        </Card>

        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={27}
            style={styles.apple}
            onPress={withApple}
          />
        )}
        <Pressable
          onPress={withGoogle}
          disabled={!!busy}
          style={({ pressed }) => [styles.google, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
        >
          <Text style={styles.gMark}>G</Text>
          <Text style={styles.googleText}>{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text variant="caption">or with email</Text>
          <View style={styles.line} />
        </View>

        {mode === 'sign-up' && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="First name"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="words"
            style={styles.input}
            accessibilityLabel="First name"
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
          accessibilityLabel="Email"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'sign-up' ? 'Password (8+ characters)' : 'Password'}
          placeholderTextColor={colors.inkMuted}
          secureTextEntry
          autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
          style={styles.input}
          accessibilityLabel="Password"
          onSubmitEditing={() => validEmail && withEmail()}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={mode === 'sign-up' ? 'Create account' : 'Sign in'}
          onPress={withEmail}
          disabled={!validEmail || !!busy}
          loading={busy === 'email'}
        />

        <Pressable onPress={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(null); }} style={{ alignSelf: 'center', padding: 8 }}>
          <Text variant="bodyStrong" color={colors.mauve}>
            {mode === 'sign-up' ? 'I already have an account' : 'Create a new account'}
          </Text>
        </Pressable>

        <Text variant="caption" align="center">
          Your data is stored in the EU and you can delete your account anytime in Profile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, gap: 12 },
  hero: { padding: 24, minHeight: 220, justifyContent: 'flex-end' },
  logo: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  tagline: { fontFamily: fonts.semibold, fontSize: 17, color: colors.onDark, marginTop: 4 },
  apple: { height: 54, width: '100%', marginTop: 8 },
  google: {
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gMark: { fontFamily: fonts.heavy, fontSize: 18, color: '#4285F4' },
  googleText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.inkMuted },
  input: {
    height: 54,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 14 },
});
