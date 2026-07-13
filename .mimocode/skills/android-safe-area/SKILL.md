---
name: android-safe-area
description: >
  Android safe area fix pattern for React Native/Expo.
  Documents useSafeAreaInsets usage for ScrollView padding, FAB positioning,
  and tab bar height to prevent content from being cut off by navigation bars.
  Trigger: When fixing Android layout issues, safe area problems, or content
  being cut off at bottom of screen.
---

# Android Safe Area Fix Pattern

Standardized approach for handling Android safe areas in React Native/Expo apps.

## When to Use

- Content cut off at bottom of screen on Android
- FAB hidden behind navigation bar
- Tab bar overlapping content
- Any `useSafeAreaInsets` related work

## Core Pattern

### Import

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

### Usage in Component

```tsx
const insets = useSafeAreaInsets();
```

## Application Patterns

### 1. ScrollView / FlatList Padding

Prevent content from being cut off behind tab bar or navigation bar:

```tsx
<ScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{
    paddingBottom: 100 + insets.bottom, // Extra space for tab bar
  }}
>
  {content}
</ScrollView>
```

For FlatList:
```tsx
<FlatList
  data={data}
  contentContainerStyle={{
    paddingBottom: 40 + insets.bottom,
  }}
  // ...
/>
```

### 2. FAB (Floating Action Button) Positioning

Prevent FAB from hiding behind navigation bar:

```tsx
<FAB
  icon="plus"
  style={{
    position: 'absolute',
    right: 16,
    bottom: 30 + insets.bottom, // Key: add insets.bottom
  }}
  onPress={handlePress}
/>
```

### 3. Tab Bar Height

For custom tab bars, account for safe area:

```tsx
const TAB_BAR_HEIGHT = 65 + insets.bottom;
```

### 4. Fixed Bottom Elements

For elements that should sit above the navigation bar:

```tsx
<View
  style={{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: insets.bottom,
    backgroundColor: 'white',
  }}
>
  {/* Bottom content */}
</View>
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `paddingBottom: 60` hardcoded | Use `paddingBottom: 60 + insets.bottom` |
| FAB without `insets.bottom` | Add `bottom: 30 + insets.bottom` |
| Tab bar without safe area | Calculate height as `baseHeight + insets.bottom` |
| Forgetting to import `useSafeAreaInsets` | Import from `react-native-safe-area-context` |

## Testing

- Test on Android emulator with different screen sizes
- Test with gesture navigation vs 3-button navigation
- Verify content is not cut off when scrolling to bottom
- Verify FAB is not hidden behind navigation bar

## Notes

- `insets.top` is usually 0 on Android (status bar is separate)
- `insets.bottom` varies: ~20-35px depending on device and navigation style
- Always add `insets.bottom` to any bottom-positioned element
- This pattern works with both Expo and bare React Native projects
