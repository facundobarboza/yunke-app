// =============================================================================
// AppThemeProvider — Theme context for yunke-app
// =============================================================================
// Resolves the active color scheme with priority:
//   manual override ('light' | 'dark') > OS system scheme > 'light' fallback
// The override is persisted in AsyncStorage under '@yunke/theme-preference'
// (default 'system'). Exposes `themeResolved` so the root layout can hold the
// splash screen until the persisted preference has been read.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { palettes, type ColorScheme, type ThemePalette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  /** User-selected preference: system | light | dark */
  mode: ThemeMode;
  /** Resolved scheme actually applied */
  scheme: ColorScheme;
  /** Themed palette for the resolved scheme */
  colors: ThemePalette;
  /** True when scheme === 'dark' */
  isDark: boolean;
  /** True once the persisted preference has been loaded from storage */
  themeResolved: boolean;
  /** Persist and apply a new preference */
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = '@yunke/theme-preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [themeResolved, setThemeResolved] = useState(false);

  // Load persisted preference once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setModeState(stored);
        }
      } catch (err) {
        console.error('AppThemeProvider: failed to read theme preference', err);
      } finally {
        if (!cancelled) {
          setThemeResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch((err) =>
      console.error('AppThemeProvider: failed to persist theme preference', err),
    );
  }, []);

  const scheme: ColorScheme = mode === 'system' ? systemScheme : mode;
  const colors = palettes[scheme];

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors,
      isDark: scheme === 'dark',
      themeResolved,
      setMode,
    }),
    [mode, scheme, colors, themeResolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal consumer hook (public API: useTheme from src/hooks/useTheme)
// ---------------------------------------------------------------------------
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
}
