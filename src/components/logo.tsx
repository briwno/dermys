import React from 'react';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';

export function Logo({ size = 180, color = '#FACC15' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Path
        d="M36 22H62C65.3137 22 68 24.6863 68 28V72C68 75.3137 65.3137 78 62 78H36C33.7909 78 32 76.2091 32 74V26C32 23.7909 33.7909 22 36 22Z"
        stroke={color}
        strokeWidth={4}
        strokeLinejoin="round"
      />

      <G stroke={color} strokeWidth={3.5} strokeLinecap="round">
        <Path d="M26 30H32" />
        <Path d="M26 38H32" />
        <Path d="M26 46H32" />
        <Path d="M26 54H32" />
        <Path d="M26 62H32" />
        <Path d="M26 70H32" />
      </G>

      <Line x1="40" y1="22" x2="40" y2="78" stroke={color} strokeWidth={2} />

      <Path
        d="M46 36V64H50C57.732 64 64 57.732 64 50C64 42.268 57.732 36 50 36H46ZM50 42C54.4183 42 58 45.5817 58 50C58 54.4183 54.4183 58 50 58H50V42H50Z"
        fill={color}
      />

      <Path
        d="M44 72L48 68L51 71H60"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <G transform="translate(62, 45) rotate(-30)">
        <Path d="M0 -15H15V-5H0V-15Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M5 -5H10V15H5V-5Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
        <Rect x={3} y={15} width={9} height={15} rx={2} fill={color} />
        <Path d="M7.5 30L7.5 45" stroke={color} strokeWidth={4} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
