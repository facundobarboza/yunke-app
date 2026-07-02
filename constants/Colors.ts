// Paleta oficial Club Yunke — Premium Edition
// Azul: #203070 | Rojo: #E01020 | Dorado: #F5A623
// Uso: import { yunke } from '@/constants/Colors' para acceso directo
//      o useThemeColor() para colores temáticos

export const yunke = {
  // Brand primario — azul institucional
  primary: '#203070',
  primaryLight: '#2E4694',
  primaryDark: '#1A2858',

  // Brand accent — rojo pasión
  red: '#E01020',
  redLight: '#FF3B30',
  redDark: '#B01010',

  // Premium — dorado para socios, estrellas, highlights
  gold: '#F5A623',
  goldLight: '#FFD166',
  goldDark: '#D4941C',

  // Functional
  success: '#34C759',
  error: '#B40F0B',

  // Neutrals
  dark: '#121212',
  darkSoft: '#2C2C2E',
  darkCard: '#1C1C1E',

  // Surfaces
  surface: '#F5F5F8',
  surfaceDark: '#121212',
  card: '#FFFFFF',
  cardDark: '#1C1C1E',
  white: '#FFFFFF',

  // Text
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Borders & dividers
  border: '#E5E5EA',
  borderDark: '#2C2C2E',

  // Gradients (for LinearGradient usage)
  gradientHeader: ['#1A2858', '#203070'] as const,
  gradientHeaderDark: ['#0D1530', '#1A2858'] as const,
  gradientGold: ['#F5A623', '#FFD166'] as const,
} as const;

// Excluir arrays de gradiente del spread para evitar errores de tipo
const { gradientHeader, gradientHeaderDark, gradientGold, ...yunkeColors } = yunke;

const tintColorLight = yunke.primary;
const tintColorDark = '#fff';

export default {
  light: {
    ...yunkeColors,
    background: yunke.surface,
    tint: tintColorLight,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: yunke.red,
    card: yunke.card,
    border: yunke.border,
  },
  dark: {
    ...yunkeColors,
    text: '#fff',
    background: yunke.surfaceDark,
    tint: tintColorDark,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: yunke.redLight,
    card: yunke.cardDark,
    border: yunke.borderDark,
  },
};
