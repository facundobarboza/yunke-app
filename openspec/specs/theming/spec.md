# Capability: Theming

## ADDED Requirements

### REQ-1: Theme scheme resolution (system + persisted override)
The app SHALL resolve the active color scheme with priority: manual override (`light` | `dark`) > OS system scheme > fallback `light`. The manual override SHALL be persisted via `@react-native-async-storage/async-storage` under the key `@yunke/theme-preference`, with default `system`.

Acceptance: `useTheme()` returns `{ scheme, mode, colors, isDark, setMode }`.

#### Scenarios
- First launch defaults to `system` and follows the OS scheme.
- An explicit override beats the OS scheme.
- The override survives app restarts.

### REQ-2: Complete themed palette tokens
`constants/Colors.ts` SHALL expose complete `light` and `dark` palettes with token parity (compile-enforced via a shared type) and an `isDark: boolean` flag.

Dark palette values:
- `text: '#FFFFFF'`, `textSecondary: '#AEAEB2'`, `textTertiary: '#636366'`
- `background/surface: '#121212'`, `card: '#1C1C1E'`, `border: '#2C2C2E'`
- `success: '#30D158'`, `error: '#FF453A'`
- `gold: '#FFC94D'`, `goldLight: '#FFD166'`, `goldDark: '#D4941C'`
- `primaryLight: '#4C6FFF'`

Light palette keeps the existing values.

### REQ-7: Brand gradients immutable
Brand gradient tokens (`yunke.gradientHeader`, `yunke.gradientRed`, `yunke.gradientGold`) SHALL remain identical across themes.
