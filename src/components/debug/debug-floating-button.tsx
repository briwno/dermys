import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { useDebug } from './debug-context';

export function DebugFloatingButton() {
  const { setMenuAberto, menuAberto } = useDebug();
  const { width } = useWindowDimensions();
  const [expandido, setExpandido] = useState(false);
  const [teclado, setTeclado] = useState(false);
  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTeclado(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTeclado(false));
    return () => { mostrar.remove(); ocultar.remove(); };
  }, []);
  useEffect(() => { if (!expandido) return; const t = setTimeout(() => setExpandido(false), 8000); return () => clearTimeout(t); }, [expandido]);
  if (menuAberto || teclado || (Platform.OS === 'web' && width >= 600)) return null;

  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel="Ferramentas de teste" accessibilityHint="Mantenha pressionado para abrir, ou toque e depois toque novamente"
      delayLongPress={650}
      style={[styles.floatingPill, expandido && styles.floatingPillActive]}
      onLongPress={() => { setMenuAberto(true); setExpandido(false); }}
      onPress={() => { if (expandido) { setMenuAberto(true); setExpandido(false); } else setExpandido(true); }}
    >
      {expandido ? <Wrench size={19} color="#f3c21a" /> : <View style={styles.ponto} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatingPill: {
    position: 'absolute',
    bottom: 88,
    right: 2,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  floatingPillActive: {
    backgroundColor: '#1b1b20',
    borderWidth: 1,
    borderColor: '#494129',
  },
  pillLabel: {
    color: '#cccccc',
    fontSize: 11,
    fontWeight: '700',
  },
  pillLabelActive: {
    color: '#000000',
    fontWeight: '800',
  },
  ponto: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#a6a6b2', opacity: 0.45 },
});
