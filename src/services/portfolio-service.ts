import { PORTFOLIOS_DEMONSTRACAO, filtrarObrasDemonstracao } from '@/dados/portfolio-demonstracao';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { ItemPortfolio } from '@/types/artista-detalhado';

const STORAGE_KEY_PORTFOLIO = '@dermys_portfolio_obras';

// Obras padrão iniciais por artista para exibição rica inicial
export class PortfolioService {
  /**
   * Obtém todas as obras salvas localmente no dispositivo.
   */
  static async obterObrasSalvasLocalmente(): Promise<ItemPortfolio[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY_PORTFOLIO);
      if (data) {
        return JSON.parse(data) as ItemPortfolio[];
      }
    } catch {
      // silencioso
    }
    return [];
  }

  /**
   * Carrega o portfólio completo de um artista (combinando Supabase, local storage e padrão).
   */
  static async carregarPortfolioArtista(artistaId: string): Promise<ItemPortfolio[]> {
    const mapaObras = new Map<string, ItemPortfolio>();

    // 1. Obras padrão da persona
    const padroes = PORTFOLIOS_DEMONSTRACAO[artistaId] || [];
    padroes.forEach((ob) => mapaObras.set(ob.id, ob));

    // 2. Obras salvas no AsyncStorage
    try {
      const locais = await this.obterObrasSalvasLocalmente();
      locais
        .filter((o) => o.artistaId === artistaId)
        .forEach((ob) => mapaObras.set(ob.id, ob));
    } catch {
      // silencioso
    }

    // 3. Obras do Supabase (flashes_portfolio)
    try {
      const { data, error } = await supabase
        .from('flashes_portfolio')
        .select('*')
        .eq('artista_id', artistaId);

      if (!error && data && Array.isArray(data)) {
        if (data.length > 0) padroes.forEach(obra => mapaObras.delete(obra.id));
        data.forEach((f: any) => {
          mapaObras.set(f.id, {
            id: f.id,
            artistaId: f.artista_id || artistaId,
            titulo: f.titulo || 'Obra Autoral',
            imagemUrl: f.imagem_url,
            estilo: f.estilo || 'Fine Line',
            preco: f.preco ? Number(f.preco) : undefined,
            disponivel: f.disponivel ?? true,
            descricao: f.descricao,
            tempoSessao: f.tempo_sessao,
          });
        });
      }
    } catch {
      // silencioso se Supabase estiver offline
    }

    return filtrarObrasDemonstracao(artistaId, Array.from(mapaObras.values()));
  }

  /**
   * Adiciona uma nova foto de obra ao portfólio do artista.
   * Persiste tanto localmente (AsyncStorage) quanto no Supabase.
   */
  static async adicionarObra(dados: {
    artistaId: string;
    titulo: string;
    imagemUrl: string;
    estilo: string;
    preco?: number;
    disponivel?: boolean;
    descricao?: string;
  }): Promise<ItemPortfolio> {
    const id = `obra-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const novaObra: ItemPortfolio = {
      id,
      artistaId: dados.artistaId,
      titulo: dados.titulo.trim() || 'Obra Autoral',
      imagemUrl: dados.imagemUrl.trim(),
      estilo: dados.estilo.trim() || 'Fine Line',
      preco: dados.preco,
      disponivel: dados.disponivel ?? true,
      descricao: dados.descricao?.trim(),
    };

    // Salva localmente
    try {
      const existentes = await this.obterObrasSalvasLocalmente();
      const atualizados = [novaObra, ...existentes];
      await AsyncStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(atualizados));
    } catch (e) {
      console.warn('Erro ao salvar obra no AsyncStorage:', e);
    }

    // Tenta persistir no Supabase
    try {
      await supabase.from('flashes_portfolio').insert({
        id: novaObra.id,
        artista_id: novaObra.artistaId,
        titulo: novaObra.titulo,
        imagem_url: novaObra.imagemUrl,
        estilo: novaObra.estilo,
        preco: novaObra.preco,
        disponivel: novaObra.disponivel,
      });
    } catch {
      // falha silenciosa se offline
    }

    return novaObra;
  }

  /**
   * Remove uma obra do portfólio.
   */
  static async removerObra(obraId: string, artistaId: string): Promise<boolean> {
    try {
      const existentes = await this.obterObrasSalvasLocalmente();
      const filtrados = existentes.filter((o) => !(o.id === obraId && o.artistaId === artistaId));
      await AsyncStorage.setItem(STORAGE_KEY_PORTFOLIO, JSON.stringify(filtrados));
    } catch {
      // silencioso
    }

    try {
      await supabase
        .from('flashes_portfolio')
        .delete()
        .eq('id', obraId);
    } catch {
      // silencioso
    }

    return true;
  }

  /**
   * Retorna um mapa de artistaId -> ItemPortfolio[] com todas as obras adicionadas pelos usuários
   * para enriquecer o Feed de Descoberta / Explorar.
   */
  static async obterObrasParaFeed(): Promise<Record<string, ItemPortfolio[]>> {
    const obrasPorArtista: Record<string, ItemPortfolio[]> = {};

    try {
      const todas = await this.obterObrasSalvasLocalmente();
      todas.forEach((ob) => {
        if (!obrasPorArtista[ob.artistaId]) {
          obrasPorArtista[ob.artistaId] = [];
        }
        obrasPorArtista[ob.artistaId].push(ob);
      });
    } catch {
      // silencioso
    }

    return obrasPorArtista;
  }
}
