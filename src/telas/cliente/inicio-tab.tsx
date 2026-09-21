import { supabase } from '@/services/supabase';
import { ModalReservaCliente } from '@/telas/cliente/modal-reserva';
import {
  Calendar,
  Flame,
  Heart,
  MapPin,
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

export interface ItemFlashFeed {
  id: string;
  artistaId: string;
  artistaNome: string;
  titulo: string;
  imagemUrl: string;
  estilo: string;
  preco: number;
  disponivel: boolean;
  estudioNome?: string;
  cidade?: string;
}

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
}

const TAGS = ['Todos', 'Fine Line', 'Blackwork', 'Realismo', 'Old School', 'Aquarela', 'Geek', 'Oriental'];

export function ClienteInicioTab() {
  const [consulta, setConsulta] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState<string>('Todos');
  const [artistas, setArtistas] = useState<CartaoArtista[]>([]);
  const [flashes, setFlashes] = useState<ItemFlashFeed[]>([]);
  const [curtidos, setCurtidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  // Reserva de Horário
  const [artistaSelecionado, setArtistaSelecionado] = useState<CartaoArtista | null>(null);
  const [modalReservaAberto, setModalReservaAberto] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // 1. Carrega Artistas e seus flashes
      const { data: artistasData, error: errArtistas } = await supabase
        .from('profiles')
        .select(`
          *,
          flashes:flashes_portfolio(*)
        `)
        .eq('tipo_perfil', 'artista');

      if (!errArtistas && artistasData) {
        const formatados: CartaoArtista[] = artistasData.map((item: any) => {
          const primeiroFlash = item.flashes?.[0]?.imagem_url;
          return {
            id: item.id,
            nomeArtista: item.nome_exibicao || 'Artista Dermys',
            nomeEstudio: item.nome_estudio || 'Estúdio Particular',
            enderecoEstudio: item.endereco_estudio,
            estilo: item.estilo_principal || 'Fine Line',
            cidade: item.cidade || 'São Paulo, SP',
            curtidas: Number(item.curtidas || 0),
            precoInicial: Number(item.preco_inicial || 350),
            fotoUrl: item.foto_url,
            capaUrl: primeiroFlash || item.foto_url,
            biografia: item.biografia,
          };
        });
        setArtistas(formatados);

        // 2. Extrai Flashes para a vitrine
        const todosFlashes: ItemFlashFeed[] = [];
        artistasData.forEach((art: any) => {
          if (art.flashes && Array.isArray(art.flashes)) {
            art.flashes.forEach((f: any) => {
              todosFlashes.push({
                id: f.id,
                artistaId: art.id,
                artistaNome: art.nome_exibicao,
                estudioNome: art.nome_estudio,
                cidade: art.cidade,
                titulo: f.titulo,
                imagemUrl: f.imagem_url,
                estilo: f.estilo || art.estilo_principal,
                preco: Number(f.preco || 400),
                disponivel: f.disponivel ?? true,
              });
            });
          }
        });
        setFlashes(todosFlashes);
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

  const iniciarReserva = (artista: CartaoArtista) => {
    setArtistaSelecionado(artista);
    setModalReservaAberto(true);
  };

  const reservarPeloFlash = (flash: ItemFlashFeed) => {
    const art = artistas.find((a) => a.id === flash.artistaId);
    if (art) {
      setArtistaSelecionado(art);
      setModalReservaAberto(true);
    }
  };

  const cartoesFiltrados = useMemo(() => {
    const porTag =
      tagSelecionada === 'Todos'
        ? artistas
        : artistas.filter(
            (item) => item.estilo.toLowerCase() === tagSelecionada.toLowerCase()
          );

    if (!consulta.trim()) {
      return porTag;
    }

    const busca = consulta.trim().toLowerCase();

    return porTag.filter((item) => {
      const nomeArtista = item.nomeArtista.toLowerCase();
      const estilo = item.estilo.toLowerCase();
      const cidade = item.cidade.toLowerCase();
      const nomeEstudio = item.nomeEstudio.toLowerCase();

      return (
        nomeArtista.includes(busca) ||
        estilo.includes(busca) ||
        cidade.includes(busca) ||
        nomeEstudio.includes(busca)
      );
    });
  }, [artistas, consulta, tagSelecionada]);

  const flashesFiltrados = useMemo(() => {
    if (tagSelecionada === 'Todos') return flashes;
    return flashes.filter(
      (f) => f.estilo.toLowerCase() === tagSelecionada.toLowerCase()
    );
  }, [flashes, tagSelecionada]);

  return (
    <View style={styles.container}>
      {/* Input de Busca com Ícone */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar por tatuador, estúdio, estilo ou cidade"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
        />
      </View>

      {/* Linha de Tags de Estilos */}
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

      {/* Carrossel de Flashes Autorais Disponíveis */}
      {flashesFiltrados.length > 0 && !consulta && (
        <View style={styles.flashSection}>
          <View style={styles.flashSectionHeader}>
            <View style={styles.rowAlign}>
              <Flame size={16} color="#f3c21a" />
              <Text style={styles.flashSectionTitle}>Flashes Autorais Disponíveis</Text>
            </View>
            <Text style={styles.flashCountBadge}>{flashesFiltrados.length} artes</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flashScrollContent}
          >
            {flashesFiltrados.map((flash) => (
              <Pressable
                key={flash.id}
                style={styles.flashCard}
                onPress={() => reservarPeloFlash(flash)}
              >
                <Image source={{ uri: flash.imagemUrl }} style={styles.flashImage} />
                <View style={styles.flashBadgeOverlay}>
                  <Text style={styles.flashEstiloTag}>{flash.estilo}</Text>
                </View>

                <View style={styles.flashCardBody}>
                  <Text style={styles.flashTitle} numberOfLines={1}>
                    {flash.titulo}
                  </Text>
                  <Text style={styles.flashArtistName} numberOfLines={1}>
                    por {flash.artistaNome}
                  </Text>
                  <View style={styles.flashFooter}>
                    <Text style={styles.flashPrice}>R$ {flash.preco.toFixed(2)}</Text>
                    <View style={styles.flashBookTag}>
                      <Text style={styles.flashBookTagText}>Garantir Flash</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Grid de Estúdios & Tatuadores */}
      <View style={styles.artistsSectionHeader}>
        <View style={styles.rowAlign}>
          <Sparkles size={16} color="#f3c21a" />
          <Text style={styles.flashSectionTitle}>Tatuadores & Estúdios em Destaque</Text>
        </View>
        <Text style={styles.flashCountBadge}>{cartoesFiltrados.length} encontrados</Text>
      </View>

      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginVertical: 30 }} />
      ) : (
        <FlatList
          data={cartoesFiltrados}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item, index }) => {
            const isFav = curtidos[item.id];
            const curtidasTotal = item.curtidas + (isFav ? 1 : 0);

            return (
              <Pressable
                style={[styles.card, index % 3 === 0 ? styles.cardTall : styles.cardShort]}
                onPress={() => iniciarReserva(item)}
              >
                {/* Imagem de Capa do Portfólio / Flash */}
                <View style={styles.cardImageWrap}>
                  <Image
                    source={{
                      uri:
                        item.capaUrl ||
                        item.fotoUrl ||
                        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=500&auto=format&fit=crop&q=80',
                    }}
                    style={styles.cardImage}
                  />

                  {/* Badge de Estilo */}
                  <View style={styles.styleBadge}>
                    <Text style={styles.styleBadgeText}>{item.estilo}</Text>
                  </View>

                  {/* Botão de Curtida */}
                  <Pressable
                    style={styles.likeIconBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      alternarCurtida(item.id);
                    }}
                  >
                    <Heart
                      size={15}
                      color={isFav ? '#f43f5e' : '#fff'}
                      fill={isFav ? '#f43f5e' : 'rgba(0,0,0,0.5)'}
                    />
                  </Pressable>
                </View>

                {/* Dados do Artista e Estúdio */}
                <View style={styles.cardContent}>
                  <View style={styles.artistNameRow}>
                    <Text style={styles.artistName} numberOfLines={1}>
                      {item.nomeArtista}
                    </Text>
                    <ShieldCheck size={13} color="#10b981" />
                  </View>

                  <Text style={styles.studioName} numberOfLines={1}>
                    {item.nomeEstudio}
                  </Text>

                  <View style={styles.cityRow}>
                    <MapPin size={11} color="#6b7280" />
                    <Text style={styles.cityText} numberOfLines={1}>
                      {item.cidade}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>A partir de</Text>
                      <Text style={styles.priceText}>R$ {item.precoInicial}</Text>
                    </View>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() => iniciarReserva(item)}
                    >
                      <Calendar size={11} color="#111" />
                      <Text style={styles.bookBtnText}>Reservar</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                Nenhum artista ou estúdio encontrado para este filtro.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Reserva de Horário */}
      <ModalReservaCliente
        visivel={modalReservaAberto}
        artista={artistaSelecionado}
        onClose={() => setModalReservaAberto(false)}
        onSucesso={() => {
          // Callback ao concluir agendamento
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
    minHeight: 48,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    color: '#fff',
    paddingLeft: 42,
    paddingRight: 14,
    fontSize: 13,
  },
  tagsRow: {
    gap: 8,
    paddingRight: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  tagIdle: {
    backgroundColor: '#101010',
    borderColor: '#222222',
  },
  tagText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  tagTextActive: {
    color: '#111',
  },
  tagTextIdle: {
    color: '#a1a1aa',
  },
  flashSection: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 12,
    gap: 10,
  },
  flashSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flashSectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flashCountBadge: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
  },
  flashScrollContent: {
    gap: 10,
  },
  flashCard: {
    width: 170,
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  flashImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#222',
  },
  flashBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  flashEstiloTag: {
    color: '#f3c21a',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  flashCardBody: {
    padding: 8,
    gap: 2,
  },
  flashTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  flashArtistName: {
    color: '#888',
    fontSize: 10,
  },
  flashFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 4,
  },
  flashPrice: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '900',
  },
  flashBookTag: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashBookTagText: {
    color: '#f3c21a',
    fontSize: 8,
    fontWeight: '900',
  },
  artistsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  gridContent: {
    gap: 12,
    paddingBottom: 30,
  },
  columnWrap: {
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#101010',
    overflow: 'hidden',
  },
  cardTall: {
    minHeight: 255,
  },
  cardShort: {
    minHeight: 240,
  },
  cardImageWrap: {
    height: 125,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1a1a1a',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  styleBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  styleBadgeText: {
    color: '#f3c21a',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  likeIconBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 999,
    padding: 5,
  },
  cardContent: {
    padding: 10,
    gap: 4,
    flex: 1,
    justifyContent: 'space-between',
  },
  artistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  artistName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  studioName: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    color: '#6b7280',
    fontSize: 10,
  },
  cardFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 6,
    gap: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#6b7280',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceText: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '900',
  },
  bookBtn: {
    backgroundColor: '#f3c21a',
    borderRadius: 6,
    height: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  bookBtnText: {
    color: '#111',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
});
