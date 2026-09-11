# Design: Dark Mode

## Architecture Decisions
- **Provider**: own `AppThemeProvider` (Context) nested inside `AuthProvider`, outside `QueryClientProvider` and expo-router `ThemeProvider` (feeds it, doesn't replace it).
- **Flash**: hold splash (`SplashScreen.preventAutoHideAsync`) until `themeResolved`.
- **Palette**: `yunke` stays as brand-token alias; `light`/`dark` are complete `ThemePalette`; `isDark` in context.

## Data Flow
```
AsyncStorage('@yunke/theme-preference')
  → AppThemeProvider (mode: system|light|dark) + useColorScheme()
  → scheme: light|dark → ThemePalette (Colors[scheme])
  → useTheme() {scheme, mode, colors, isDark, setMode}
  → useThemedStyles(factory) memoized
  → expo-router ThemeProvider value
```

## File Changes
| File | Action |
|---|---|
| `constants/Colors.ts` | Modify — ThemePalette + light/dark |
| `src/contexts/ThemeContext.tsx` | Create |
| `src/hooks/useTheme.ts` | Create |
| `src/hooks/useThemedStyles.ts` | Create |
| `app/_layout.tsx` | Modify — wrap provider, gate splash |
| `app/(tabs)/_layout.tsx` | Modify — themed tab bar |
| `app/(tabs)/profile.tsx` | Modify — toggle + migrate styles |
| `components/{Card,ScreenHeader,EmptyState,ImageGallery}.tsx` | Modify |
| ~28 screens | Modify — mechanical refactor |
| `package.json` | Modify — add async-storage |
| `app.json` | Modify — userInterfaceStyle automatic |

## Interfaces
```ts
type ColorScheme = 'light' | 'dark';
interface ThemePalette { /* text, textSecondary, textTertiary, background, surface, card, border, tint, tabIconDefault, tabIconSelected, primary, primaryLight, primaryDark, red, error, success, gold, goldLight, goldDark */ }
interface ThemeContextValue { mode, scheme, colors, isDark, setMode }
function useThemedStyles<T>(factory: (theme) => T): T
```

## Refactor Pattern
Module-level `StyleSheet.create` → `createStyles(theme)` factory + `useThemedStyles`. Brand tokens direct; neutrals via `colors.*`; gradients intact. Shadows: light=shadow, dark=border+elevation (REQ-6).

## Testing
`npx tsc --noEmit` + REQ-8 visual checklist. (No jest — out of scope.)

## Migration
No data migration. Dev client rebuild required (AsyncStorage native).