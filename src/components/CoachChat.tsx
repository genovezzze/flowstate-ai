import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ArrowUp, Dumbbell, Sparkles, Trash2 } from 'lucide-react-native';
import { Chip } from './Chip';
import { Text } from './Text';
import { aiConnected, askCoach } from '@/lib/coach';
import { apiFetch, backendEnabled } from '@/lib/api';
import { todaySession, useApp } from '@/state/app';
import { colors, fonts, radii, space } from '@/theme/tokens';

const SUGGESTIONS = [
  'This weight feels too heavy',
  'I have cramps today — what should I change?',
  'I slept badly, should I still train?',
  'My legs are sore from last session',
];

type Props = {
  prefill?: string;
  bottomInset: number;
  header?: React.ReactNode;
};

export function CoachChat({ prefill, bottomInset, header }: Props) {
  const messages = useApp((s) => s.coach);
  const session = useApp((s) => todaySession(s.sessions));
  const { addCoachMessage, clearCoach } = useApp.getState();
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const sentPrefill = useRef(false);

  const send = async (content: string) => {
    const msg = content.trim();
    if (!msg || thinking) return;
    setText('');
    addCoachMessage({ role: 'user', content: msg });
    setThinking(true);
    try {
      const reply = await askCoach(useApp.getState().coach, session);
      addCoachMessage({ role: 'assistant', content: reply });
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => {
    if (prefill && !sentPrefill.current) {
      sentPrefill.current = true;
      send(prefill);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length, thinking]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {header}
      <ScrollView ref={scroll} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <Bubble role="assistant" content="Hey, I’m your FlowState Coach. Tell me what feels heavy today — your body, energy, soreness, or motivation?" />
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {thinking && (
          <View style={styles.row}>
            <Avatar />
            <View style={styles.thinking}>
              <Sparkles size={14} color={colors.rose} />
              <Text variant="caption">Thinking</Text>
            </View>
          </View>
        )}
        {messages.length === 0 && !thinking && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} size="sm" onPress={() => send(s)} />
            ))}
          </View>
        )}
        {!aiConnected && (
          <Text variant="caption" align="center" style={{ marginTop: 8 }}>
            Offline coach mode · AI answers arrive when the backend is connected
          </Text>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: bottomInset }]}>
        {messages.length > 0 && (
          <Pressable onPress={() => { clearCoach(); if (backendEnabled) apiFetch('/api/sync/coach', { method: 'DELETE' }).catch(() => {}); }} style={styles.clear} accessibilityRole="button" accessibilityLabel="Clear chat" hitSlop={6}>
            <Trash2 size={16} color={colors.inkMuted} />
          </Pressable>
        )}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask about training, recovery, soreness…"
          placeholderTextColor={colors.inkMuted}
          style={styles.input}
          multiline
          maxLength={600}
          accessibilityLabel="Message"
        />
        <Pressable
          onPress={() => send(text)}
          disabled={!text.trim() || thinking}
          style={[styles.send, (!text.trim() || thinking) && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <ArrowUp size={18} color={colors.onDark} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Avatar() {
  return (
    <View style={styles.avatar}>
      <Dumbbell size={14} color={colors.onDark} />
    </View>
  );
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  if (role === 'user') {
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, styles.user]}>
          <Text style={{ color: colors.ink, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 }}>{content}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <Avatar />
      <View style={[styles.bubble, styles.assistant]}>
        <Text style={{ fontSize: 14, lineHeight: 20 }}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.gutter, paddingVertical: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.rose, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  assistant: { backgroundColor: colors.surface, borderBottomLeftRadius: 6 },
  user: { backgroundColor: '#F2A7B4', borderBottomRightRadius: 6 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: space.gutter, paddingTop: 8 },
  clear: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mauve, alignItems: 'center', justifyContent: 'center' },
});
