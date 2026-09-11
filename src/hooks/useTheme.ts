// =============================================================================
// useTheme — public theme hook for yunke-app
// =============================================================================
// Returns { scheme, mode, colors, isDark, setMode } from AppThemeProvider.
// =============================================================================

import { useThemeContext, type ThemeContextValue } from '@/src/contexts/ThemeContext';

export type UseThemeResult = Omit<ThemeContextValue, 'themeResolved'>;

export function useTheme(): UseThemeResult {
  const { mode, scheme, colors, isDark, setMode } = useThemeContext();
  return { scheme, mode, colors, isDark, setMode };
}
