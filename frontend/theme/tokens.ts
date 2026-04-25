export const lightColors = {
  brand: '#81c3c9',
  brandInk: '#0d2528',
  brandDeep: '#3d7e83',
  bg: '#F7F8FA',
  surface: '#ffffff',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textTertiary: '#9a9a9f',
  border: 'rgba(0, 0, 0, 0.06)',
};

export const darkColors = {
  brand: '#81c3c9',
  brandInk: '#0d2528',
  brandDeep: '#3d7e83',
  bg: '#151118',
  surface: '#1E1A24',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.5)',
  textTertiary: 'rgba(255, 255, 255, 0.32)',
  border: 'rgba(255, 255, 255, 0.07)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 26,
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  fonts: {
    serif: 'InstrumentSerif_400Regular',
    serifItalic: 'InstrumentSerif_400Regular_Italic',
    body: 'Sora_400Regular',
    bodyMedium: 'Sora_500Medium',
    bodySemibold: 'Sora_600SemiBold',
    bodyLight: 'Sora_300Light',
  },
  sizes: {
    9.5: 9.5,
    10: 10,
    10.5: 10.5,
    11: 11,
    11.5: 11.5,
    12: 12,
    12.5: 12.5,
    13: 13,
    13.5: 13.5,
    15: 15,
    17: 17,
    18: 18,
    20: 20,
    21: 21,
    22: 22,
    24: 24,
    30: 30,
  },
} as const;

// Light shadows — from card: 0 4px 20px rgba(0,0,0,0.06); FAB: 0 10px 24px rgba(129,195,201,0.55)
// modal/sheet: 0 -12px 40px rgba(0,0,0,0.12); button brand: 0 4px 14px rgba(129,195,201,0.45)
export const lightShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  button: {
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
  fab: {
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Dark shadows — card: 0 10px 40px rgba(0,0,0,0.5); FAB: 0 10px 24px rgba(0,0,0,0.5) + brand glow
export const darkShadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 8,
  },
  button: {
    shadowColor: '#81c3c9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  fab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const lightTokens = {
  colors: lightColors,
  spacing,
  radii,
  typography,
  shadows: lightShadows,
};

export const darkTokens = {
  colors: darkColors,
  spacing,
  radii,
  typography,
  shadows: darkShadows,
};

export type Tokens = typeof lightTokens;
export type ColorTokens = typeof lightColors;
export type ShadowTokens = typeof lightShadows;
