# Home Screen Premium Redesign Implementation Plan

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/home-redesign.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Home screen into a premium football club app with hybrid dark hero + light content design, supporting both light and dark modes.

**Architecture:** Update Colors.ts first (foundation), then redesign each component section in the Home screen, and finally update the Tab Bar. All changes are in existing files — no new files needed.

**Tech Stack:** React Native, Expo Linear Gradient, Montserrat fonts, React Native Reanimated

## Global Constraints

- Use existing dependencies only (no new npm packages)
- Maintain Montserrat font family
- Support both light and dark modes via `useColorScheme`
- Keep all existing data fetching logic (Supabase) unchanged
- Colors: Primary `#203070`, Red `#E01020`, Gold `#F5A623`
- Border radius: Cards 16px, Sponsors 20px
- Font sizes: Titles 22-34px, Body 14-16px, Labels 11-12px

---

### Task 1: Update Color System for Light/Dark Mode

**Covers:** [S9]

**Files:**
- Modify: `constants/Colors.ts`

**Interfaces:**
- Consumes: Nothing (foundation task)
- Produces: Updated `yunke` and `default` exports with premium color values

- [ ] **Step 1: Update Colors.ts with premium palette**

```typescript
// constants/Colors.ts
// Paleta oficial Club Yunke — Premium Edition
// Azul: #203070 | Rojo: #E01020 | Dorado: #F5A623
// Uso: import { yunke } from '@/constants/Colors' para acceso directo
//      o useThemeColor() para colores temáticos

export const yunke = {
  // Brand primario — azul institucional
  primary: '#203070',
  primaryLight: '#2E4694',
  primaryDark: '#1A2858',

  // Brand accent — rojo pasión
  red: '#E01020',
  redLight: '#FF3B30',
  redDark: '#B01010',

  // Premium — dorado para socios, estrellas, highlights
  gold: '#F5A623',
  goldLight: '#FFD166',
  goldDark: '#D4941C',

  // Functional
  success: '#34C759',
  error: '#B40F0B',

  // Neutrals
  dark: '#121212',
  darkSoft: '#2C2C2E',
  darkCard: '#1C1C1E',

  // Surfaces
  surface: '#F5F5F8',
  surfaceDark: '#121212',
  card: '#FFFFFF',
  cardDark: '#1C1C1E',
  white: '#FFFFFF',

  // Text
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // Borders & dividers
  border: '#E5E5EA',
  borderDark: '#2C2C2E',

  // Gradients (for LinearGradient usage)
  gradientHeader: ['#1A2858', '#203070'] as const,
  gradientHeaderDark: ['#0D1530', '#1A2858'] as const,
  gradientGold: ['#F5A623', '#FFD166'] as const,
} as const;

const tintColorLight = yunke.primary;
const tintColorDark = '#fff';

export default {
  light: {
    ...yunke,
    background: yunke.surface,
    tint: tintColorLight,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: yunke.red,
    card: yunke.card,
    border: yunke.border,
  },
  dark: {
    ...yunke,
    text: '#fff',
    background: yunke.surfaceDark,
    tint: tintColorDark,
    tabIconDefault: yunke.textTertiary,
    tabIconSelected: yunke.redLight,
    card: yunke.cardDark,
    border: yunke.borderDark,
  },
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add constants/Colors.ts
git commit -m "feat(colors): update palette with premium light/dark mode support"
```

---

### Task 2: Redesign Header Hero

**Covers:** [S3]

**Files:**
- Modify: `app/(tabs)/index.tsx` (styles and JSX)

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts
- Produces: Updated header section with gradient, logo, and premium typography

- [ ] **Step 1: Update header JSX in index.tsx**

Replace the header section (lines 176-184) with:

```tsx
{/* HEADER CON GRADIENTE AZUL PREMIUM */}
<LinearGradient
  colors={yunke.gradientHeader}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.header}
>
  <Image 
    source={require('../../assets/images/yunke-logo.png')} 
    style={styles.headerLogo} 
    resizeMode="contain" 
  />
  <Text style={styles.clubTitle}>YUNKE FC</Text>
  <Text style={styles.clubSubtitle}>FÚTBOL CLUB</Text>
</LinearGradient>
```

- [ ] **Step 2: Update header styles**

Replace the header styles with:

```typescript
// Header con gradiente premium
header: {
  paddingHorizontal: 24,
  paddingTop: 60,
  paddingBottom: 40,
  alignItems: 'center',
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
  shadowColor: yunke.dark,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 15,
},
headerLogo: {
  width: 80,
  height: 80,
  marginBottom: 16,
},
clubTitle: {
  fontSize: 36,
  fontFamily: 'Montserrat_900Black',
  color: yunke.white,
  letterSpacing: -1,
  textAlign: 'center',
},
clubSubtitle: {
  fontSize: 14,
  fontFamily: 'Montserrat_600SemiBold',
  color: 'rgba(255,255,255,0.7)',
  marginTop: 4,
  letterSpacing: 4,
  textTransform: 'uppercase',
},
```

- [ ] **Step 3: Verify visual rendering**

Run: `npx expo start` and check the Home screen header
Expected: Dark gradient with centered logo, "YUNKE FC" text, and "FÚTBOL CLUB" subtitle

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): redesign header hero with centered logo and premium typography"
```

---

### Task 3: Redesign Sponsors Carousel

**Covers:** [S4]

**Files:**
- Modify: `app/(tabs)/index.tsx` (styles and renderSponsor function)

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts
- Produces: Updated sponsor cards with premium styling and dot indicators

- [ ] **Step 1: Update renderSponsor function**

```tsx
const renderSponsor = ({ item }: { item: Sponsor }) => (
  <Pressable 
    style={styles.sponsorCard} 
    onPress={() => router.push(`/sponsor/${item.id}`)}
  >
    {item.portada_url ? (
      <>
        <Image source={{ uri: item.portada_url }} style={styles.sponsorCover} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.sponsorOverlay}
        />
        <Text style={styles.sponsorOverlayText}>{item.nombre}</Text>
      </>
    ) : item.logo_url ? (
      <Image source={{ uri: item.logo_url }} style={styles.sponsorLogo} resizeMode="contain" />
    ) : (
      <Text style={styles.sponsorNameText}>{item.nombre}</Text>
    )}
  </Pressable>
);
```

- [ ] **Step 2: Update sponsor styles**

```typescript
// Sponsors
sponsorsSection: { marginTop: 24, marginBottom: 10 },
sectionTitle: {
  fontSize: 22,
  fontFamily: 'Montserrat_700Bold',
  color: yunke.text,
  marginBottom: 15,
  paddingHorizontal: 24,
},
sponsorCard: {
  width: width - 48,
  height: 180,
  backgroundColor: yunke.card,
  borderRadius: 20,
  marginHorizontal: 24,
  marginBottom: 3,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: yunke.dark,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
  overflow: 'hidden',
},
sponsorLogo: { width: '70%', height: '70%' },
sponsorCover: { 
  width: '100%', 
  height: '100%', 
  borderRadius: 20 
},
sponsorOverlay: {
  ...StyleSheet.absoluteFillObject,
  borderRadius: 20,
},
sponsorOverlayText: {
  position: 'absolute',
  bottom: 16,
  left: 16,
  color: yunke.white,
  fontSize: 18,
  fontFamily: 'Montserrat_700Bold',
  textShadowColor: 'rgba(0,0,0,0.5)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
},
sponsorNameText: { 
  fontSize: 20, 
  fontFamily: 'Montserrat_700Bold', 
  color: yunke.text 
},

// Dots del carrusel premium
dotsContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
},
dot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: yunke.border,
},
dotActive: {
  width: 24,
  backgroundColor: yunke.primary,
  borderRadius: 4,
},
```

- [ ] **Step 3: Verify visual rendering**

Run: `npx expo start` and check the sponsors carousel
Expected: Cards with larger radius, gradient overlay on cover images, premium dots

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): redesign sponsors carousel with premium cards and dots"
```

---

### Task 4: Redesign Match Cards

**Covers:** [S5]

**Files:**
- Modify: `app/(tabs)/index.tsx` (renderPartido function and styles)

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts, Partido type
- Produces: Updated match cards with vertical layout, accent bars, bigger crests

- [ ] **Step 1: Update renderPartido function**

```tsx
const renderPartido = ({ item, index }: { item: Partido; index: number }) => (
  <FadeInUp delay={index * 100}>
    <View style={styles.matchCard}>
      {/* Barra de acento según localía */}
      <View style={[styles.matchAccent, { backgroundColor: item.es_local ? yunke.red : yunke.primary }]} />
      
      <View style={styles.matchTop}>
        <Text style={styles.matchCategory}>
          {item.categorias?.[0]?.nombre || 'General'} {item.competicion ? ` - ${item.competicion}` : ''}
        </Text>
      </View>
      
      <View style={styles.matchTeamsContainer}>
        <View style={styles.teamColumn}>
          <Image 
            source={require('../../assets/images/yunke-logo.png')} 
            style={styles.teamEscudo} 
            resizeMode="contain" 
          />
          <Text style={styles.teamNameShort} numberOfLines={1}>YUNKE</Text>
        </View>
        
        <View style={styles.vsContainer}>
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
        </View>
        
        <View style={styles.teamColumn}>
          {item.escudo_url ? (
            <Image source={{ uri: item.escudo_url }} style={styles.teamEscudo} resizeMode="contain" />
          ) : (
            <View style={[styles.teamEscudo, styles.placeholderEscudo]}>
              <Ionicons name="shield-outline" size={24} color={yunke.textTertiary} />
            </View>
          )}
          <Text style={styles.teamNameShort} numberOfLines={1}>{item.rival.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.matchFooter}>
        <View style={styles.matchDateContainer}>
          <Ionicons name="calendar-outline" size={16} color={yunke.textSecondary} />
          <Text style={styles.matchDateText}>{formatearFecha(item.fecha)}</Text>
        </View>
        <View style={styles.matchTimeContainer}>
          <Ionicons name="time-outline" size={16} color={yunke.red} />
          <Text style={styles.matchTimeText}>{formatearHora(item.fecha)} HS</Text>
        </View>
      </View>
    </View>
  </FadeInUp>
);
```

- [ ] **Step 2: Update match card styles**

```typescript
// Partidos premium
matchesSection: { marginTop: 20 },
matchCard: {
  width: 320,
  backgroundColor: yunke.card,
  borderRadius: 16,
  padding: 20,
  marginBottom: 10,
  paddingTop: 0,
  shadowColor: yunke.dark,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 5,
  overflow: 'hidden',
},
matchAccent: {
  height: 4,
  marginHorizontal: -20,
  marginBottom: 16,
},
matchTop: {
  borderBottomWidth: 1,
  borderBottomColor: yunke.border,
  paddingBottom: 12,
  marginBottom: 15,
},
matchCategory: {
  fontSize: 13,
  fontFamily: 'Montserrat_600SemiBold',
  color: yunke.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
matchTeamsContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
},
teamColumn: {
  flex: 1,
  alignItems: 'center',
},
teamNameShort: {
  fontSize: 12,
  fontFamily: 'Montserrat_700Bold',
  color: yunke.text,
  marginTop: 6,
},
vsContainer: {
  paddingHorizontal: 12,
},
vsCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: yunke.surface,
  justifyContent: 'center',
  alignItems: 'center',
},
vsText: {
  fontSize: 14,
  fontFamily: 'Montserrat_900Black',
  color: yunke.textSecondary,
},
matchFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: yunke.border,
  paddingTop: 15,
},
matchDateContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  flex: 1,
},
matchDateText: {
  fontSize: 13,
  fontFamily: 'Montserrat_600SemiBold',
  color: yunke.textSecondary,
  textTransform: 'capitalize',
},
matchTimeContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
matchTimeText: {
  fontSize: 14,
  fontFamily: 'Montserrat_700Bold',
  color: yunke.red,
},
teamEscudo: { 
  width: 50,
  height: 50,
},
placeholderEscudo: {
  backgroundColor: yunke.surface,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center'
},
```

- [ ] **Step 3: Verify visual rendering**

Run: `npx expo start` and check match cards
Expected: Vertical layout with bigger crests, circular VS, accent bars

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): redesign match cards with premium vertical layout"
```

---

### Task 5: Redesign Benefits Banner

**Covers:** [S6]

**Files:**
- Modify: `app/(tabs)/index.tsx` (JSX and styles for socioBanner)

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts
- Produces: Updated benefits banner with gold gradient and premium styling

- [ ] **Step 1: Update benefits banner JSX**

```tsx
{/* BANNER HACERTE SOCIO PREMIUM */}
<LinearGradient
  colors={yunke.gradientGold}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.socioBanner}
>
  <View style={styles.bannerBadge}>
    <Text style={styles.bannerBadgeText}>EXCLUSIVO</Text>
  </View>
  <View style={styles.bannerIconContainer}>
    <Ionicons name="star" size={28} color={yunke.white} />
  </View>
  <Pressable style={styles.bannerContent} onPress={() => router.push('/benefits')}>
    <Text style={styles.bannerTitle}>Beneficios Exclusivos</Text>
    <Text style={styles.bannerSubtitle}>Descubrí todo lo que ganás por ser socio del club</Text>
  </Pressable>
  <Ionicons name="chevron-forward" size={24} color={yunke.white} />
</LinearGradient>
```

- [ ] **Step 2: Update benefits banner styles**

```typescript
// Banner Socio Premium
socioBanner: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 24,
  borderRadius: 16,
  padding: 16,
  marginTop: 20,
  marginBottom: 20,
  shadowColor: yunke.gold,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
  position: 'relative',
  overflow: 'hidden',
},
bannerBadge: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(255,255,255,0.25)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
},
bannerBadgeText: {
  color: yunke.white,
  fontSize: 10,
  fontFamily: 'Montserrat_700Bold',
  letterSpacing: 1,
},
bannerIconContainer: {
  width: 52,
  height: 52,
  borderRadius: 14,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 15,
},
bannerContent: {
  flex: 1,
},
bannerTitle: {
  fontSize: 18,
  fontFamily: 'Montserrat_700Bold',
  color: yunke.white,
},
bannerSubtitle: {
  fontSize: 14,
  color: 'rgba(255,255,255,0.85)',
  marginTop: 2,
},
```

- [ ] **Step 3: Verify visual rendering**

Run: `npx expo start` and check the benefits banner
Expected: Gold gradient background, "EXCLUSIVO" badge, star icon, white text

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): redesign benefits banner with gold gradient and premium badge"
```

---

### Task 6: Redesign News Cards

**Covers:** [S7]

**Files:**
- Modify: `app/(tabs)/index.tsx` (JSX and styles for newsCard)

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts
- Produces: Updated news cards with accent lines and premium typography

- [ ] **Step 1: Update news cards JSX**

```tsx
{/* SECCIÓN DE NOTICIAS PREMIUM */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Noticias</Text>
</View>

{noticias.map((noticia) => (
  <View key={noticia.id} style={styles.newsCard}>
    <View style={styles.newsAccentLine} />
    <Text style={styles.newsTitle}>{noticia.titulo}</Text>
    <Text style={styles.newsContent} numberOfLines={3}>{noticia.contenido}</Text>
    <View style={styles.newsFooter}>
      <Ionicons name="calendar-outline" size={14} color={yunke.textSecondary} />
      <Text style={styles.newsDate}>
        {new Date(noticia.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
      </Text>
    </View>
  </View>
))}
```

- [ ] **Step 2: Update news card styles**

```typescript
// Noticias Premium
sectionHeader: { paddingHorizontal: 24, marginTop: 30, marginBottom: 15 },
newsCard: {
  backgroundColor: yunke.card,
  marginHorizontal: 24,
  marginBottom: 16,
  borderRadius: 16,
  padding: 20,
  shadowColor: yunke.dark,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
  overflow: 'hidden',
},
newsAccentLine: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3,
  backgroundColor: yunke.primary,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
},
newsTitle: { 
  fontSize: 18, 
  fontFamily: 'Montserrat_700Bold', 
  color: yunke.text, 
  marginBottom: 8,
  marginTop: 4,
},
newsContent: { 
  fontSize: 15, 
  color: yunke.darkSoft, 
  lineHeight: 22, 
  opacity: 0.85 
},
newsFooter: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
},
newsDate: { 
  fontSize: 13, 
  fontFamily: 'Montserrat_600SemiBold',
  color: yunke.textSecondary, 
  textTransform: 'capitalize' 
},
```

- [ ] **Step 3: Verify visual rendering**

Run: `npx expo start` and check news cards
Expected: Cards with blue accent line at top, bolder title, calendar icon with date

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat(home): redesign news cards with accent lines and premium typography"
```

---

### Task 7: Redesign Tab Bar

**Covers:** [S8]

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `yunke` colors from Colors.ts
- Produces: Updated tab bar with glass effect, larger icons, and active indicator

- [ ] **Step 1: Update tab bar configuration**

```tsx
// app/(tabs)/_layout.tsx
import { yunke } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: yunke.red,
        tabBarInactiveTintColor: yunke.textSecondary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : '#FFFFFF',
          borderTopWidth: 0,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
          position: 'absolute',
          shadowColor: yunke.dark,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Montserrat_600SemiBold',
        },
        headerShown: false,
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Planteles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify visual rendering**

Run: `npx expo start` and check the tab bar
Expected: Larger filled icons, semi-transparent background on iOS, stronger shadow

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat(tabs): redesign tab bar with premium glass effect and larger icons"
```

---

### Task 8: Final Verification and Cleanup

**Covers:** [S3, S4, S5, S6, S7, S8, S9]

**Files:**
- Verify: `app/(tabs)/index.tsx`
- Verify: `app/(tabs)/_layout.tsx`
- Verify: `constants/Colors.ts`

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified, working Home screen

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Test on device/simulator**

Run: `npx expo start` and test:
- Home screen loads correctly
- Sponsors carousel scrolls smoothly
- Match cards display properly
- Benefits banner shows gold gradient
- News cards have accent lines
- Tab bar icons are larger and filled
- Toggle dark mode (if device supports it) and verify colors adapt

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(home): complete premium redesign with light/dark mode support"
```
