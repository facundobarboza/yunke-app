import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeInUpProps {
  children: ReactNode;
  /** Delay en ms antes de empezar la animación (default: 0) */
  delay?: number;
  /** Duración de la animación en ms (default: 350) */
  duration?: number;
  /** Distancia inicial desde abajo (default: 20) */
  translateFrom?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * FadeInUp — animación de entrada: opacity 0→1 + translateY hacia arriba.
 *
 * Envolvé cualquier componente que quieras que aparezca con una transición
 * suave. Para listas, pasá un delay basado en el índice para efecto escalonado.
 *
 * @example
 * <FadeInUp delay={index * 80}>
 *   <Card />
 * </FadeInUp>
 */
export function FadeInUp({
  children,
  delay = 0,
  duration = 350,
  translateFrom = 20,
  style,
}: FadeInUpProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateFrom)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay, duration]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
