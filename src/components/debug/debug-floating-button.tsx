import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import { useDebug } from './debug-context';

export function DebugFloatingButton() {
  const { alternarMenu, menuAberto } = useDebug();

  return (
    <TouchableOpacity
      style={[styles.floatingPill, menuAberto && styles.floatingPillActive]}
      onPress={alternarMenu}
      activeOpacity={0.8}
    >
      <Smartphone size={13} color={menuAberto ? '#000000' : '#f3c21a'} />
      <Text style={[styles.pillLabel, menuAberto && styles.pillLabelActive]}>
        Testes / Simulador
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingPill: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141414',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262626',
  },
  floatingPillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
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
});
