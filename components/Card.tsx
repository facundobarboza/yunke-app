import type { ThemePalette } from '@/constants/Colors';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'flat';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.base, styles[`variant_${variant}`], style]}>
      {children}
    </View>
  );
}

// REQ-6: shadows only in light; dark uses border + elevation
const createStyles = (theme: ThemePalette) => {
  const shadowBase = theme.isDark
    ? {}
    : {
        shadowColor: theme.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      };
  const shadowElevated = theme.isDark
    ? { elevation: 4 }
    : {
        shadowColor: theme.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
      };
  return StyleSheet.create({
    base: {
      backgroundColor: theme.card,
      borderRadius: 16,
      ...(theme.isDark ? { borderWidth: 1, borderColor: theme.border } : null),
    },
    variant_default: {
      ...shadowBase,
      ...(theme.isDark ? { elevation: 3 } : null),
    },
    variant_elevated: shadowElevated,
    variant_flat: {
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  });
};
