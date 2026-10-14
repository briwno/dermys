import { Moon, Sun } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { createThemedStyles, tc } from './tema-store';
import { useTheme } from './theme-context';

// Posição da bolinha preservada entre remontagens (a árvore é remontada ao trocar o tema),
// permitindo que a animação parta da posição anterior.
let ultimaPosicaoBolinha: number | null = null;

/** Card com interruptor para alternar entre modo escuro e modo claro. */
export function BotaoAlternarTema() {
  const { modoClaro, alternarModo } = useTheme();
  const alvo = modoClaro ? 1 : 0;
  const posicao = useRef(new Animated.Value(ultimaPosicaoBolinha ?? alvo)).current;

  useEffect(() => {
    ultimaPosicaoBolinha = alvo;
    Animated.spring(posicao, {
      toValue: alvo,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [alvo, posicao]);

  const deslocamento = posicao.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Aparência</Text>

      <Pressable
        nativeID="botao-alternar-tema"
        testID="botao-alternar-tema"
        accessibilityRole="switch"
        accessibilityState={{ checked: modoClaro }}
        accessibilityLabel="Alternar modo claro"
        onPress={alternarModo}
        style={({ pressed }) => [styles.linha, pressed && styles.linhaPressionada]}
      >
        <View style={styles.iconeWrap}>
          {modoClaro ? <Sun size={18} color={tc('#f3c21a')} /> : <Moon size={18} color={tc('#f3c21a')} />}
        </View>

        <View style={styles.textos}>
          <Text style={styles.titulo}>{modoClaro ? 'Modo claro' : 'Modo escuro'}</Text>
          <Text style={styles.descricao}>
            {modoClaro ? 'Toque para voltar ao tema escuro' : 'Toque para ativar o tema claro'}
          </Text>
        </View>

        <View style={[styles.trilho, modoClaro && styles.trilhoAtivo]}>
          <Animated.View style={[styles.bolinha, { transform: [{ translateX: deslocamento }] }]}>
            {modoClaro ? <Sun size={12} color={tc('#f3c21a')} /> : <Moon size={12} color={tc('#888')} />}
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = createThemedStyles({
  card: {
    backgroundColor: '#101010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
  },
  linhaPressionada: {
    opacity: 0.75,
  },
  iconeWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(243, 194, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  descricao: {
    color: '#9ca3af',
    fontSize: 11,
  },
  trilho: {
    width: 52,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 2,
    justifyContent: 'center',
  },
  trilhoAtivo: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  bolinha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
