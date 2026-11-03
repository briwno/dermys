import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from '@/components/ui/use-reduced-motion';

/** O cabeçalho move sobre o conteúdo, preservando a altura e a posição da lista. */
export function useCabecalhoFeed(altura: number, fixo: boolean, chave: string) {
  const progresso = useRef(new Animated.Value(0)).current;
  const [oculto, setOculto] = useState(false);
  const gesto = useRef({ y: 0, acumulado: 0, direcao: 0, oculto: false });
  const reduzir = useReducedMotion();
  const revelar = useCallback(() => { gesto.current.oculto = false; gesto.current.acumulado = 0; setOculto(false); }, []);
  useEffect(() => { revelar(); }, [fixo, chave, revelar]);
  useEffect(() => {
    const animacao = Animated.timing(progresso, { toValue: oculto ? 1 : 0, duration: reduzir ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web', isInteraction: false });
    animacao.start(); return () => animacao.stop();
  }, [oculto, reduzir, progresso]);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const limite = Math.max(0, contentSize.height - layoutMeasurement.height);
    const y = Math.min(limite, Math.max(0, contentOffset.y));
    const g = gesto.current; const delta = y - g.y; g.y = y;
    if (fixo || y < 12) { revelar(); return; }
    if (Math.abs(delta) < 1) return;
    const direcao = Math.sign(delta);
    g.acumulado = direcao === g.direcao ? g.acumulado + Math.abs(delta) : Math.abs(delta); g.direcao = direcao;
    if ((direcao > 0 && y > 40 && g.acumulado >= 24) || (direcao < 0 && g.acumulado >= 14)) {
      const esconder = direcao > 0;
      if (g.oculto !== esconder) { g.oculto = esconder; setOculto(esconder); }
    }
  }, [fixo, revelar]);
  return { onScroll, oculto, revelar, estilo: { transform: [{ translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [0, -altura - 12] }) }] } };
}
