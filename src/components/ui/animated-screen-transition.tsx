import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

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
  duration = 220,
}: AnimatedScreenTransitionProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const lastKeyRef = useRef(screenKey);

  const executarAnimacao = () => {
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: 1,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  useEffect(() => {
    if (lastKeyRef.current !== screenKey) {
      lastKeyRef.current = screenKey;
      executarAnimacao();
    }
  }, [screenKey, duration]);

  // Animação na primeira montagem
  useEffect(() => {
    executarAnimacao();
  }, []);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [type === 'fade-slide' ? 9 : 0, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [type === 'fade-scale' ? 0.98 : 0.995, 1],
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
