// Paleta oficial Club Yunke
// Azul: #203070 | Rojo: #b40f0b
// Uso: import { yunke } from '@/constants/Colors' para acceso directo
//      o useThemeColor() para colores temáticos

export const yunke = {
  // Brand primario — azul institucional
  primary: '#203070',
  primaryLight: '#2E4694',
  primaryDark: '#1A2858',

  // Brand accent — rojo pasión
  red: '#e01020',
  redLight: '#D41612',
  redDark: '#b01010',

  // Premium — dorado para socios, estrellas, highlights
  gold: '#F5A623',
  goldLight: '#FFD166',

  // Functional
  success: '#34C759',
  error: '#b40f0b',

  // Neutrals
  dark: '#121212',
  darkSoft: '#2C2C2E',

  // Surfaces
  surface: '#F5F5F8',
  card: '#FFFFFF',
  white: '#FFFFFF',

  // Text
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Borders & dividers
  border: '#E5E5EA',
} as const;

const tintColorLight = yunke.primary;
const tintColorDark = '#fff';

export default {
  light: {
    // Spread primero, overrides después para evitar duplicados
    ...yunke,
    background: yunke.surface,
    tint: tintColorLight,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: yunke.red,
  },
  dark: {
    ...yunke,
    text: '#fff',
    background: yunke.dark,
    tint: tintColorDark,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: '#fff',
  },
};
