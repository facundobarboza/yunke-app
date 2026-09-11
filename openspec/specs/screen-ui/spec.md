# Capability: Screen UI

## MODIFIED Requirements

### REQ-3: All screens and components consume useTheme()
All screens and shared components SHALL read theme colors via `useTheme().colors` (or `useThemedStyles`). No file outside `constants/Colors.ts` MAY reference neutral palette tokens (`surface, card, text, textSecondary, textTertiary, border, dark, darkSoft`) directly; brand tokens (`primary`, `red`, `white`) MAY stay direct.

#### Scenarios
- Grep gate: zero stray neutral token usage outside `constants/Colors.ts`.
- Live re-render across the tree when the theme is toggled.

### REQ-4: Theme toggle in profile (3-state)
`app/(tabs)/profile.tsx` SHALL expose a 3-state selector cycling system → light → dark → system, with icons and label, calling `setMode` and persisting the choice.

### REQ-5: Themed tab bar
`app/(tabs)/_layout.tsx` SHALL derive background, tint, and `borderTopColor` from `useTheme()`; no hardcoded color literals.

### REQ-6: Elevation adapts per theme
Themed components SHALL apply `shadow*` styles only in light mode; in dark mode they SHALL use `borderWidth: 1` with `colors.border` and raised elevation (driven by `isDark`).

### REQ-8: Verification
`npx tsc --noEmit` SHALL pass. A manual visual checklist SHALL cover light and dark across all tabs, admin, detail screens, the toggle, and persistence across restarts.
