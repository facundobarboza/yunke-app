# Shared Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 3 shared UI components (ScreenHeader, Card, EmptyState) and refactor existing screens to use them, eliminating duplicated code and ensuring visual consistency.

**Architecture:** Extract repeated patterns from 8+ screens into reusable components in `components/`. Each component wraps the existing styling logic with consistent props. Screens import and use the shared component instead of defining their own header/card/empty state inline.

**Tech Stack:** React Native, Expo, TypeScript, LinearGradient, Ionicons, Montserrat fonts

## Global Constraints

- Use `yunke` palette from `constants/Colors.ts` — never hardcode hex values
- Use Montserrat font families: `Montserrat_400Regular`, `Montserrat_500Medium`, `Montserrat_600SemiBold`, `Montserrat_700Bold`, `Montserrat_900Black`
- Never use `fontWeight` — always use `fontFamily` for Montserrat
- Use `useSafeAreaInsets()` for all safe area calculations
- Preserve existing visual appearance — no design changes, only consolidation

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `components/ScreenHeader.tsx` | Create | Gradient header with back button, title, subtitle |
| `components/Card.tsx` | Create | Consistent card with shadow variants |
| `components/EmptyState.tsx` | Create | Empty state with icon, title, description |
| `app/(tabs)/team.tsx` | Modify | Replace inline header + empty state |
| `app/(tabs)/calendar.tsx` | Modify | Replace inline header + card + empty state |
| `app/admin/players.tsx` | Modify | Replace inline header + card + empty state |
| `app/admin/sponsors.tsx` | Modify | Replace inline header + card + empty state |
| `app/admin/matches.tsx` | Modify | Replace inline header |
| `app/admin/benefits.tsx` | Modify | Replace inline header |
| `app/benefits.tsx` | Modify | Replace inline header + card + empty state |
| `app/edit-profile.tsx` | Modify | Replace inline header |

---

### Task 1: Create ScreenHeader component

**Covers:** Header unification across 8 screens

**Files:**
- Create: `components/ScreenHeader.tsx`
- Test: Manual visual verification

**Interfaces:**
- Consumes: `yunke` colors/gradients from `constants/Colors.ts`, `useSafeAreaInsets`, `LinearGradient`, `Ionicons`
- Produces: `<ScreenHeader>` component exported from `components/ScreenHeader.tsx`

- [ ] **Step 1: Create ScreenHeader component**

```tsx
// components/ScreenHeader.tsx
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  gradient?: readonly [string, string];
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  gradient = yunke.gradientHeader,
  showBack = false,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + 20 }]}
    >
      {showBack && (
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={yunke.white} />
          <Text style={styles.backText}>Volver</Text>
        </Pressable>
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: yunke.white,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Montserrat_900Black',
    color: yunke.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  rightAction: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to ScreenHeader

- [ ] **Step 3: Commit**

```bash
git add components/ScreenHeader.tsx
git commit -m "feat: add ScreenHeader shared component"
```

---

### Task 2: Create Card component

**Covers:** Card unification across multiple screens

**Files:**
- Create: `components/Card.tsx`
- Test: Manual visual verification

**Interfaces:**
- Consumes: `yunke` colors from `constants/Colors.ts`
- Produces: `<Card>` component exported from `components/Card.tsx`

- [ ] **Step 1: Create Card component**

```tsx
// components/Card.tsx
import { yunke } from '@/constants/Colors';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'flat';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.base, variants[variant], style]}>
      {children}
    </View>
  );
}

const variants = StyleSheet.create({
  default: {
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: yunke.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  flat: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});

const styles = StyleSheet.create({
  base: {
    backgroundColor: yunke.card,
    borderRadius: 16,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to Card

- [ ] **Step 3: Commit**

```bash
git add components/Card.tsx
git commit -m "feat: add Card shared component"
```

---

### Task 3: Create EmptyState component

**Covers:** Empty state unification across 5+ screens

**Files:**
- Create: `components/EmptyState.tsx`
- Test: Manual visual verification

**Interfaces:**
- Consumes: `yunke` colors from `constants/Colors.ts`, `Ionicons`
- Produces: `<EmptyState>` component exported from `components/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState component**

```tsx
// components/EmptyState.tsx
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'folder-open-outline', title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={yunke.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: yunke.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: yunke.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: yunke.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to EmptyState

- [ ] **Step 3: Commit**

```bash
git add components/EmptyState.tsx
git commit -m "feat: add EmptyState shared component"
```

---

### Task 4: Refactor Team screen

**Covers:** Replace inline header and empty state in team.tsx

**Files:**
- Modify: `app/(tabs)/team.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `EmptyState` from Task 1, 3

- [ ] **Step 1: Replace header in team.tsx**

Replace the `LinearGradient` header block (lines 121-130) with:
```tsx
<ScreenHeader
  title="Plantel"
  subtitle="Conocé a nuestros jugadores"
/>
```

Remove `header`, `screenTitle`, `headerSubtitle` from StyleSheet.

- [ ] **Step 2: Replace empty state in team.tsx**

Replace `ListEmptyComponent` text (line 169) with:
```tsx
ListEmptyComponent={
  !loading ? (
    <EmptyState title="No hay jugadores en esta categoría" />
  ) : null
}
```

Remove `emptyText` from StyleSheet.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/team.tsx
git commit -m "refactor: use ScreenHeader and EmptyState in team screen"
```

---

### Task 5: Refactor Calendar screen

**Covers:** Replace inline header, card styling, and empty state in calendar.tsx

**Files:**
- Modify: `app/(tabs)/calendar.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `Card`, `EmptyState` from Task 1, 2, 3

- [ ] **Step 1: Replace header in calendar.tsx**

Replace the `LinearGradient` header block (lines 186-194) with:
```tsx
<ScreenHeader
  title="Calendario"
  subtitle="Próximos partidos y resultados"
/>
```

Remove `header`, `screenTitle`, `headerSubtitle` from StyleSheet.

- [ ] **Step 2: Replace card in calendar.tsx**

Wrap each match card with `<Card>`:
```tsx
<Card style={styles.card}>
  {/* card content */}
</Card>
```

Update `card` style in StyleSheet to remove `backgroundColor` and `shadowColor/shadowOffset/shadowOpacity/shadowRadius/elevation` (Card handles these).

- [ ] **Step 3: Replace empty state in calendar.tsx**

Replace `ListEmptyComponent` text (line 232-234) with:
```tsx
ListEmptyComponent={
  <EmptyState
    title={filtro === 'proximos' ? 'No hay partidos programados' : 'No hay resultados'}
  />
}
```

Remove `emptyText` from StyleSheet.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/calendar.tsx
git commit -m "refactor: use ScreenHeader, Card, EmptyState in calendar screen"
```

---

### Task 6: Refactor Admin Players screen

**Covers:** Replace inline header, card, and empty state in players.tsx

**Files:**
- Modify: `app/admin/players.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `Card`, `EmptyState` from Task 1, 2, 3

- [ ] **Step 1: Replace header in players.tsx**

Replace the `LinearGradient` header block (lines 105-112) with:
```tsx
<ScreenHeader
  title="Gestionar Plantilla"
  subtitle={`${jugadoresFiltrados.length} jugadores`}
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `headerTitle`, `headerSubtitle`, `backButton`, `backText` from StyleSheet.

- [ ] **Step 2: Replace card in players.tsx**

Replace the card `View` (line 76) with `<Card>`:
```tsx
<Card style={styles.card}>
  {/* card content */}
</Card>
```

Update `card` style to remove `backgroundColor` and shadow properties.

- [ ] **Step 3: Replace empty state in players.tsx**

Replace `ListEmptyComponent` text (line 141) with:
```tsx
ListEmptyComponent={<EmptyState title="No hay jugadores registrados" />}
```

Remove `emptyText` from StyleSheet.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/admin/players.tsx
git commit -m "refactor: use ScreenHeader, Card, EmptyState in admin players"
```

---

### Task 7: Refactor Admin Sponsors screen

**Covers:** Replace inline header, card, and empty state in sponsors.tsx

**Files:**
- Modify: `app/admin/sponsors.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `Card`, `EmptyState` from Task 1, 2, 3

- [ ] **Step 1: Replace header in sponsors.tsx**

Replace the `LinearGradient` header block (lines 64-71) with:
```tsx
<ScreenHeader
  title="Gestionar Sponsors"
  subtitle={`${sponsors.length} sponsors`}
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `headerTitle`, `headerSubtitle`, `backButton`, `backText` from StyleSheet.

- [ ] **Step 2: Replace card in sponsors.tsx**

Replace the card `View` (line 40) with `<Card>`:
```tsx
<Card style={styles.card}>
  {/* card content */}
</Card>
```

Update `card` style to remove `backgroundColor` and shadow properties.

- [ ] **Step 3: Replace empty state in sponsors.tsx**

Replace `ListEmptyComponent` text (line 75) with:
```tsx
ListEmptyComponent={<EmptyState title="No hay sponsors registrados" />}
```

Remove `emptyText` from StyleSheet.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/admin/sponsors.tsx
git commit -m "refactor: use ScreenHeader, Card, EmptyState in admin sponsors"
```

---

### Task 8: Refactor Admin Matches, Benefits, and Edit Profile screens

**Covers:** Replace inline headers in remaining admin screens

**Files:**
- Modify: `app/admin/matches.tsx`
- Modify: `app/admin/benefits.tsx`
- Modify: `app/edit-profile.tsx`

**Interfaces:**
- Consumes: `ScreenHeader` from Task 1

- [ ] **Step 1: Refactor admin/matches.tsx**

Replace the `LinearGradient` header with:
```tsx
<ScreenHeader
  title="Gestionar Partidos"
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `headerTitle`, `backButton`, `backText` from StyleSheet.

- [ ] **Step 2: Refactor admin/benefits.tsx**

Replace the `LinearGradient` header with:
```tsx
<ScreenHeader
  title="Gestionar Beneficios"
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `headerTitle`, `backButton`, `backText` from StyleSheet.

- [ ] **Step 3: Refactor edit-profile.tsx**

Replace the `LinearGradient` header (lines 67-78) with:
```tsx
<ScreenHeader
  title="Datos Personales"
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `headerTitle`, `backButton`, `backText` from StyleSheet.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/admin/matches.tsx app/admin/benefits.tsx app/edit-profile.tsx
git commit -m "refactor: use ScreenHeader in admin matches, benefits, and edit profile"
```

---

### Task 9: Refactor Benefits screen

**Covers:** Replace inline header, card, and empty state in benefits.tsx

**Files:**
- Modify: `app/benefits.tsx`

**Interfaces:**
- Consumes: `ScreenHeader`, `Card`, `EmptyState` from Task 1, 2, 3

- [ ] **Step 1: Replace header in benefits.tsx**

Replace the `LinearGradient` header (lines 47-65) with:
```tsx
<ScreenHeader
  title="Beneficios del Socio"
  subtitle="Descuentos exclusivos en comercios adheridos para los socios del club."
  gradient={yunke.gradientRed}
  showBack
  onBack={() => router.back()}
/>
```

Remove `header`, `title`, `subtitle`, `backButton`, `backText`, `headerContent`, `headerIconContainer` from StyleSheet.

- [ ] **Step 2: Replace card in benefits.tsx**

Replace the `benefitCard` View (line 75) with:
```tsx
<Card style={styles.benefitCard}>
  {/* card content */}
</Card>
```

Update `benefitCard` style to remove `backgroundColor` and shadow properties.

- [ ] **Step 3: Replace empty state in benefits.tsx**

Replace the loading/empty check (lines 70-72) with:
```tsx
loading ? (
  <ActivityIndicator size="large" color={yunke.primary} style={{ marginTop: 40 }} />
) : beneficios.length === 0 ? (
  <EmptyState title="No hay beneficios disponibles" />
) : (
```

Remove `emptyText` from StyleSheet.

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/benefits.tsx
git commit -m "refactor: use ScreenHeader, Card, EmptyState in benefits screen"
```

---

### Task 10: Final verification

**Covers:** Verify all changes compile and no regressions

**Files:**
- All modified files

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors

- [ ] **Step 2: Verify all imports resolve**

Run: `npx tsc --noEmit 2>&1 | grep -i "cannot find"`
Expected: No output

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "chore: final verification of shared components refactor"
```
