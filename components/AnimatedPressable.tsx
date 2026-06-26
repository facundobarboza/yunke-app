import { ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

interface AnimatedPressableProps extends Omit<PressableProps, 'children'> {
  /** Escala al presionar (default: 0.97) */
  scaleTo?: number;
  /** Estilo aplicado al Animated.View wrapper */
  containerStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * AnimatedPressable — wrapper que agrega feedback táctil con spring animation.
 *
 * Reemplazá cualquier <Pressable> por <AnimatedPressable> y obtené
 * micro-interacción premium al toque.
 *
 * @example
 * <AnimatedPressable onPress={handlePress}>
 *   <Text>Toque con vida</Text>
 * </AnimatedPressable>
 */
export function AnimatedPressable({
  scaleTo = 0.97,
  containerStyle,
  children,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, containerStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
