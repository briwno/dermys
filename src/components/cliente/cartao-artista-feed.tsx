import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from 'lucide-react-native';
import type { ItemPortfolio } from '@/types/artista-detalhado';
import { createThemedStyles, tc } from '@/theme';
import { AvatarArtista } from './avatar-artista';

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
  /** Altura fixa do post (ocupa uma "página" inteira do feed) */
  altura: number;
  isCurtido?: boolean;
  /** Exibe a dica "deslize para o próximo" (normalmente só no primeiro post) */
  mostrarDicaDeslize?: boolean;
  onCurtir: (id: string) => void;
  onAbrirPerfil: (item: ItemArtistaFeedData, obraSelecionada?: ItemPortfolio) => void;
}

const USE_NATIVE = Platform.OS !== 'web';
const INTERVALO_DUPLO_TOQUE = 260;

/**
 * Degradê preto → transparente sem dependências nativas.
 * Usa faixas de altura inteira (2px) para evitar emendas sub-pixel e uma
 * curva smoothstep para a transição não ficar "listrada".
 */
function Scrim({
  direcao,
  altura,
  opacidadeMax,
}: {
  direcao: 'top' | 'bottom';
  altura: number;
  opacidadeMax: number;
}) {
  const ALTURA_FAIXA = 2;
  const faixas = Math.max(1, Math.round(altura / ALTURA_FAIXA));
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, right: 0, height: faixas * ALTURA_FAIXA },
        direcao === 'top' ? { top: 0 } : { bottom: 0 },
      ]}
    >
      {Array.from({ length: faixas }).map((_, i) => {
        // t = 1 na borda do post, 0 no meio da foto
        const pos = (i + 0.5) / faixas;
        const t = direcao === 'top' ? 1 - pos : pos;
        const suave = t * t * (3 - 2 * t);
        return (
          <View
            key={i}
            style={{
              height: ALTURA_FAIXA,
              backgroundColor: `rgba(0,0,0,${(suave * opacidadeMax).toFixed(3)})`,
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Post em tela cheia estilo Reels/TikTok: um tatuador por página,
 * carrossel horizontal de obras, toque simples abre o perfil e
 * toque duplo curte.
 */
export function CartaoArtistaFeed({
  item,
  altura,
  isCurtido = false,
  mostrarDicaDeslize = false,
  onCurtir,
  onAbrirPerfil,
}: CartaoArtistaFeedProps) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [larguraMidia, setLarguraMidia] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const ultimoToque = useRef(0);
  const timerToque = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const likeBtnScale = useRef(new Animated.Value(1)).current;
  const dicaY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (timerToque.current) clearTimeout(timerToque.current);
    };
  }, []);

  useEffect(() => {
    if (!mostrarDicaDeslize) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dicaY, { toValue: 6, duration: 600, useNativeDriver: USE_NATIVE }),
        Animated.timing(dicaY, { toValue: 0, duration: 600, useNativeDriver: USE_NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [mostrarDicaDeslize, dicaY]);

  const fotos: ItemPortfolio[] =
    item.obras && item.obras.length > 0
      ? item.obras
      : [
          {
            id: `${item.id}-fallback-1`,
            artistaId: item.artistaId,
            titulo: `${item.estilo} Autoral`,
            imagemUrl:
              'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
            estilo: item.estilo,
            preco: item.precoInicial,
          } as ItemPortfolio,
        ];

  const totalFotos = fotos.length;
  const fotoSeguraIndex = Math.min(Math.max(0, indiceAtivo), totalFotos - 1);
  const obraAtual = fotos[fotoSeguraIndex] || fotos[0];
  const totalCurtidas = (item.curtidas || 0) + (isCurtido ? 1 : 0);

  const onLayoutMidia = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== larguraMidia) setLarguraMidia(w);
  };

  const onScrollCarrossel = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!larguraMidia) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / larguraMidia);
    if (idx !== indiceAtivo) setIndiceAtivo(idx);
  };

  const irPara = (idx: number) => {
    const alvo = (idx + totalFotos) % totalFotos;
    scrollRef.current?.scrollTo({ x: alvo * larguraMidia, animated: true });
    setIndiceAtivo(alvo);
  };

  const pulsarBotaoCurtir = () => {
    likeBtnScale.setValue(0.6);
    Animated.spring(likeBtnScale, {
      toValue: 1,
      tension: 220,
      friction: 5,
      useNativeDriver: USE_NATIVE,
    }).start();
  };

  const animarCoracaoGrande = () => {
    heartScale.setValue(0.3);
    heartOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        tension: 180,
        friction: 5,
        useNativeDriver: USE_NATIVE,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 380,
        delay: 250,
        useNativeDriver: USE_NATIVE,
      }),
    ]).start();
  };

  const alternarCurtida = () => {
    pulsarBotaoCurtir();
    onCurtir(item.id);
  };

  const onToqueMidia = () => {
    const agora = Date.now();
    if (agora - ultimoToque.current < INTERVALO_DUPLO_TOQUE) {
      // Toque duplo → curtir
      if (timerToque.current) clearTimeout(timerToque.current);
      timerToque.current = null;
      ultimoToque.current = 0;
      animarCoracaoGrande();
      if (!isCurtido) {
        pulsarBotaoCurtir();
        onCurtir(item.id);
      }
      return;
    }
    ultimoToque.current = agora;
    timerToque.current = setTimeout(() => {
      timerToque.current = null;
      onAbrirPerfil(item, obraAtual);
    }, INTERVALO_DUPLO_TOQUE);
  };

  return (
    <View style={[styles.post, { height: altura }]} onLayout={onLayoutMidia}>
      {/* Carrossel de obras em tela cheia */}
      {larguraMidia > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScrollCarrossel}
          scrollEventThrottle={16}
          nestedScrollEnabled
          style={styles.carousel}
        >
          {fotos.map((obra) => (
            <Pressable
              key={obra.id}
              onPress={onToqueMidia}
              style={{ width: larguraMidia, height: altura }}
            >
              <Image source={{ uri: obra.imagemUrl }} style={styles.mediaImage} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Scrim direcao="top" altura={120} opacidadeMax={0.55} />
      <Scrim direcao="bottom" altura={Math.min(300, altura * 0.55)} opacidadeMax={0.85} />

      {/* Coração grande do toque duplo */}
      <Animated.View
        pointerEvents="none"
        style={[styles.bigHeart, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}
      >
        <Heart size={110} color={BRANCO} fill={BRANCO} />
      </Animated.View>

      {/* Topo: estilo + barras de progresso do carrossel */}
      <View style={styles.topOverlay} pointerEvents="box-none">
        {totalFotos > 1 && (
          <View style={styles.progressRow} pointerEvents="none">
            {fotos.map((_, i) => (
              <View
                key={i}
                style={[sobreFoto.progressBar, i === fotoSeguraIndex && styles.progressBarActive]}
              />
            ))}
          </View>
        )}
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={styles.styleChip} pointerEvents="none">
            <Sparkles size={11} color={tc('#f3c21a')} />
            <Text style={styles.styleChipText}>{obraAtual.estilo || item.estilo}</Text>
          </View>
          {item.distanciaFormatada ? (
            <View style={styles.distanceChip} pointerEvents="none">
              <MapPin size={11} color={tc('#000000')} />
              <Text style={styles.distanceChipText}>{item.distanciaFormatada}</Text>
            </View>
          ) : null}

          {/* Navegador do carrossel (fica no topo para não colidir com as ações laterais) */}
          {totalFotos > 1 && (
            <View style={sobreFoto.navPill}>
              <Pressable
                style={sobreFoto.navBtn}
                hitSlop={6}
                onPress={() => irPara(fotoSeguraIndex - 1)}
              >
                <ChevronLeft size={16} color={BRANCO} />
              </Pressable>
              <Text style={sobreFoto.navText}>
                {fotoSeguraIndex + 1}/{totalFotos}
              </Text>
              <Pressable
                style={sobreFoto.navBtn}
                hitSlop={6}
                onPress={() => irPara(fotoSeguraIndex + 1)}
              >
                <ChevronRight size={16} color={BRANCO} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Coluna lateral de ações (estilo TikTok) */}
      <View style={styles.sideActions}>
        <Pressable style={styles.sideAvatarBtn} onPress={() => onAbrirPerfil(item, obraAtual)}>
          {item.artistaFoto ? (
            <Image source={{ uri: item.artistaFoto }} style={styles.sideAvatar} />
          ) : (
            <View style={[styles.sideAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>{item.artistaNome?.[0] ?? 'D'}</Text>
            </View>
          )}
          <View style={styles.sideAvatarBadge}>
            <User size={10} color={tc('#000000')} />
          </View>
        </Pressable>

        <Pressable style={styles.sideAction} onPress={alternarCurtida} hitSlop={6}>
          <Animated.View style={{ transform: [{ scale: likeBtnScale }] }}>
            <Heart
              size={30}
              color={isCurtido ? tc('#f43f5e') : BRANCO}
              fill={isCurtido ? tc('#f43f5e') : 'rgba(0,0,0,0.15)'}
            />
          </Animated.View>
          <Text style={sobreFoto.sideActionText}>{totalCurtidas.toLocaleString('pt-BR')}</Text>
        </Pressable>

        <View style={styles.sideAction}>
          <Star size={28} color={tc('#f3c21a')} fill={tc('#f3c21a')} />
          <Text style={sobreFoto.sideActionText}>{item.notaMedia?.toFixed(1) ?? '5.0'}</Text>
        </View>
      </View>

      {/* Rodapé: artista, legenda, preço, CTA */}
      <View style={styles.bottomOverlay} pointerEvents="box-none">
        <Pressable style={styles.artistRow} onPress={() => onAbrirPerfil(item, obraAtual)}>
          <AvatarArtista uri={item.artistaFoto} nome={item.artistaNome} />
          <Text style={sobreFoto.artistName} numberOfLines={1}>
            {item.artistaNome}
          </Text>
          <ShieldCheck size={14} color="#10b981" />
        </Pressable>
        <Text style={sobreFoto.studioText} numberOfLines={1}>
          {item.estudioNome} • {item.cidade}
        </Text>

        <Text style={sobreFoto.captionText} numberOfLines={2}>
          {obraAtual.titulo || `${item.estilo} Autoral`}
          <Text style={styles.captionTag}>
            {'  '}#{(obraAtual.estilo || item.estilo).replace(/\s+/g, '')}
          </Text>
        </Text>

        <View style={styles.ctaRow}>
          {obraAtual.disponivel === true && obraAtual.preco != null ? (
            <View>
              <Text style={sobreFoto.priceLabel}>Flash disponível</Text>
              <Text style={styles.priceValue}>R$ {obraAtual.preco}</Text>
            </View>
          ) : <Text style={sobreFoto.studioText}>Conheça o trabalho do artista</Text>}
          <Pressable style={styles.ctaBtn} onPress={() => onAbrirPerfil(item, obraAtual)}>
            <Text style={styles.ctaText}>Ver perfil</Text>
          </Pressable>
        </View>

        {mostrarDicaDeslize && (
          <Animated.View
            pointerEvents="none"
            style={[styles.swipeHint, { transform: [{ translateY: dicaY }] }]}
          >
            <ChevronDown size={14} color="#d4d4d8" />
            <Text style={sobreFoto.swipeHintText}>Deslize para ver mais obras</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = createThemedStyles({
  post: {
    width: '100%',
    backgroundColor: '#0b0b0e',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  carousel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  bigHeart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressBarActive: {
    backgroundColor: '#f3c21a',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.45)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  styleChipText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f3c21a',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  distanceChipText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  sideActions: {
    position: 'absolute',
    right: 10,
    bottom: 150,
    alignItems: 'center',
    gap: 18,
  },
  sideAvatarBtn: {
    alignItems: 'center',
    marginBottom: 4,
  },
  sideAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#f3c21a',
  },
  avatarPlaceholder: {
    backgroundColor: '#262630',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sideAvatarBadge: {
    position: 'absolute',
    bottom: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#f3c21a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideAction: {
    alignItems: 'center',
    gap: 3,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    gap: 4,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  captionTag: {
    color: '#f3c21a',
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
  priceValue: {
    color: '#f3c21a',
    fontSize: 18,
    fontWeight: '900',
  },
  ctaBtn: {
    backgroundColor: '#f3c21a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
});

/**
 * Estilos de elementos que ficam SOBRE a foto (com degradê escuro por trás).
 * Usam StyleSheet puro para NÃO serem invertidos no modo claro — sobre uma
 * foto escurecida o texto precisa continuar claro em qualquer tema.
 */
const BRANCO = '#ffffff';

const sobreFoto = StyleSheet.create({
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  navPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: BRANCO,
    fontSize: 11,
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center',
  },
  sideActionText: {
    color: BRANCO,
    fontSize: 11,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  artistName: {
    color: BRANCO,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  studioText: {
    color: '#d4d4d8',
    fontSize: 12,
    maxWidth: '80%',
  },
  captionText: {
    color: '#f4f4f5',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '80%',
    marginTop: 2,
  },
  priceLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  swipeHintText: {
    color: '#d4d4d8',
    fontSize: 11,
    fontWeight: '600',
  },
});
