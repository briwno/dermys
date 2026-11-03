import { ds } from '@/theme/design-system';
import React, { memo, useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { Heart } from 'lucide-react-native';
import { createThemedStyles } from '@/theme';
import type { ItemPortfolio } from '@/types/artista-detalhado';
import type { ItemArtistaFeedData } from './cartao-artista-feed';
import { montarPostsObras } from './obras-feed';
import { AvatarArtista } from './avatar-artista';

interface Props {
  cabecalho?: ReactNode;
  onScroll?: ScrollViewProps['onScroll'];
  artistas: ItemArtistaFeedData[];
  curtidos: Record<string, boolean>;
  onCurtir: (id: string) => void;
  onAbrirPerfil: (artista: ItemArtistaFeedData, obra: ItemPortfolio) => void;
}

export function FeedMosaico({ artistas, curtidos, onCurtir, onAbrirPerfil, cabecalho, onScroll }: Props) {
  const [numeroColunas, setNumeroColunas] = useState(2);
  const colunas = useMemo(() => {
    const itens = montarPostsObras(artistas);
    return Array.from({ length: numeroColunas }, (_, coluna) =>
      itens.filter((_, indice) => indice % numeroColunas === coluna)
    );
  }, [artistas, numeroColunas]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
      onScroll={onScroll} scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentInsetAdjustmentBehavior="never"
      onLayout={event => setNumeroColunas(Math.max(2, Math.min(5, Math.floor(event.nativeEvent.layout.width / 180))))}>
      {cabecalho && <View collapsable={false}>{cabecalho}</View>}
      <View style={styles.content}>
      {colunas.map((itens, coluna) => (
        <View key={coluna} style={[styles.column, coluna % 2 === 1 && { paddingTop: 22 }]}>
          {itens.map(({ artista, obra }, indice) => (
            <CartaoMosaico key={`${artista.id}:${obra.id}`} artista={artista} obra={obra} indice={indice} coluna={coluna} curtido={!!curtidos[artista.id]} onCurtir={onCurtir} onAbrirPerfil={onAbrirPerfil} />
          ))}
        </View>
      ))}
      </View>
    </ScrollView>
  );
}

const CartaoMosaico = memo(function CartaoMosaico({ artista, obra, indice, coluna, curtido, onCurtir, onAbrirPerfil }: {
  artista: ItemArtistaFeedData; obra: ItemPortfolio; indice: number; coluna: number; curtido: boolean;
  onCurtir: Props['onCurtir']; onAbrirPerfil: Props['onAbrirPerfil'];
}) {
  return <View style={styles.card}>
              <Pressable
                style={({ pressed }) => pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] }}
                accessibilityRole="button"
                accessibilityLabel={`${obra.titulo}, por ${artista.artistaNome}. Ver perfil e agendar`}
                onPress={() => onAbrirPerfil(artista, obra)}
              >
                <View style={styles.photoWrap}>
                <Image
                  source={{ uri: obra.imagemUrl }}
                  style={[styles.image, { aspectRatio: (indice + coluna) % 3 === 0 ? 0.68 : 0.85 }]}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
                {obra.titulo.startsWith('Demonstração IA') && (
                  <View style={photoStyles.demoBadge}><Text style={photoStyles.demoText}>DEMO IA</Text></View>
                )}
                <View style={photoStyles.styleBadge}><Text style={photoStyles.styleText}>{obra.estilo || artista.estilo}</Text></View>
                </View>
                <View style={styles.details}>
                  <View style={styles.artistRow}>
                    <AvatarArtista uri={artista.artistaFoto} nome={artista.artistaNome} />
                    <Text style={styles.artist} numberOfLines={1}>{artista.artistaNome}</Text>
                  </View>
                  <Text style={styles.title} numberOfLines={2}>
                    {obra.titulo.replace(/^Demonstração IA\s*·\s*/, '')}
                  </Text>
                  <Text style={styles.location} numberOfLines={1}>
                    {artista.cidade.split(',')[0]}{artista.distanciaFormatada ? ` · ${artista.distanciaFormatada}` : ''}
                  </Text>
                </View>
              </Pressable>
              {obra.disponivel === true && obra.preco != null && (
                <Text style={styles.price}>
                  {obra.preco.toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
                  })}
                </Text>
              )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${curtido ? 'Remover dos salvos' : 'Salvar artista'} ${artista.artistaNome}`}
                  accessibilityState={{ selected: curtido }}
                  onPress={() => onCurtir(artista.id)}
                  hitSlop={5}
                  style={({ pressed }) => [photoStyles.like, pressed && { transform: [{ scale: 0.9 }] }]}
                >
                  <Heart size={18} color={curtido ? '#fb7185' : '#ffffff'}
                    fill={curtido ? '#fb7185' : 'transparent'} />
                </Pressable>
            </View>;
});

const styles = createThemedStyles({
  scrollContent: { paddingBottom: 24 },
  content: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  column: { flex: 1, minWidth: 0, gap: 20 },
  card: { position: 'relative' },
  photoWrap: { position: 'relative', borderRadius: 14, overflow: 'hidden' },
  image: { width: '100%', backgroundColor: '#18181b' },
  details: { paddingHorizontal: 2, paddingTop: 8, gap: 4 },
  title: { color: ds.cores.textoSecundario, fontSize: 14, fontWeight: '600', lineHeight: 19,
    flexShrink: 1, },
  artistRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  artist: { color: ds.cores.destaque, fontSize: 12, fontWeight: '700', flexShrink: 1,
    lineHeight: 17, },
  location: { color: ds.cores.textoSuave, fontSize: 12,
    lineHeight: 17,
    flexShrink: 1, },
  price: { color: ds.cores.textoSecundario, fontSize: ds.fonte.corpo, fontWeight: '600', paddingTop: 7, paddingLeft: 2,
    lineHeight: 20,
    flexShrink: 1, },
});

// Sobre a foto, as cores permanecem claras nos dois temas.
const photoStyles = StyleSheet.create({
  styleBadge: { position: 'absolute', bottom: 10, left: 8, right: 8, alignItems: 'flex-start' },
  styleText: { backgroundColor: '#f3c21a', color: '#101010', paddingHorizontal: 8, paddingVertical: 4, fontSize: ds.fonte.etiqueta, fontWeight: '800', borderRadius: 4,
    lineHeight: 16, },
  like: { position: 'absolute', top: 7, right: 7, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  demoBadge: { position: 'absolute', top: 12, left: 10, backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  demoText: { color: '#ffffff', fontSize: ds.fonte.etiqueta, fontWeight: '600', letterSpacing: 0.6,
    lineHeight: 16, },
});
