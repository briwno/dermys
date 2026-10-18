import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { createThemedStyles } from '@/theme';

export function AvatarArtista({ uri, nome }: { uri?: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [uri]);
  if (uri && !falhou) return (
    <Image source={{ uri }} style={styles.avatar} onError={() => setFalhou(true)}
      accessibilityLabel={`Foto de ${nome}`} />
  );
  return <View style={[styles.avatar, styles.placeholder]}>
    <Text style={styles.initial}>{nome.trim().charAt(0).toUpperCase()}</Text>
  </View>;
}

const styles = createThemedStyles({
  avatar: { width: 24, height: 24, borderRadius: 12, flexShrink: 0 },
  placeholder: { backgroundColor: '#262630', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#f3c21a', fontSize: 12, fontWeight: '800' },
});
