import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { createThemedStyles, tc } from '@/theme';
import type { ItemPortfolio } from '@/types/artista-detalhado';
import type { ItemArtistaFeedData } from './cartao-artista-feed';
import { montarPostsObras } from './obras-feed';
import { AvatarArtista } from './avatar-artista';

interface Props {
  artistas: ItemArtistaFeedData[];
  curtidos: Record<string, boolean>;
  onCurtir: (id: string) => void;
  onAbrirPerfil: (artista: ItemArtistaFeedData, obra: ItemPortfolio) => void;
}

export function FeedMosaico({ artistas, curtidos, onCurtir, onAbrirPerfil }: Props) {
  const colunas = useMemo(() => {
    const itens = montarPostsObras(artistas);
    return [0, 1].map((coluna) =>
      itens.filter((_, indice) => indice % 2 === coluna)
    );
  }, [artistas]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {colunas.map((itens, coluna) => (
        <View key={coluna} style={styles.column}>
          {itens.map(({ artista, obra }, indice) => (
            <View key={`${artista.id}:${obra.id}`} style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${obra.titulo}, por ${artista.artistaNome}. Ver perfil e agendar`}
                onPress={() => onAbrirPerfil(artista, obra)}
              >
                <Image
                  source={{ uri: obra.imagemUrl }}
                  style={[styles.image, { aspectRatio: (indice + coluna) % 3 === 0 ? 0.7 : 0.95 }]}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                <View style={styles.details}>
                  <Text style={styles.title} numberOfLines={2}>{obra.titulo}</Text>
                  <View style={styles.artistRow}>
                    <AvatarArtista uri={artista.artistaFoto} nome={artista.artistaNome} />
                    <Text style={styles.artist} numberOfLines={1}>{artista.artistaNome}</Text>
                  </View>
                  <Text style={styles.location} numberOfLines={1}>
                    {artista.distanciaFormatada || artista.cidade} · {obra.estilo || artista.estilo}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.footer}>
                <Text style={styles.price}>
                  {(obra.preco ?? artista.precoInicial).toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${curtidos[artista.id] ? 'Descurtir' : 'Curtir'} ${artista.artistaNome}`}
                  accessibilityState={{ selected: !!curtidos[artista.id] }}
                  onPress={() => onCurtir(artista.id)}
                  style={styles.like}
                >
                  <Heart size={17} color={tc(curtidos[artista.id] ? '#f43f5e' : '#a1a1aa')}
                    fill={curtidos[artista.id] ? tc('#f43f5e') : 'transparent'} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = createThemedStyles({
  content: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  column: { flex: 1, minWidth: 0, gap: 10 },
  card: { backgroundColor: '#101014', borderRadius: 16, overflow: 'hidden' },
  image: { width: '100%', backgroundColor: '#222228' },
  details: { paddingHorizontal: 10, paddingTop: 10, gap: 4 },
  title: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  artist: { color: '#d4d4d8', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  location: { color: '#8e8e93', fontSize: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 10 },
  price: { color: '#f3c21a', fontSize: 12, fontWeight: '800', flexShrink: 1 },
  like: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
