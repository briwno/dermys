import { supabase } from './supabase';
import { CampoDre, camposDre, valoresDreVazios, ValoresDre } from './dre';

export interface LancamentoDre {
  id: string;
  categoria: CampoDre;
  descricao: string;
  valor: number;
  competencia: string;
  origem: 'manual' | 'servico' | 'despesa' | 'taxa' | 'estorno';
  editavel: boolean;
}
export type NovoLancamentoDre = Pick<LancamentoDre, 'categoria' | 'descricao' | 'valor' | 'competencia'>;

export function limitesPeriodoDre(ano: number, mes: number | null) {
  return {
    inicio: `${ano}-${String(mes ?? 1).padStart(2, '0')}-01`,
    fim: mes === null || mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`,
  };
}

export function somarLancamentosDre(lancamentos: LancamentoDre[]): ValoresDre {
  const valores = valoresDreVazios();
  for (const item of lancamentos) {
    if (!camposDre.some(([campo]) => campo === item.categoria)) throw new Error('Categoria financeira inválida.');
    valores[item.categoria] = (Math.round(valores[item.categoria] * 100) + Math.round(Number(item.valor) * 100)) / 100;
  }
  return valores;
}

export const DreService = {
  async listar(artistaId: string, inicio: string, fim: string): Promise<LancamentoDre[]> {
    const { data: permitido, error: erroAcesso } = await supabase.rpc('financeiro_pode_acessar', { p_artista_id: artistaId });
    if (erroAcesso) throw new Error('Entre na sua conta para acessar a DRE sincronizada.');
    if (!permitido) throw new Error('Sua conta não tem acesso financeiro a este artista. Personas de teste exigem uma permissão concedida no servidor.');
    const resultado: LancamentoDre[] = [];
    // O Data API limita linhas por resposta; percorrer todas evita cortar uma DRE anual.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.rpc('listar_lancamentos_dre', {
        p_artista_id: artistaId, p_inicio: inicio, p_fim: fim,
      }).range(offset, offset + 999);
      if (error) throw new Error('Não foi possível carregar os lançamentos. Tente atualizar novamente.');
      const pagina: LancamentoDre[] = data || [];
      resultado.push(...pagina.map((item) => ({ ...item, valor: Number(item.valor) })));
      if (pagina.length < 1000) return resultado;
    }
  },
  async salvar(artistaId: string, lancamento: NovoLancamentoDre, id?: string) {
    const dados = { ...lancamento, artista_id: artistaId, descricao: lancamento.descricao.trim() };
    if (!dados.descricao || dados.descricao.length > 240 || !Number.isFinite(dados.valor) || dados.valor <= 0) {
      throw new Error('Informe uma descrição e um valor maior que zero.');
    }
    const consulta = id
      ? supabase.from('financeiro_lancamentos').update(lancamento).eq('id', id).eq('artista_id', artistaId)
      : supabase.from('financeiro_lancamentos').insert(dados);
    const { data, error } = await consulta.select('id').single();
    if (error || !data) throw new Error('Não foi possível salvar o lançamento. Confira sua conexão e suas permissões.');
  },
  async excluir(artistaId: string, id: string) {
    const { data, error } = await supabase.from('financeiro_lancamentos').delete().eq('id', id).eq('artista_id', artistaId).select('id').single();
    if (error || !data) throw new Error('Não foi possível excluir o lançamento.');
  },
};
