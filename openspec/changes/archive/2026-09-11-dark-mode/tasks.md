# Tasks: Dark Mode

## Review Workload Forecast
- Estimated changed lines: ~1000–1300
- 400-line budget risk: High (against default 400) / within agreed 1200
- Chained PRs recommended: No
- Delivery strategy: single-pr
- Decision needed before apply: No

## Work Units
| Unit | Goal | PR | Test | Rollback |
|---|---|---|---|---|
| 1 | Whole change | PR 1 | `npx tsc --noEmit` + visual checklist | Revert PR |

## Phase 1: Foundation
- [x] T1 Add `@react-native-async-storage/async-storage` (package.json, lockfile, pod install). Done: dep installed, app boots.
- [x] T2 Rewrite `constants/Colors.ts`: `ThemePalette` + complete palettes + `yunke` brand alias. Done: tokens match, tsc clean.

## Phase 2: Theme Infrastructure
- [x] T3 Create `src/contexts/ThemeContext.tsx`: resolution + persistence + `themeResolved`. Deps: T1, T2.
- [x] T4 Create `src/hooks/useTheme.ts` + `src/hooks/useThemedStyles.ts`. Deps: T3.

## Phase 3: Wiring
- [x] T5 Wire `AppThemeProvider` into `app/_layout.tsx`; hold splash until `themeResolved`. Deps: T3, T4.

## Phase 4: Shared Components
- [x] T6 Refactor `Card`, `ScreenHeader`, `EmptyState`, `ImageGallery` → `useThemedStyles`. Deps: T4, T5.

## Phase 5: Tab Bar + Tab Screens
- [x] T7 Theme tab bar `app/(tabs)/_layout.tsx`. Deps: T5.
- [x] T8 Refactor tab screens. Deps: T7.

## Phase 6: Admin + Detail Screens
- [x] T9 Refactor admin screens. Deps: T4.
- [x] T10 Refactor detail + remaining screens until all 32 files migrated (grep gate: zero neutral `yunke.*` outside Colors.ts). Deps: T9.

## Phase 7: Toggle + Verification
- [x] T11 Add 3-state toggle in profile. Deps: T3, T10.
- [x] T12 Verification: `npx tsc --noEmit` + REQ-8 visual checklist. Deps: all.

> Note (not a task): jest testing infra is a future-candidate change.