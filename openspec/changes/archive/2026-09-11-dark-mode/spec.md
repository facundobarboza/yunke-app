# Delta Spec: dark-mode

## ADDED Requirements

### REQ-1: Theme scheme resolution (system + persisted override)
Resolution priority: manual override (`light`|`dark`) > OS system scheme > fallback `light`. Override persisted via `@react-native-async-storage/async-storage` under `@yunke/theme-preference`, default `system`.

Acceptance: `useTheme()` returns `{ scheme, mode, colors, isDark, setMode }`.

Scenarios: first-launch defaults to system; override beats system; persistence across restarts.

### REQ-2: Complete themed palette tokens
`constants/Colors.ts` exposes complete `light` and `dark`. Dark values:
- `text: '#FFFFFF'`, `textSecondary: '#AEAEB2'`, `textTertiary: '#636366'`
- `background/surface: '#121212'`, `card: '#1C1C1E'`, `border: '#2C2C2E'`
- `success: '#30D158'`, `error: '#FF453A'`
- `gold: '#FFC94D'`, `goldLight: '#FFD166'`, `goldDark: '#D4941C'`
- `primaryLight: '#4C6FFF'`
- `isDark: boolean`

Light keeps current values; token parity compile-enforced via shared type.

### REQ-3: All screens/components consume useTheme()
The 32 listed files stop referencing `yunke.*` neutral tokens (`surface, card, text, textSecondary, textTertiary, border, dark, darkSoft`) and read via `useTheme().colors`. Brand tokens (`primary`, `red`, `white`) may stay direct.

Scenarios: zero stray neutral usage (grep gate); live re-render on toggle.

### REQ-4: Theme toggle in profile (3-state)
`app/(tabs)/profile.tsx` selector cycling system → light → dark → system, with icons and label, calling `setMode` and persisting.

### REQ-5: Themed tab bar
`app/(tabs)/_layout.tsx` no hardcoded `'#FFFFFF'`. Background/tints from `useTheme()` + `borderTopColor`.

### REQ-6: Shadows in light, border + elevation in dark
Themed components apply `shadow*` only in light; `borderWidth:1` + `colors.border` + elevation in dark (via `isDark`).

### REQ-7: Brand gradients immutable
`yunke.gradientHeader/gradientRed/gradientGold` unchanged per theme.

### REQ-8: Verification
`npx tsc --noEmit` passes. Manual visual checklist covers light+dark across all tabs, admin, detail, toggle, persistence.