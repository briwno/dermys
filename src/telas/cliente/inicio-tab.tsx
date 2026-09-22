import {
  CartaoArtistaFeed,
  type ItemArtistaFeedData,
} from '@/components/cliente/cartao-artista-feed';
import { ModalFiltroLocalidade } from '@/components/cliente/modal-filtro-localidade';
import { ModalPerfilArtista } from '@/components/cliente/modal-perfil-artista';
import { ArtistaDetalhadoService } from '@/services/artista-detalhado-service';
import { LocalidadeService } from '@/services/localidade-service';
import { supabase } from '@/services/supabase';
import { ModalReservaCliente } from '@/telas/cliente/modal-reserva';
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
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const TATTOOS_PADRAO_POR_ESTILO: Record<string, { titulo: string; imagemUrl: string }[]> = {
  'Fine Line': [
    {
      titulo: 'Floral Botânico Fine Line',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Constelação & Fases Lunares',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Borboleta Micro-traço',
      imagemUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Ramo de Oliveira Geométrico',
      imagemUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76523?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Blackwork': [
    {
      titulo: 'Crânio Floral Blackwork',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Corvo & Adaga Escura',
      imagemUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Serpente Ouroboros Gravura',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Mandala Sombreada',
      imagemUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Realismo': [
    {
      titulo: 'Leão Sombreado Realista',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Retrato Micro-realismo',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Texturas em Pele',
      imagemUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Old School': [
    {
      titulo: 'Adaga & Rosa Tradicional',
      imagemUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Pantera Negra Classic',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Âncora & Andorinhas',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Oriental': [
    {
      titulo: 'Dragão Ryū & Nuvens',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Carpa Koi & Ondas',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Máscara Hannya & Flor',
      imagemUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Aquarela': [
    {
      titulo: 'Pássaro Fluido Aquarelado',
      imagemUrl: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Galáxia & Cores Vivas',
      imagemUrl: 'https://images.unsplash.com/photo-1590246814883-57c511e76523?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Água-viva & Pigmentos',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
  ],
  'Geek': [
    {
      titulo: 'Cyberpunk & Linhas Neon',
      imagemUrl: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Anime Shonen Traço Fino',
      imagemUrl: 'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?w=800&auto=format&fit=crop&q=80',
    },
    {
      titulo: 'Símbolo Gamer Gravura',
      imagemUrl: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=800&auto=format&fit=crop&q=80',
    },
  ],
};

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

interface PropsClienteInicioTab {
  onNavegarAba?: (aba: BottomNavTab) => void;
}

export function ClienteInicioTab({ onNavegarAba }: PropsClienteInicioTab) {
  const [consulta, setConsulta] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState<string>('Todos');
  const [artistasFeed, setArtistasFeed] = useState<ItemArtistaFeedData[]>([]);
  const [curtidos, setCurtidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

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
        .eq('tipo_perfil', 'artista');

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

      if (!errArtistas && artistasData) {
        const todosArtistas: ItemArtistaFeedData[] = [];

        artistasData.forEach((art: any) => {
          const reviewsDoArtista = reviewsPorArtista[art.id] || [];
          const estilo = art.estilo_principal || 'Fine Line';

          let obras: ItemPortfolio[] = [];

          // Garante fotos REAIS de tatuagem/portfólio (nunca selfie/foto de perfil)
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
            const padroes =
              TATTOOS_PADRAO_POR_ESTILO[estilo] || TATTOOS_PADRAO_POR_ESTILO['Fine Line'];
            obras = padroes.map((p, idx) => ({
              id: `${art.id}-padrao-${idx}`,
              artistaId: art.id,
              titulo: p.titulo,
              imagemUrl: p.imagemUrl,
              estilo: estilo,
              preco: Number(art.preco_inicial || 350),
              disponivel: true,
            }));
          }

          todosArtistas.push({
            id: art.id,
            artistaId: art.id,
            artistaNome: art.nome_exibicao || 'Artista Dermys',
            artistaFoto: art.foto_url, // estritamente para o mini-avatar de 20px
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
      }
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

  return (
    <View style={styles.container}>
      {/* Barra de Localização Minimalista & Contagem */}
      <View style={styles.topLocationRow}>
        <Pressable
          style={styles.locationChip}
          onPress={() => setModalLocalidadeAberto(true)}
        >
          <MapPin size={13} color="#f3c21a" />
          <Text style={styles.locationChipText} numberOfLines={1}>
            {localidade.cidade}, {localidade.estado}
            {localidade.raioKm ? ` • ${localidade.raioKm} km` : ' • Brasil'}
          </Text>
          <ChevronDown size={12} color="#888892" />
        </Pressable>

        <Text style={styles.feedCountPill}>{artistasFiltrados.length} artistas</Text>
      </View>

      {/* Barra de Busca Minimalista */}
      <View style={styles.searchWrap}>
        <Search size={15} color="#71717a" style={styles.searchIcon} />
        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar artista, estúdio ou estilo..."
          placeholderTextColor="#71717a"
          style={styles.searchInput}
        />
      </View>

      {/* Pílulas de Estilos */}
      <ScrollView
        horizontal
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

      {/* Feed Estilo Pinterest com Carrossel de Obras */}
      <View style={styles.feedSection}>
        <View style={styles.feedHeaderRow}>
          <Text style={styles.feedTitle}>Explorar Trabalhos & Portfólios</Text>
          <Text style={styles.feedCountText}>{artistasFiltrados.length} artistas</Text>
        </View>

        {carregando ? (
          <ActivityIndicator color="#f3c21a" style={{ marginVertical: 40 }} />
        ) : (
          <FlatList
            data={artistasFiltrados}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <CartaoArtistaFeed
                item={item}
                isCurtido={curtidos[item.id]}
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
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Compass size={32} color="#71717a" style={{ marginBottom: 8 }} />
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
                    <Globe size={14} color="#000" />
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
            onNavegarAba('chat');
          }
        }}
      />

      {/* MODAL: RESERVA & CHECKOUT MERCADO PAGO */}
      <ModalReservaCliente
        visivel={modalReservaAberto}
        artista={artistaParaReserva}
        flashInicial={flashSelecionado}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
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
    gap: 8,
    marginTop: 4,
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
  columnWrap: {
    justifyContent: 'space-between',
    gap: 10,
  },
  gridContent: {
    gap: 10,
    paddingBottom: 24,
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
