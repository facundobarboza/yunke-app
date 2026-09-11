# Proposal: Dark Mode — True Themed Palettes Across All Screens

## Intent
Today `app.json` declares `userInterfaceStyle: "automatic"` and `_layout.tsx` mounts `ThemeProvider`, but every screen hardcodes `yunke.*` light neutrals. Result: iOS/Android chrome flips dark while app content stays light — visually broken and inconsistent. This change makes dark mode real: every screen and shared component renders from the active color scheme, using the existing `light`/`dark` export in `constants/Colors.ts`, plus a manual theme toggle with persistence.

## Scope

### In Scope
- A single theme access point: `useTheme()` hook returning the active palette.
- Refactor all files that hardcode `yunke.*` neutrals (all screens + 4 shared components).
- Manual theme selector (system/light/dark) in profile, persisted.
- Fix hardcoded `'#FFFFFF'` tab bar.
- Complete the `dark` palette (missing neutrals/semantics with adequate contrast).
- Consistent shadow handling in dark mode (border + elevation).
- Typed `ThemePalette` (TS strict).

### Out of Scope (Deferred)
- `components/Themed.tsx` dead-code cleanup (noted, not part of this change).
- Full accessibility/contrast audit.
- Testing framework (jest) — verification is `tsc --noEmit` + manual visual checklist.

## Approach
1. Extend `constants/Colors.ts`: complete palettes, export `ThemePalette` type.
2. Add `src/contexts/ThemeContext.tsx` (AppThemeProvider) + `src/hooks/useTheme.ts` + `src/hooks/useThemedStyles.ts`.
3. Refactor pattern: `createStyles(theme)` factory + `useThemedStyles` (memoized). Brand gradients stay direct.
4. Fix tab bar.
5. Add toggle in profile.
6. Verify: `npx tsc --noEmit` + visual checklist.

## Pending Design Decisions (resolved)
1. **Semantic colors in dark**: lighten for contrast — APPROVED.
2. **Shadows in dark**: border + elevation — APPROVED.
3. **Manual toggle**: include now (3-state, persisted) — APPROVED.
4. **Persistence**: AsyncStorage (`@yunke/theme-preference`).

## Risks
- Large mechanical diff (~32 files) can mask visual regressions — typed palette + grep gate.
- Contrast regressions in dark — palette completion step.
- AsyncStorage dep → dev client rebuild.

## Estimation
~32 files touched, 3 new files. Est. 1000–1300 lines. Single PR.

## Success Criteria
- Every screen renders correct neutrals in both schemes.
- Tab bar matches scheme.
- `npx tsc --noEmit` passes.
- Toggle persists across restart.
- Brand gradients unchanged.