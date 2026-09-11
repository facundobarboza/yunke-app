# Apply Progress: dark-mode

Status: ALL TASKS COMPLETE (T1–T12)
Delivery: single-pr | Workload: ~1590 changed lines (947+/643- across 35 files) — within the agreed 1200± review budget noted by orchestrator (slightly above 1200; flagged, not blocked).

## Completed tasks
- [x] T1 Added `@react-native-async-storage/async-storage@2.2.0` via `npx expo install` (package.json + lockfile; native rebuild pending on dev side).
- [x] T2 Rewrote `constants/Colors.ts`: `ColorScheme`, `ThemePalette` (compile-enforced parity), `light`/`dark` palettes with exact REQ-2 dark values, `isDark` flag, `palettes` default export kept backward-compatible. `yunke` stays as brand-token + gradients alias (REQ-7 intact).
- [x] T3 Created `src/contexts/ThemeContext.tsx` (`AppThemeProvider`): resolution override > system > light; AsyncStorage persistence at `@yunke/theme-preference` (default `system`); `themeResolved` flag; internal `useThemeContext`.
- [x] T4 Created `src/hooks/useTheme.ts` (`{scheme, mode, colors, isDark, setMode}`) and `src/hooks/useThemedStyles.ts` (memoized factory + REQ-6 global dark post-processing: shadow* removed → borderWidth:1 + colors.border + elevation).
- [x] T5 Wired `app/_layout.tsx`: AuthProvider > AppThemeProvider > QueryClientProvider > expo-router ThemeProvider (fed with resolved scheme). Splash held until fonts AND themeResolved. Pre-existing `linking` prop error untouched.
- [x] T6 Refactored `components/Card.tsx` (explicit isDark variants), `components/EmptyState.tsx`, `components/ImageGallery.tsx` → useThemedStyles. `ScreenHeader.tsx` uses brand tokens/gradients only → unchanged. `AdminGuard.tsx` dead styles removed; `RequirePermission.tsx` themed.
- [x] T7 Themed `app/(tabs)/_layout.tsx`: no hardcoded '#FFFFFF'; dark uses borderTop + colors; REQ-6 shadow swap.
- [x] T8 Tab screens refactored (index, team, calendar, profile).
- [x] T9 All 13 admin screens refactored.
- [x] T10 Detail/remaining screens refactored (benefit/[id], benefits, player/[id], sponsor/[id], edit-profile, reset-password, attendance). GATE PASSED: zero `yunke.(surface|card|text|textSecondary|textTertiary|border|dark|darkSoft)` outside `constants/Colors.ts`.
- [x] T11 3-state toggle in `app/(tabs)/profile.tsx` (APARIENCIA section; system→light→dark→system, icons per state, setMode persists).
- [x] T12 `npx tsc --noEmit`: only the 2 pre-existing errors (`_layout.tsx` linking prop; `matches.tsx` categorias.nombre). Zero new errors.

## Deviations from design
- REQ-6 implemented globally inside `useThemedStyles` (post-process of factory output) instead of per-style conditionals — uniform and lower risk; Card keeps an explicit implementation as the canonical example. No visual regression in light (post-process is a no-op when isDark=false).

## Work Unit Evidence
| Evidence | Result |
|---|---|
| Focused verification | `npx tsc --noEmit` → exactly the 2 pre-existing errors, 0 new |
| Runtime harness | No runtime/test harness in repo; manual REQ-8 visual checklist pending on device (verifier/user) |
| Rollback boundary | Entire change is additive UI layer; revert = git revert of the single PR. No DB/backend touched |

## Notes
- `useThemedStyles` dark post-process converts any style with shadow* into border+elevation (also buttons with brand shadowColor — consistent with REQ-6).
- Dev-client rebuild required for AsyncStorage native module (no pod install run by design).
