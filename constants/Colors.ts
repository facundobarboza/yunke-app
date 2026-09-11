// Official Club Yunke palette — Premium Edition
// Blue: #203070 | Red: #E01020 | Gold: #F5A623
// Usage:
//   - Brand tokens & gradients: import { yunke } from '@/constants/Colors'
//   - Themed neutrals: useTheme() from '@/src/hooks/useTheme' (colors.*)

// ---------- Brand tokens (theme-invariant) ----------
export const yunke = {
  // Primary brand — institutional blue
  primary: '#203070',
  primaryLight: '#2E4694',
  primaryDark: '#1A2858',

  // Brand accent — passion red
  red: '#E01020',
  redLight: '#FF3B30',
  redDark: '#B01010',

  // Premium — gold for members, stars, highlights
  gold: '#F5A623',
  goldLight: '#FFD166',
  goldDark: '#D4941C',

  // Functional (light-mode variants; dark overrides live in the dark palette)
  success: '#34C759',
  error: '#B40F0B',

  // Base neutrals (identity in light theme)
  dark: '#121212',
  darkSoft: '#2C2C2E',
  darkCard: '#1C1C1E',

  // Surfaces
  surface: '#F5F5F8',
  surfaceDark: '#121212',
  card: '#FFFFFF',
  cardDark: '#1C1C1E',
  white: '#FFFFFF',

  // Text (light-mode variants)
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Borders & dividers (light-mode variants)
  border: '#E5E5EA',
  borderDark: '#2C2C2E',

  // Gradients (for LinearGradient usage) — REQ-7: immutable across themes
  gradientHeader: ['#1A2858', '#203070'] as const,
  gradientHeaderDark: ['#0D1530', '#1A2858'] as const,
  gradientRed: ['#6d0202', '#E01020'] as const,
  gradientGold: ['#D4941C', '#F5A623'] as const,
} as const;

export type ColorScheme = 'light' | 'dark';

// ---------- Themed palette ----------
export interface ThemePalette {
  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;
  red: string;
  redLight: string;
  redDark: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  // Functional
  success: string;
  error: string;
  // Neutrals
  dark: string;
  darkSoft: string;
  darkCard: string;
  white: string;
  // Surfaces
  background: string;
  surface: string;
  card: string;
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  // Borders & dividers
  border: string;
  // Navigation
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  // Scheme flag
  isDark: boolean;
}

const light: ThemePalette = {
  primary: yunke.primary,
  primaryLight: yunke.primaryLight,
  primaryDark: yunke.primaryDark,
  red: yunke.red,
  redLight: yunke.redLight,
  redDark: yunke.redDark,
  gold: yunke.gold,
  goldLight: yunke.goldLight,
  goldDark: yunke.goldDark,
  success: yunke.success,
  error: yunke.error,
  dark: yunke.dark,
  darkSoft: yunke.darkSoft,
  darkCard: yunke.darkCard,
  white: yunke.white,
  background: yunke.surface,
  surface: yunke.surface,
  card: yunke.card,
  text: yunke.text,
  textSecondary: yunke.textSecondary,
  textTertiary: yunke.textTertiary,
  border: yunke.border,
  tint: yunke.primary,
  tabIconDefault: yunke.textTertiary,
  tabIconSelected: yunke.red,
  isDark: false,
};

// REQ-2: exact dark values
const dark: ThemePalette = {
  primary: yunke.primary,
  primaryLight: '#4C6FFF',
  primaryDark: yunke.primaryDark,
  red: yunke.red,
  redLight: yunke.redLight,
  redDark: yunke.redDark,
  gold: '#FFC94D',
  goldLight: '#FFD166',
  goldDark: '#D4941C',
  success: '#30D158',
  error: '#FF453A',
  dark: yunke.dark,
  darkSoft: yunke.darkSoft,
  darkCard: yunke.darkCard,
  white: yunke.white,
  background: '#0F1A38',
  surface: '#0F1A38',
  card: '#16213D',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  textTertiary: '#6E7A9C',
  border: '#25335A',
  tint: '#FFFFFF',
  tabIconDefault: '#636366',
  tabIconSelected: yunke.redLight,
  isDark: true,
};

export const palettes: Record<ColorScheme, ThemePalette> = { light, dark };

export default palettes;
