import { supabase } from '@/services/supabase';
import { Heart, MapPin, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export interface CartaoArtista {
  id: string;
  nomeArtista: string;
  nomeEstudio: string;
  estilo: string;
  cidade: string;
  curtidas: number;
  precoInicial: number;
}

const TAGS = ['Fine Line', 'Blackwork', 'Realismo', 'Old School', 'Aquarela', 'Geek'];

export function ClienteInicioTab() {
  const [consulta, setConsulta] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState<string>('Todos');
  const [artistas, setArtistas] = useState<CartaoArtista[]>([]);
  const [curtidos, setCurtidos] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarArtistas();
  }, []);

  const carregarArtistas = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tipo_perfil', 'artista');

      if (!error && data) {
        const formatados: CartaoArtista[] = data.map((item: any) => ({
          id: item.id,
          nomeArtista: item.nome_exibicao || 'Artista',
          nomeEstudio: item.nome_estudio || 'Estúdio Particular',
          estilo: item.estilo_principal || 'Fine Line',
          cidade: item.cidade || 'São Paulo, SP',
          curtidas: Number(item.curtidas || 0),
          precoInicial: Number(item.preco_inicial || 350),
        }));
        setArtistas(formatados);
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

  const cartoes = useMemo(() => {
    const porTag =
      tagSelecionada === 'Todos'
        ? artistas
        : artistas.filter((item) => item.estilo.toLowerCase() === tagSelecionada.toLowerCase());

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

  return (
    <View style={styles.container}>
      {/* Input de Busca com Ícone */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar por artista, estilo ou cidade"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
        />
      </View>

      {/* Linha de Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
        {['Todos', ...TAGS].map((tag) => {
          const ativo = tagSelecionada === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => setTagSelecionada(tag)}
              style={[styles.tag, ativo ? styles.tagActive : styles.tagIdle]}
            >
              <Text style={[styles.tagText, ativo ? styles.tagTextActive : styles.tagTextIdle]}>{tag}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Grid de Cards */}
      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={cartoes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item, index }) => {
            const isFav = curtidos[item.id];
            const curtidasTotal = item.curtidas + (isFav ? 1 : 0);

            return (
              <View style={[styles.card, index % 3 === 0 ? styles.cardTall : styles.cardShort]}>
                <View style={styles.imageMock}>
                  <Text style={styles.imageMockText}>{item.estilo}</Text>
                  <Pressable style={styles.likeIconBtn} onPress={() => alternarCurtida(item.id)}>
                    <Heart size={16} color={isFav ? '#f43f5e' : '#6b7280'} fill={isFav ? '#f43f5e' : 'transparent'} />
                  </Pressable>
                </View>
                <Text style={styles.artistName} numberOfLines={1}>{item.nomeArtista}</Text>
                <Text style={styles.metaText} numberOfLines={1}>{item.nomeEstudio}</Text>
                <View style={styles.cityRow}>
                  <MapPin size={11} color="#6b7280" />
                  <Text style={styles.metaText} numberOfLines={1}>{item.cidade}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.likesText}>{curtidasTotal} curtidas</Text>
                  <Text style={styles.priceText}>A partir de R$ {item.precoInicial}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhum artista encontrado para esta busca.</Text>
            </View>
          }
        />
      )}
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
    minHeight: 52,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 14,
    color: '#fff',
    paddingLeft: 42,
    paddingRight: 14,
    fontSize: 14,
  },
  tagsRow: {
    gap: 8,
    paddingRight: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  tagIdle: {
    backgroundColor: '#101010',
    borderColor: '#202020',
  },
  tagText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tagTextActive: {
    color: '#111',
  },
  tagTextIdle: {
    color: '#a1a1aa',
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
    minHeight: 220,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1b1b1b',
    backgroundColor: '#101010',
    padding: 10,
    gap: 6,
  },
  cardTall: {
    minHeight: 240,
  },
  cardShort: {
    minHeight: 220,
  },
  imageMock: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageMockText: {
    color: '#f3c21a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  likeIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  artistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardFooter: {
    marginTop: 'auto',
    gap: 2,
  },
  likesText: {
    color: '#e5e7eb',
    fontSize: 10,
    fontWeight: '700',
  },
  priceText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
});
