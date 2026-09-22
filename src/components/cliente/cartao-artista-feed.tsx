import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight, Heart, MapPin, ShieldCheck } from 'lucide-react-native';
import type { ItemPortfolio } from '@/types/artista-detalhado';

export interface ItemArtistaFeedData {
  id: string;
  artistaId: string;
  artistaNome: string;
  artistaFoto?: string;
  estudioNome: string;
  cidade: string;
  distanciaKm?: number;
  distanciaFormatada?: string;
  estilo: string;
  precoInicial: number;
  curtidas: number;
  notaMedia: number;
  obras: ItemPortfolio[];
  rawArtista: any;
  rawFlashes: any[];
  rawReviews: any[];
}

interface CartaoArtistaFeedProps {
  item: ItemArtistaFeedData;
  isCurtido?: boolean;
  onCurtir: (id: string) => void;
  onAbrirPerfil: (item: ItemArtistaFeedData, obraSelecionada?: ItemPortfolio) => void;
}

export function CartaoArtistaFeed({
  item,
  isCurtido = false,
  onCurtir,
  onAbrirPerfil,
}: CartaoArtistaFeedProps) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [cardWidth, setCardWidth] = useState(170);
  const scrollRef = useRef<ScrollView>(null);

  const fotos = item.obras && item.obras.length > 0
    ? item.obras
    : [
        {
          id: `${item.id}-fallback-1`,
          artistaId: item.artistaId,
          titulo: `${item.estilo} Autoral`,
          imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
          estilo: item.estilo,
          preco: item.precoInicial,
        },
      ];

  const totalFotos = fotos.length;
  const obraAtual = fotos[indiceAtivo] || fotos[0];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth || 170));
    if (index >= 0 && index < totalFotos && index !== indiceAtivo) {
      setIndiceAtivo(index);
    }
  };

  const irParaProxima = (e: any) => {
    e?.stopPropagation?.();
    if (indiceAtivo < totalFotos - 1) {
      const next = indiceAtivo + 1;
      setIndiceAtivo(next);
      scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
    }
  };

  const irParaAnterior = (e: any) => {
    e?.stopPropagation?.();
    if (indiceAtivo > 0) {
      const prev = indiceAtivo - 1;
      setIndiceAtivo(prev);
      scrollRef.current?.scrollTo({ x: prev * cardWidth, animated: true });
    }
  };

  return (
    <Pressable
      style={styles.cardContainer}
      onPress={() => onAbrirPerfil(item, obraAtual)}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 50 && w !== cardWidth) {
          setCardWidth(w);
        }
      }}
    >
      {/* Área da Foto / Carrossel Horizontal Swipeable */}
      <View style={styles.imageWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          style={styles.photoScrollView}
        >
          {fotos.map((foto, index) => (
            <View key={foto.id || index} style={{ width: cardWidth, height: 190 }}>
              <Image
                source={{ uri: foto.imagemUrl }}
                style={styles.tattooPhoto}
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>

        {/* Badge do Estilo da Tatuagem */}
        <View style={styles.styleBadge}>
          <Text style={styles.styleBadgeText}>{obraAtual.estilo || item.estilo}</Text>
        </View>

        {/* Badge de Distância */}
        {item.distanciaFormatada ? (
          <View style={styles.distanceBadge}>
            <MapPin size={9} color="#000000" />
            <Text style={styles.distanceBadgeText}>{item.distanciaFormatada}</Text>
          </View>
        ) : null}

        {/* Botão de Curtir */}
        <Pressable
          style={styles.likeBtn}
          onPress={(e) => {
            e.stopPropagation();
            onCurtir(item.id);
          }}
        >
          <Heart
            size={13}
            color={isCurtido ? '#f43f5e' : '#ffffff'}
            fill={isCurtido ? '#f43f5e' : 'transparent'}
          />
        </Pressable>

        {/* Setas de navegação rápida (especialmente úteis no Web) */}
        {totalFotos > 1 && indiceAtivo > 0 && (
          <Pressable style={[styles.arrowBtn, styles.arrowLeft]} onPress={irParaAnterior}>
            <ChevronLeft size={14} color="#ffffff" />
          </Pressable>
        )}

        {totalFotos > 1 && indiceAtivo < totalFotos - 1 && (
          <Pressable style={[styles.arrowBtn, styles.arrowRight]} onPress={irParaProxima}>
            <ChevronRight size={14} color="#ffffff" />
          </Pressable>
        )}

        {/* Indicadores de Paginação (Dots estilo Pinterest / Instagram) */}
        {totalFotos > 1 && (
          <View style={styles.dotsContainer}>
            {fotos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === indiceAtivo ? styles.dotActive : styles.dotIdle]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Informações da Tatuagem & Artista Abaixo da Imagem */}
      <View style={styles.infoBlock}>
        <Text style={styles.artworkTitle} numberOfLines={1}>
          {obraAtual.titulo || `${item.estilo} Autoral`}
        </Text>

        {/* Linha do Artista com Mini Avatar */}
        <View style={styles.artistRow}>
          {item.artistaFoto ? (
            <Image source={{ uri: item.artistaFoto }} style={styles.artistAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{item.artistaNome[0]}</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <View style={styles.artistNameVerifiedRow}>
              <Text style={styles.artistName} numberOfLines={1}>
                {item.artistaNome}
              </Text>
              <ShieldCheck size={11} color="#10b981" />
            </View>
            <Text style={styles.studioCity} numberOfLines={1}>
              {item.estudioNome} • {item.distanciaFormatada || item.cidade.split(',')[0]}
            </Text>
          </View>
        </View>

        {/* Preço Base Transparente */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>A partir de</Text>
          <Text style={styles.priceValue}>
            R$ {obraAtual.preco || item.precoInicial}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '48.5%',
    backgroundColor: '#0f0f13',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e26',
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageWrap: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#16161c',
  },
  photoScrollView: {
    width: '100%',
    height: '100%',
  },
  tattooPhoto: {
    width: '100%',
    height: '100%',
  },
  styleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  styleBadgeText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '800',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f3c21a',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 3,
  },
  distanceBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 3,
  },
  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  arrowLeft: {
    left: 6,
  },
  arrowRight: {
    right: 6,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 3,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 10,
    backgroundColor: '#f3c21a',
  },
  dotIdle: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  infoBlock: {
    padding: 10,
    gap: 6,
  },
  artworkTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#262630',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  artistNameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  artistName: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '700',
  },
  studioCity: {
    color: '#71717a',
    fontSize: 9,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#181820',
  },
  priceLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '600',
  },
  priceValue: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '900',
  },
});
