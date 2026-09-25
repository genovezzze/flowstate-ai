import { Text as RNText, type TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Variant =
  | 'display' // "Today"
  | 'serifTitle' // "Daily Alignment"
  | 'question' // check-in questions
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'overline'
  | 'metric'; // "Day 1", "4/7"

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
};

export function Text({ variant = 'body', color, align, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[styles[variant], color ? { color } : null, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 42, color: colors.ink },
  serifTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.ink },
  question: {
    fontFamily: fonts.heavy,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.inkSoft },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.ink },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  metric: { fontFamily: fonts.heavy, fontSize: 30, lineHeight: 34, color: colors.ink },
});
