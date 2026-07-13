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
