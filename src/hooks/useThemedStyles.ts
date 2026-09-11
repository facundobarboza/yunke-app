// =============================================================================
// useThemedStyles — memoized themed StyleSheet factory
// =============================================================================
// Pass a stable module-level factory `createStyles(theme)` and receive a
// memoized StyleSheet recomputed only when the palette changes.
// =============================================================================

import { useMemo } from 'react';

import { useTheme } from './useTheme';
import type { ThemePalette } from '@/constants/Colors';

export function useThemedStyles<T>(factory: (theme: ThemePalette) => T): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => {
    const result = factory(colors);
    // REQ-6: in dark mode, shadows are replaced with border + elevation.
    if (!isDark) return result;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        ('shadowColor' in value || 'shadowOpacity' in value)
      ) {
        const style = value as Record<string, unknown>;
        const { shadowColor, shadowOffset, shadowOpacity, shadowRadius, ...rest } = style;
        out[key] = {
          ...rest,
          borderWidth: rest.borderWidth ?? 1,
          borderColor: rest.borderColor ?? colors.border,
          elevation: typeof style.elevation === 'number' ? style.elevation : 2,
        };
      } else {
        out[key] = value;
      }
    }
    return out as T;
  }, [factory, colors, isDark]);
}
