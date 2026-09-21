import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bug, Sliders, Smartphone, Sparkles } from 'lucide-react-native';
import { useDebug } from './debug-context';

export function DebugFloatingButton() {
  const { alternarMenu, menuAberto, modoMoldura } = useDebug();

  return (
    <TouchableOpacity
      style={[styles.floatingButton, menuAberto && styles.floatingButtonActive]}
      onPress={alternarMenu}
      activeOpacity={0.85}
    >
      <View style={styles.pulseDot} />
      <Sparkles size={16} color="#000000" />
      <Text style={styles.buttonLabel}>DEBUG</Text>
      <View style={styles.iconSubWrap}>
        <Smartphone size={12} color="#000000" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 84,
    right: 14,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#f3c21a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  floatingButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#f3c21a',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },
  buttonLabel: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  iconSubWrap: {
    marginLeft: 2,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.2)',
  },
});
