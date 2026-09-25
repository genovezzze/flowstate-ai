// Design tokens. Approximated from the demo screenshots (docs/design) —
// replace with exact values once we get the source design file.

export const colors = {
  bg: '#F4EFE8', // Today background (warm cream)
  bgCheckin: '#FCEFF0', // check-in / plan background (blush)
  bgCheckinTop: '#FFF7F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F3E6E8',
  border: '#EADCDD',

  sage: '#A8BBA6',
  sageDeep: '#8FA58D',
  forest: '#4E6B57',
  forestDeep: '#3F5A48',
  rose: '#C9737F',
  roseSoft: '#E7B7BE',
  blush: '#F6DADF',
  mauve: '#9B5567',
  night: '#2A2A2C',
  danger: '#B84A4A',
  amber: '#E3A857',
  ok: '#5F8F6B',

  ink: '#1E1B1C',
  inkSoft: '#4A4446',
  inkMuted: '#8A8285',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.72)',

  progressStart: '#F6D8A8',
  progressEnd: '#E8899A',
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 20,
} as const;

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  heavy: 'Inter_800ExtraBold',
} as const;

export const shadow = {
  card: {
    shadowColor: '#6B4A50',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  float: {
    shadowColor: '#3A2A2E',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
