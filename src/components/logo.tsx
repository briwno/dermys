import React from 'react';
import { Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export function Logo({ size = 180, color = '#FACC15' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityLabel="Dermys" accessibilityRole="image"><Path fill={color} d="M112 112H512C1040 112 1040 912 512 912H160C304 712 568 488 768 304C528 504 112 664 112 880V112Z" /></Svg>;
}

export function Letreiro({ width = 240, dark = false }: { width?: number; dark?: boolean }) {
  return <Image source={dark ? require('../../assets/brand/dermys-v1/letreiro-preto.png') : require('../../assets/brand/dermys-v1/letreiro-branco.png')} style={{ width, height: width * 0.2 }} resizeMode="contain" accessibilityLabel="Dermys" />;
}
