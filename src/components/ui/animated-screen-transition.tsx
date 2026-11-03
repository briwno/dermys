import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useReducedMotion } from './use-reduced-motion';

export type ScreenTransitionType = 'fade-slide' | 'fade-scale' | 'fade';

interface AnimatedScreenTransitionProps {
  screenKey: string | number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  type?: ScreenTransitionType;
  duration?: number;
}

/**
 * Envolve o conteúdo de uma tela ou aba para fornecer uma transição suave e "clean"
 * ao alternar entre telas/seções (sem cortes abruptos).
 */
export function AnimatedScreenTransition({
  screenKey,
  children,
  style,
  type = 'fade-slide',
  duration = 180,
}: AnimatedScreenTransitionProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const reduzirMovimento = useReducedMotion();

  useEffect(() => {
    if (reduzirMovimento) { animValue.setValue(1); return; }
    animValue.setValue(0);
    const animacao = Animated.timing(animValue, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    });
    animacao.start();
    return () => animacao.stop();
  }, [screenKey, duration, reduzirMovimento, animValue]);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [type === 'fade-slide' ? 6 : 0, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [type === 'fade-scale' ? 0.98 : 1, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
