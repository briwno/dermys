import { PORTFOLIOS_DEMONSTRACAO, filtrarObrasDemonstracao } from '@/dados/portfolio-demonstracao';
import {
  CartaoArtistaFeed,
  type ItemArtistaFeedData,
} from '@/components/cliente/cartao-artista-feed';
import { ModalFiltroLocalidade } from '@/components/cliente/modal-filtro-localidade';
import { FeedMosaico } from '@/components/cliente/feed-mosaico';
import { montarPostsObras } from '@/components/cliente/obras-feed';
import { IDS_ARTISTAS_VITRINE } from '@/dados/artistas-vitrine';
import { ModalPerfilArtista } from '@/components/cliente/modal-perfil-artista';
import { ArtistaDetalhadoService } from '@/services/artista-detalhado-service';
import { LocalidadeService } from '@/services/localidade-service';
import { supabase } from '@/services/supabase';
import { ModalReservaCliente } from '@/telas/cliente/modal-reserva';
import { PortfolioService } from '@/services/portfolio-service';
import type { ItemPortfolio, PerfilArtistaCompleto } from '@/types/artista-detalhado';
import type { LocalidadeUsuario } from '@/types/localidade';
import type { BottomNavTab } from '@/components/bottom-nav';
import {
  Calendar,
  ChevronDown,
  Compass,
  Flame,
  Globe,
  Heart,
  LayoutGrid,
  GalleryVerticalEnd,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createThemedStyles, tc } from '@/theme';

/** Espaço vertical entre um post e outro dentro de cada página do feed */
const ESPACO_ENTRE_POSTS = 10;

export interface CartaoArtista {
  id: string;
  nomeArtista: string;
  nomeEstudio: string;
  enderecoEstudio?: string;
  estilo: string;
  cidade: string;
  curtidas: number;
  precoInicial: number;
  fotoUrl?: string;
  capaUrl?: string;
  biografia?: string;
  rawArtista?: any;
  rawFlashes?: any[];
  rawReviews?: any[];
}

const TAGS = [
  'Todos',
  'Fine Line',
  'Blackwork',
  'Realismo',
  'Old School',
  'Aquarela',
  'Geek',
  'Oriental',
];

import type { PerfilUsuario } from '@/types/auth';

interface PropsClienteInicioTab {
  onNavegarAba?: (aba: BottomNavTab, contatoId?: string) => void;
  perfil?: PerfilUsuario | null;
}

export function ClienteInicioTab({ onNavegarAba, perfil }: PropsClienteInicioTab) {
  const [consulta, setConsulta] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState<string>('Todos');
  const [artistasFeed, setArtistasFeed] = useState<ItemArtistaFeedData[]>([]);
  const [curtidos, setCurtidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [alturaFeed, setAlturaFeed] = useState(0);
  const [modoFeed, setModoFeed] = useState<'mosaico' | 'deslizar'>('deslizar');

  const onLayoutFeed = useCallback((e: LayoutChangeEvent) => {
    const h = Math.floor(e.nativeEvent.layout.height);
    setAlturaFeed((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);

  // Estado de Localidade & Geofence
  const [localidade, setLocalidade] = useState<LocalidadeUsuario>(
    LocalidadeService.obterLocalidadePadrao()
  );
  const [modalLocalidadeAberto, setModalLocalidadeAberto] = useState(false);

  // Estados dos Modais
  const [perfilArtistaAberto, setPerfilArtistaAberto] = useState<PerfilArtistaCompleto | null>(null);
  const [flashSelecionado, setFlashSelecionado] = useState<ItemPortfolio | null>(null);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);

  const [artistaParaReserva, setArtistaParaReserva] = useState<CartaoArtista | null>(null);
  const [modalReservaAberto, setModalReservaAberto] = useState(false);

  useEffect(() => {
    carregarDados();
    inicializarLocalidade();
  }, []);

  const inicializarLocalidade = async () => {
    try {
      const salva = await LocalidadeService.carregarLocalidadeSalva();
      setLocalidade(salva);
    } catch {
      // silencioso
    }
  };

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // 1. Carrega Artistas e seus flashes/portfólios
      const { data: artistasData, error: errArtistas } = await supabase
        .from('profiles')
        .select(`
          *,
          flashes:flashes_portfolio(*)
        `)
        .eq('tipo_perfil', 'artista')
        .in('id', IDS_ARTISTAS_VITRINE);

      // 2. Carrega todas as avaliações reais de clientes
      const { data: reviewsData } = await supabase
        .from('avaliacoes')
        .select('*')
        .order('criado_em', { ascending: false });

      const reviewsPorArtista: Record<string, any[]> = {};
      if (reviewsData && Array.isArray(reviewsData)) {
        reviewsData.forEach((rev) => {
          if (!reviewsPorArtista[rev.artista_id]) {
            reviewsPorArtista[rev.artista_id] = [];
          }
          reviewsPorArtista[rev.artista_id].push(rev);
        });
      }

      const obrasCustomizadas = await PortfolioService.obterObrasParaFeed();

      // Lista base de artistas: do Supabase ou das personas configuradas
      let listaArtistasBase = artistasData && !errArtistas && artistasData.length > 0 ? artistasData : [
        {
          id: '11111111-1111-1111-1111-111111111111',
          nome_exibicao: 'Camila Rossi',
          foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          nome_estudio: 'Aura Tatuaria & Botânica',
          endereco_estudio: 'Rua Harmonia, 412 - Vila Madalena',
          cidade: 'São Paulo, SP (Vila Madalena)',
          estilo_principal: 'Fine Line',
          preco_inicial: 350,
          curtidas: 240,
          latitude: -23.5505,
          longitude: -46.6885,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          nome_exibicao: 'Leonardo Black',
          foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
          nome_estudio: 'Nômade Blackwork Studio',
          endereco_estudio: 'Rua Fradique Coutinho, 890 - Pinheiros',
          cidade: 'São Paulo, SP (Pinheiros)',
          estilo_principal: 'Blackwork',
          preco_inicial: 500,
          curtidas: 310,
          latitude: -23.5601,
          longitude: -46.6902,
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          nome_exibicao: 'Maya Silveira',
          foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
          nome_estudio: 'Cromia Studio Art',
          endereco_estudio: 'Av. Paulista, 1000 - Bela Vista',
          cidade: 'São Paulo, SP (Bela Vista)',
          estilo_principal: 'Aquarela',
          preco_inicial: 400,
          curtidas: 180,
          latitude: -23.5654,
          longitude: -46.6512,
        },
      ];

      const todosArtistas: ItemArtistaFeedData[] = [];

      listaArtistasBase.forEach((art: any) => {
        const reviewsDoArtista = reviewsPorArtista[art.id] || [];
        const estilo = art.estilo_principal || 'Fine Line';

        let obras: ItemPortfolio[] = [];

        // 1. Fotos cadastradas em flashes
        if (art.flashes && Array.isArray(art.flashes) && art.flashes.length > 0) {
          obras = art.flashes.map((f: any) => ({
            id: f.id,
            artistaId: art.id,
            titulo: f.titulo || `${estilo} Autoral`,
            imagemUrl: f.imagem_url,
            estilo: f.estilo || estilo,
            preco: Number(f.preco || art.preco_inicial || 350),
            disponivel: f.disponivel ?? true,
          }));
        } else {
          obras = PORTFOLIOS_DEMONSTRACAO[art.id] || [];
        }

        // 2. Mescla fotos adicionadas pelo próprio tatuador via perfil
        const adicionadasDesteArtista = obrasCustomizadas[art.id] || [];
        if (adicionadasDesteArtista.length > 0) {
          obras = [...adicionadasDesteArtista, ...obras];
        }

        obras = filtrarObrasDemonstracao(art.id, obras);

        todosArtistas.push({
          id: art.id,
          artistaId: art.id,
          artistaNome: art.nome_exibicao || 'Artista Dermys',
          artistaFoto: art.foto_url,
          estudioNome: art.nome_estudio || 'Estúdio Particular',
          cidade: art.cidade || 'São Paulo, SP',
          estilo: estilo,
          precoInicial: Number(art.preco_inicial || 350),
          curtidas: Number(art.curtidas || 120),
          notaMedia: 4.9,
          obras,
          rawArtista: art,
          rawFlashes: art.flashes || [],
          rawReviews: reviewsDoArtista,
        });
      });

      setArtistasFeed(todosArtistas);
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  const alternarCurtida = (id: string) => {
    setCurtidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /**
   * Abre o resumo do tatuador ao tocar em qualquer obra do feed
   */
  const abrirResumoArtista = (
    artistaRaw: any,
    flashesRaw: any[] = [],
    reviewsRaw: any[] = [],
    flashItem?: any
  ) => {
    const perfilCompleto = ArtistaDetalhadoService.montarPerfilCompleto(
      artistaRaw,
      flashesRaw,
      reviewsRaw,
      { latitude: localidade.latitude, longitude: localidade.longitude }
    );
    setPerfilArtistaAberto(perfilCompleto);
    setFlashSelecionado(flashItem || null);
    setModalPerfilAberto(true);
  };

  const iniciarReservaDireta = (artista: PerfilArtistaCompleto, flash?: ItemPortfolio) => {
    setModalPerfilAberto(false);
    setArtistaParaReserva({
      id: artista.id,
      nomeArtista: artista.nomeArtista,
      nomeEstudio: artista.nomeEstudio,
      enderecoEstudio: artista.enderecoEstudio,
      estilo: artista.estilo,
      cidade: artista.cidade,
      curtidas: artista.curtidas,
      precoInicial: flash?.preco || artista.precoInicial,
      fotoUrl: artista.fotoUrl,
      capaUrl: flash?.imagemUrl || artista.capaUrl,
      biografia: artista.biografia,
    });
    setModalReservaAberto(true);
  };

  // 1. Calcula distâncias geográficas Haversine para todos os artistas
  const artistasComDistancia = useMemo(() => {
    return artistasFeed.map((item) => {
      let distanciaKm: number | undefined = undefined;
      let distanciaFormatada: string | undefined = undefined;

      const lat = item.rawArtista?.latitude ? Number(item.rawArtista.latitude) : undefined;
      const lon = item.rawArtista?.longitude ? Number(item.rawArtista.longitude) : undefined;

      if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
        distanciaKm = LocalidadeService.calcularDistanciaKm(
          localidade.latitude,
          localidade.longitude,
          lat,
          lon
        );
        distanciaFormatada = LocalidadeService.formatarDistancia(distanciaKm);
      }

      return {
        ...item,
        distanciaKm,
        distanciaFormatada,
      };
    });
  }, [artistasFeed, localidade.latitude, localidade.longitude]);

  // 2. Filtros de raio de busca, estilos, texto e ordenação inteligente
  const artistasFiltrados = useMemo(() => {
    let resultado = artistasComDistancia;

    // Filtro por raio de distância em KM
    if (localidade.raioKm !== null) {
      resultado = resultado.filter(
        (item) => item.distanciaKm !== undefined && item.distanciaKm <= (localidade.raioKm || 50)
      );
    }

    // Filtro por tag de estilo
    if (tagSelecionada !== 'Todos') {
      resultado = resultado.filter(
        (item) => item.estilo.toLowerCase() === tagSelecionada.toLowerCase()
      );
    }

    // Filtro por busca textual
    if (consulta.trim()) {
      const busca = consulta.trim().toLowerCase();
      resultado = resultado.filter(
        (item) =>
          item.artistaNome.toLowerCase().includes(busca) ||
          item.estudioNome.toLowerCase().includes(busca) ||
          item.estilo.toLowerCase().includes(busca) ||
          item.cidade.toLowerCase().includes(busca) ||
          item.obras.some((o) => o.titulo.toLowerCase().includes(busca))
      );
    }

    // Ordenação configurada
    const ordenacao = localidade.ordenacao || 'distancia';
    return [...resultado].sort((a, b) => {
      if (ordenacao === 'distancia') {
        const distA = a.distanciaKm ?? 999999;
        const distB = b.distanciaKm ?? 999999;
        return distA - distB;
      }
      if (ordenacao === 'avaliacoes') {
        return (b.notaMedia || 0) - (a.notaMedia || 0);
      }
      if (ordenacao === 'populares') {
        return (b.curtidas || 0) - (a.curtidas || 0);
      }
      if (ordenacao === 'preco') {
        return (a.precoInicial || 0) - (b.precoInicial || 0);
      }
      return 0;
    });
  }, [artistasComDistancia, localidade.raioKm, localidade.ordenacao, tagSelecionada, consulta]);

  const postsObras = useMemo(() => montarPostsObras(artistasFiltrados), [artistasFiltrados]);

  return (
    <View style={styles.container}>
      {/* Barra de Localização Minimalista & Contagem */}
      <View style={styles.topLocationRow}>
        <Pressable
          style={styles.locationChip}
          onPress={() => setModalLocalidadeAberto(true)}
        >
          <MapPin size={13} color={tc('#f3c21a')} />
          <Text style={styles.locationChipText} numberOfLines={1}>
            {localidade.cidade}, {localidade.estado}
            {localidade.raioKm ? ` • ${localidade.raioKm} km` : ' • Brasil'}
          </Text>
          <ChevronDown size={12} color={tc('#888892')} />
        </Pressable>

        <Text style={styles.feedCountPill}>
          {artistasFiltrados.length} artistas · {postsObras.length} obras
        </Text>
      </View>

      {/* Barra de Busca Minimalista */}
      <View style={styles.searchWrap}>
        <Search size={15} color={tc('#71717a')} style={styles.searchIcon} />
        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar artista, estúdio ou estilo..."
          placeholderTextColor={tc('#71717a')}
          style={styles.searchInput}
        />
      </View>

      {/* Pílulas de Estilos */}
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsRow}
      >
        {TAGS.map((tag) => {
          const ativo = tagSelecionada === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => setTagSelecionada(tag)}
              style={[styles.tag, ativo ? styles.tagActive : styles.tagIdle]}
            >
              <Text style={[styles.tagText, ativo ? styles.tagTextActive : styles.tagTextIdle]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.modeSelector} accessibilityRole="tablist">
        {(['mosaico', 'deslizar'] as const).map((modo) => {
          const ativo = modoFeed === modo;
          const Icone = modo === 'mosaico' ? LayoutGrid : GalleryVerticalEnd;
          return (
            <Pressable
              key={modo}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={modo === 'mosaico' ? 'Ver feed em mosaico' : 'Ver feed deslizando'}
              onPress={() => setModoFeed(modo)}
              style={[styles.modeButton, ativo && styles.modeButtonActive]}
            >
              <Icone size={16} color={tc(ativo ? '#000000' : '#a1a1aa')} />
              <Text style={[styles.modeText, ativo && styles.modeTextActive]}>
                {modo === 'mosaico' ? 'Mosaico' : 'Deslizar'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Os dois modos compartilham filtros, curtidas e abertura da obra. */}
      <View style={styles.feedSection} onLayout={onLayoutFeed}>
        {carregando || alturaFeed === 0 ? (
          <ActivityIndicator color={tc('#f3c21a')} style={{ marginVertical: 40 }} />
        ) : modoFeed === 'mosaico' && postsObras.length > 0 ? (
          <FeedMosaico
            artistas={artistasFiltrados}
            curtidos={curtidos}
            onCurtir={alternarCurtida}
            onAbrirPerfil={(artista, obra) => abrirResumoArtista(
              artista.rawArtista, artista.rawFlashes, artista.rawReviews, obra
            )}
          />
        ) : (
          <FlatList
            key={`${modoFeed}:${alturaFeed}:${tagSelecionada}:${consulta}:${localidade.raioKm}:${localidade.ordenacao}`}
            data={postsObras}
            extraData={curtidos}
            keyExtractor={(item) => item.id}
            pagingEnabled={Platform.OS === 'web'}
            snapToInterval={alturaFeed}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: alturaFeed,
              offset: alturaFeed * index,
              index,
            })}
            windowSize={3}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            renderItem={({ item: post, index }) => (
              <View style={{ height: alturaFeed, paddingBottom: ESPACO_ENTRE_POSTS }}>
                <CartaoArtistaFeed
                  item={{ ...post.artista, obras: [post.obra] }}
                  altura={alturaFeed - ESPACO_ENTRE_POSTS}
                  isCurtido={curtidos[post.artista.id]}
                  mostrarDicaDeslize={index === 0 && postsObras.length > 1}
                  onCurtir={alternarCurtida}
                  onAbrirPerfil={(artItem, obra) =>
                    abrirResumoArtista(
                      artItem.rawArtista,
                      artItem.rawFlashes,
                      artItem.rawReviews,
                      obra
                    )
                  }
                />
              </View>
            )}
            ListFooterComponent={postsObras.length > 0 ? (
              <Text style={styles.feedEnd}>
                Você viu todas as {postsObras.length} obras. Explore outros estilos ou amplie a região.
              </Text>
            ) : null}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Compass size={32} color={tc('#71717a')} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>Nenhum tatuador encontrado neste raio</Text>
                <Text style={styles.emptyText}>
                  {localidade.raioKm
                    ? `Não encontramos artistas cadastrados a menos de ${localidade.raioKm} km de ${localidade.cidade}.`
                    : 'Não encontramos tatuadores para os filtros selecionados.'}
                </Text>

                {localidade.raioKm !== null && (
                  <Pressable
                    style={styles.btnExpandirRaio}
                    onPress={() => {
                      const expandida: LocalidadeUsuario = {
                        ...localidade,
                        raioKm: null,
                      };
                      setLocalidade(expandida);
                      LocalidadeService.salvarLocalidade(expandida);
                    }}
                  >
                    <Globe size={14} color={tc('#000')} />
                    <Text style={styles.btnExpandirRaioText}>Ver Tatuadores em Todo o Brasil</Text>
                  </Pressable>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* MODAL: FILTRO REGIONAL DE LOCALIDADE, DISTÂNCIA & ORDENAÇÃO */}
      <ModalFiltroLocalidade
        visivel={modalLocalidadeAberto}
        localidadeAtual={localidade}
        onClose={() => setModalLocalidadeAberto(false)}
        onAplicar={(novaLocalidade) => setLocalidade(novaLocalidade)}
      />

      {/* MODAL: RESUMO DO TATUADOR COM REVIEWS REAIS, PORTFÓLIO E ESTÚDIO */}
      <ModalPerfilArtista
        visivel={modalPerfilAberto}
        perfil={perfilArtistaAberto}
        flashInicial={flashSelecionado}
        onClose={() => setModalPerfilAberto(false)}
        onIniciarAgendamento={(art, flash) => iniciarReservaDireta(art, flash)}
        onAbrirChat={(art) => {
          if (onNavegarAba) {
            onNavegarAba('chat', art.id);
          }
        }}
      />

      {/* MODAL: BRIEFING & RESERVA DE PROJETO */}
      <ModalReservaCliente
        visivel={modalReservaAberto}
        artista={artistaParaReserva}
        flashInicial={flashSelecionado}
        perfilAtual={perfil}
        onClose={() => {
          setModalReservaAberto(false);
          setFlashSelecionado(null);
        }}
        onSucesso={() => {
          setModalReservaAberto(false);
          setFlashSelecionado(null);
          if (onNavegarAba) {
            onNavegarAba('bookings');
          }
        }}
        onRedirecionarChat={(artistaId) => {
          setModalReservaAberto(false);
          setFlashSelecionado(null);
          if (onNavegarAba) {
            onNavegarAba('chat', artistaId);
          }
        }}
      />
    </View>
  );
}

const styles = createThemedStyles({
  feedEnd: { color: '#8e8e93', fontSize: 12, textAlign: 'center', padding: 20 },
  modeSelector: {
    flexDirection: 'row', backgroundColor: '#0f0f12', borderRadius: 12,
    padding: 4, gap: 4,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, minHeight: 44, borderRadius: 9,
  },
  modeButtonActive: { backgroundColor: '#f3c21a' },
  modeText: { color: '#a1a1aa', fontSize: 12, fontWeight: '800' },
  modeTextActive: { color: '#000000' },
  container: {
    flex: 1,
    gap: 10,
  },
  topLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  locationChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  feedCountPill: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#0f0f12',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 13,
    paddingLeft: 38,
    paddingRight: 14,
    height: 42,
  },
  tagsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  tagIdle: {
    backgroundColor: '#0f0f12',
    borderColor: '#1e1e24',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextActive: {
    color: '#000000',
  },
  tagTextIdle: {
    color: '#8e8e93',
  },
  feedSection: {
    flex: 1,
    minHeight: 0,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  feedTitle: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  feedCountText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600',
  },
  gridContent: {
    gap: 20,
    paddingBottom: 32,
  },
  emptyWrap: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f13',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e26',
    marginVertical: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  btnExpandirRaio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  btnExpandirRaioText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
});
