import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { PerfilUsuario } from '@/types/auth';

export const CENARIOS_DEBUG = [
  { id: 'sinal_custodia', grupo: 'Pagamentos', titulo: 'Sinal em custódia', descricao: 'Reserva confirmada, com 30% do valor em custódia. Não gera receita na DRE.' },
  { id: 'pix_liberado', grupo: 'Pagamentos', titulo: 'PIX liberado', descricao: 'Serviço concluído com sinal e pagamento final liberados.' },
  { id: 'cartao_aprovado', grupo: 'Pagamentos', titulo: 'Cartão com taxa', descricao: 'Serviço concluído, dois pagamentos aprovados e taxa simulada de 4,99%.' },
  { id: 'pagamento_pendente', grupo: 'Pagamentos', titulo: 'Pagamento pendente', descricao: 'Reserva e sinal aguardando pagamento. Fica fora da DRE.' },
  { id: 'pagamento_cancelado', grupo: 'Pagamentos', titulo: 'Pagamento cancelado', descricao: 'Reserva cancelada com sinal cancelado, para testar os filtros.' },
  { id: 'estorno_parcial', grupo: 'Pagamentos', titulo: 'Estorno parcial', descricao: 'Serviço concluído e pago, seguido de devolução simulada de 25%.' },
  { id: 'despesa_material', grupo: 'Despesas', titulo: 'Materiais de tatuagem', descricao: 'Despesa com materiais, classificada automaticamente como custo na DRE.' },
  { id: 'despesa_estudio', grupo: 'Despesas', titulo: 'Despesa fixa do estúdio', descricao: 'Aluguel e contas, com marcação de despesa recorrente.' },
  { id: 'despesa_equipamento', grupo: 'Despesas', titulo: 'Manutenção de equipamento', descricao: 'Despesa administrativa com manutenção de equipamentos.' },
  { id: 'pacote_despesas', grupo: 'Despesas', titulo: 'Pacote de cinco despesas', descricao: 'Distribui o valor base entre materiais, limpeza, contas, manutenção e outros.' },
  { id: 'reserva_pendente', grupo: 'Agenda', titulo: 'Solicitação de reserva', descricao: 'Agendamento pendente sem pagamento.' },
  { id: 'reserva_confirmada', grupo: 'Agenda', titulo: 'Reserva confirmada', descricao: 'Agendamento confirmado e sinal em custódia.' },
  { id: 'sessao_concluida', grupo: 'Agenda', titulo: 'Sessão concluída', descricao: 'Sessão concluída, com sinal e saldo quitados. Alimenta a DRE.' },
  { id: 'reserva_cancelada', grupo: 'Agenda', titulo: 'Reserva cancelada', descricao: 'Agendamento cancelado sem movimentação financeira.' },
  { id: 'mes_lucrativo', grupo: 'Cenários completos', titulo: 'Mês com lucro', descricao: 'Um serviço pago, materiais e contas somando 35% do valor base.' },
  { id: 'mes_prejuizo', grupo: 'Cenários completos', titulo: 'Mês com prejuízo', descricao: 'Um serviço pago e despesas somando 150% do valor base.' },
  { id: 'historico_trimestral', grupo: 'Cenários completos', titulo: 'Histórico de três meses', descricao: 'Serviços e despesas no mês da data base e nos dois anteriores.' },
  { id: 'dre_completa', grupo: 'Cenários completos', titulo: 'Todas as categorias da DRE', descricao: 'Dois serviços, pagamentos, custos, despesas, depreciação e tributos simulados.' },
] as const;
export type CenarioDebug = typeof CENARIOS_DEBUG[number]['id'];
export interface ResultadoDebug {
  loteId: string;
  agendamentos: number;
  transacoes: number;
  despesas: number;
  lancamentos: number;
}
export interface LoteDebug {
  id: string;
  cenario: CenarioDebug;
  criado_em: string;
  data_base: string;
  resultado: ResultadoDebug;
  removido_em: string | null;
}
export interface PedidoDebug {
  artistaId: string;
  clienteId: string;
  cenario: CenarioDebug;
  data: string;
  valor: number;
  quantidade: number;
  requestId: string;
}

export function resolverAlvosDebug(perfil: PerfilUsuario | null, outroId: string): Pick<PedidoDebug, 'artistaId' | 'clienteId'> {
  const ativoId = perfil?.id || perfil?.uid;
  if (!ativoId || !outroId) throw new Error('Selecione um perfil ativo e a outra pessoa do cenário.');
  const artista = perfil?.role === 'artista' || perfil?.tipo_perfil === 'artista';
  const alvos = artista ? { artistaId: ativoId, clienteId: outroId } : { artistaId: outroId, clienteId: ativoId };
  if (alvos.artistaId === alvos.clienteId) throw new Error('Artista e cliente devem ser pessoas diferentes.');
  return alvos;
}

export function novoIdDebug(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  // Identificador de idempotência; não é uma credencial ou token de autorização.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caractere) => {
    const numero = Math.floor(Math.random() * 16);
    return (caractere === 'x' ? numero : (numero & 3) | 8).toString(16);
  });
}

function erroLegivel(error: { code?: string; message: string }) {
  if (error.code === '42501') return new Error('Sua sessão não tem permissão para gerar testes neste perfil. Entre na conta autorizada.');
  if (error.code === 'P0001') return new Error(error.message);
  return new Error('Não foi possível concluir a ação. Confira a conexão; use Tentar novamente para repetir o mesmo pedido sem duplicá-lo.');
}

export class DebugService {
  static async gerarCenario(pedido: PedidoDebug): Promise<ResultadoDebug> {
    const { data, error } = await supabase.rpc('debug_gerar_cenario', {
      p_artista_id: pedido.artistaId, p_cliente_id: pedido.clienteId, p_cenario: pedido.cenario,
      p_data: pedido.data, p_valor: pedido.valor, p_quantidade: pedido.quantidade, p_request_id: pedido.requestId,
    });
    if (error) throw erroLegivel(error);
    if (!data) throw new Error('O banco não retornou o resultado do teste.');
    return data as ResultadoDebug;
  }
  static async listarLotes(perfilId: string): Promise<LoteDebug[]> {
    const { data, error } = await supabase.rpc('debug_listar_lotes', { p_perfil_id: perfilId });
    if (error) throw erroLegivel(error);
    return data || [];
  }
  static async removerLote(loteId: string) {
    const { data, error } = await supabase.rpc('debug_remover_lote', { p_lote_id: loteId });
    if (error) throw erroLegivel(error);
    if (!data) throw new Error('O lote não foi removido.');
  }
  static async limparCacheLocal() {
    const chaves = await AsyncStorage.getAllKeys();
    // Preserva autenticação, persona, tema e dados manuais do usuário.
    const caches = chaves.filter((chave) => chave.startsWith('@dermys:cache:'));
    if (caches.length) await AsyncStorage.multiRemove(caches);
    return caches.length;
  }
}
