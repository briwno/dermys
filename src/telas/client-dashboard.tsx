import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { PerfilUsuario } from '@/types/auth';

interface PropsDashboardCliente {
  perfil: PerfilUsuario;
  onLogout: () => void;
}

interface CartaoArtista {
  id: string;
  nomeArtista: string;
  nomeEstudio: string;
  estilo: string;
  cidade: string;
  curtidas: number;
  precoInicial: number;
}

const TAGS = ['Fine Line', 'Blackwork', 'Realismo', 'Old School', 'Aquarela', 'Geek'];

const ARTISTAS: CartaoArtista[] = [
  {
    id: 'a1',
    nomeArtista: 'Camila Ink',
    nomeEstudio: 'Brasa Tattoo',
    estilo: 'Fine Line',
    cidade: 'São Paulo',
    curtidas: 1280,
    precoInicial: 450,
  },
  {
    id: 'a2',
    nomeArtista: 'Leo Black',
    nomeEstudio: 'Sombra Studio',
    estilo: 'Blackwork',
    cidade: 'Curitiba',
    curtidas: 980,
    precoInicial: 550,
  },
  {
    id: 'a3',
    nomeArtista: 'Maya Arte',
    nomeEstudio: 'Vita Ink',
    estilo: 'Realismo',
    cidade: 'Rio de Janeiro',
    curtidas: 1510,
    precoInicial: 850,
  },
  {
    id: 'a4',
    nomeArtista: 'Rafa Flash',
    nomeEstudio: 'Fenix Tattoo',
    estilo: 'Old School',
    cidade: 'Belo Horizonte',
    curtidas: 740,
    precoInicial: 390,
  },
  {
    id: 'a5',
    nomeArtista: 'Nina Wave',
    nomeEstudio: 'Aurora Ink',
    estilo: 'Aquarela',
    cidade: 'Florianópolis',
    curtidas: 620,
    precoInicial: 500,
  },
  {
    id: 'a6',
    nomeArtista: 'Vitor Pixel',
    nomeEstudio: 'Nerd Needle',
    estilo: 'Geek',
    cidade: 'Recife',
    curtidas: 870,
    precoInicial: 430,
  },
];

export function DashboardCliente({ perfil, onLogout }: PropsDashboardCliente) {
  const [consulta, setConsulta] = useState('');
  const [tagSelecionada, setTagSelecionada] = useState<string>('Todos');

  const cartoes = useMemo(() => {
    const porTag =
      tagSelecionada === 'Todos'
        ? ARTISTAS
        : ARTISTAS.filter((item) => item.estilo.toLowerCase() === tagSelecionada.toLowerCase());

    if (!consulta.trim()) {
      return porTag;
    }

    const busca = consulta.trim().toLowerCase();

    return porTag.filter((item) => {
      const nomeArtista = item.nomeArtista.toLowerCase();
      const estilo = item.estilo.toLowerCase();
      const cidade = item.cidade.toLowerCase();
      const nomeEstudio = item.nomeEstudio.toLowerCase();

      if (nomeArtista.includes(busca)) {
        return true;
      }

      if (estilo.includes(busca)) {
        return true;
      }

      if (cidade.includes(busca)) {
        return true;
      }

      if (nomeEstudio.includes(busca)) {
        return true;
      }

      return false;
    });
  }, [consulta, tagSelecionada]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hiText}>Olá, {perfil.nomeExibicao}</Text>
            <Text style={styles.title}>Descubra artistas</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        <TextInput
          value={consulta}
          onChangeText={setConsulta}
          placeholder="Buscar por artista, estilo ou cidade"
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
        />

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

        <FlatList
          data={cartoes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item, index }) => (
            <View style={[styles.card, index % 3 === 0 ? styles.cardTall : styles.cardShort]}>
              <View style={styles.imageMock}>
                <Text style={styles.imageMockText}>{item.estilo}</Text>
              </View>
              <Text style={styles.artistName}>{item.nomeArtista}</Text>
              <Text style={styles.metaText}>{item.nomeEstudio}</Text>
              <Text style={styles.metaText}>{item.cidade}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.likesText}>{item.curtidas} curtidas</Text>
                <Text style={styles.priceText}>A partir de R$ {item.precoInicial}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Nenhum resultado para sua busca.</Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hiText: {
    color: '#8a8a8a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    color: '#f3c21a',
    fontSize: 30,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#121212',
  },
  logoutText: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  searchInput: {
    minHeight: 52,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 14,
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
    gap: 8,
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
  },
  imageMockText: {
    color: '#f3c21a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  artistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  cardFooter: {
    marginTop: 'auto',
    gap: 4,
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
