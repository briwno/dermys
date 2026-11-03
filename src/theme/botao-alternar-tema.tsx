import { ds } from '@/theme/design-system';
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
          {modoClaro ? <Sun size={18} color={tc(ds.cores.destaque)} /> : <Moon size={18} color={tc(ds.cores.destaque)} />}
        </View>

        <View style={styles.textos}>
          <Text style={styles.titulo}>{modoClaro ? 'Modo claro' : 'Modo escuro'}</Text>
          <Text style={styles.descricao}>
            {modoClaro ? 'Toque para voltar ao tema escuro' : 'Toque para ativar o tema claro'}
          </Text>
        </View>

        <View style={[styles.trilho, modoClaro && styles.trilhoAtivo]}>
          <Animated.View style={[styles.bolinha, { transform: [{ translateX: deslocamento }] }]}>
            {modoClaro ? <Sun size={12} color={tc(ds.cores.destaque)} /> : <Moon size={12} color={tc(ds.cores.textoSuave)} />}
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = createThemedStyles({
  card: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.secao,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 26,
    flexShrink: 1,
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
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '800',
    lineHeight: 26,
    flexShrink: 1,
  },
  descricao: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  trilho: {
    width: 52,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 2,
    justifyContent: 'center',
  },
  trilhoAtivo: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  bolinha: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ds.cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
