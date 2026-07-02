# Home Screen Premium Redesign - Club Yunke

## [S1] Problem

The current Home screen has a clean but basic design that doesn't match the premium feel of top football club apps (Real Madrid, Manchester City, Barcelona). The aesthetic needs elevation to feel modern and premium while maintaining usability in both light and dark modes.

## [S2] Solution Overview

Hybrid approach: Dark hero header + Light content area. This combines dramatic branding impact with clean readability. All components get premium treatment: better shadows, refined typography, glass effects, and micro-animations.

## [S3] Header Hero

- Dark gradient: `#1A2858` → `#203070` diagonal direction
- Club logo centered and prominent (escudo)
- "YUNKE FC" text in Montserrat Black with negative letter-spacing
- Subtle "FÚTBOL CLUB" subtitle with opacity
- Increased height (~160px) for greater presence
- Subtle bottom shadow for "floating" effect
- Dark mode: gradient intensifies, logo glows more

## [S4] Sponsors Carousel

- Cards with larger border radius (20px)
- More pronounced shadow for depth effect
- Subtle gradient overlay at bottom for text
- Full cover images with dark gradient overlay when available
- Clean white background with centered logo and soft shadow when only logo
- More elegant dot indicators: thicker dots, active wider with gradient
- Smoother transitions between slides

## [S5] Match Cards

- White cards with 16px border radius
- Color accent bar at top: red if home, blue if away
- **Vertical layout** (not horizontal) for more impact:
  - Larger crests (50px) facing each other
  - "VS" with premium style (circular background, bold typography)
  - Larger date and time with icons
  - Competition/league badge
- **Press effect** with slight scale and increased shadow
- Horizontal list: narrower cards but more visual drama

## [S6] Benefits Banner

- Gold gradient background: `#F5A623` → `#FFD166`
- Dark text on gold background (high contrast)
- Larger and subtly animated star icon (gentle pulse)
- "EXCLUSIVO" or "SOCIO" badge in top right corner
- Subtle golden shadow around
- Dark mode: dark background with gold border and gold text

## [S7] News Cards

- Cards with larger border radius (16px)
- **Larger and bolder title** (Montserrat 700, 18px)
- **Content** with better line-height and controlled opacity
- **Date** with calendar icon and more premium style
- **Subtle accent line** at top (1-2px, primary color) for visual hierarchy
- **Press effect** with scale(0.98) and increased shadow
- Dark mode: `#1C1C1E` background with subtle borders

## [S8] Tab Bar Premium

- **Glass/frosted effect** on iOS (blur background)
- On Android: more pronounced shadow to simulate elevation
- **Larger icons** (24px → 26px)
- **Active indicator**: 3px bottom line with red gradient, not just color change
- **Labels** with slightly larger font size (11px → 12px)
- **Subtle animation** on tab change (scale on icon)
- Transparent or semi-transparent background so content appears "behind"

## [S9] Color System Light/Dark

### Light Mode (default)
- Background: `#F5F5F8`
- Cards: `#FFFFFF` with subtle shadows
- Primary text: `#1C1C1E`
- Secondary text: `#8E8E93`
- Accent: Red `#E01020` and Blue `#203070`

### Dark Mode
- Background: `#121212`
- Cards: `#1C1C1E` (not pure black, softer)
- Subtle borders: `#2C2C2E`
- Primary text: `#FFFFFF`
- Secondary text: `#8E8E93`
- Accent: Same colors but with higher saturation

### Transitions
- All colors adapt smoothly to mode change
- Shadows adjust (more pronounced in dark mode)
- Header gradients change intensity

## [S10] Implementation Scope

- **In scope**: Home screen redesign (all 7 sections above)
- **Out of scope**: Other screens, new functionality, database changes
- **Reference implementation**: Home screen pattern to be replicated in other screens later

## [S11] Technical Constraints

- Use existing dependencies: `expo-linear-gradient`, `react-native-reanimated`, `@expo/vector-icons`
- No new npm packages required
- Must support both light and dark modes via `useColorScheme`
- Maintain existing data fetching logic (Supabase)
- Keep Montserrat font family
