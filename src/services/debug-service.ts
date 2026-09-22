import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export class DebugService {
  /**
   * Cria um agendamento de teste real no banco de dados Supabase
   */
  static async criarAgendamentoTeste(clienteId: string, artistaId: string, estilo: string = 'Fine Line') {
    try {
      const dataHora = new Date();
      dataHora.setDate(dataHora.getDate() + 3);
      dataHora.setHours(14, 0, 0, 0);

      const { data, error } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: clienteId,
          artista_id: artistaId,
          estilo: estilo,
          descricao: `Agendamento de teste gerado via Dev Tools - Sessão autoral de ${estilo}`,
          data_horario: dataHora.toISOString(),
          valor_sinal: 150,
          valor_total: 600,
          status: 'PENDENTE',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar agendamento de teste:', err);
      return null;
    }
  }

  /**
   * Cria uma transação financeira de teste no banco de dados
   */
  static async criarTransacaoTeste(clienteId: string, artistaId: string, tipo: 'SINAL' | 'TOTAL' = 'SINAL') {
    try {
      const valorBruto = tipo === 'SINAL' ? 150 : 650;
      const taxaMP = Number((valorBruto * 0.0499).toFixed(2));
      const valorLiquido = valorBruto - taxaMP;

      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert({
          artista_id: artistaId,
          cliente_id: clienteId,
          valor_bruto: valorBruto,
          taxa_mercado_pago: taxaMP,
          valor_liquido: valorLiquido,
          status: 'CUSTODIA',
          tipo: tipo,
          forma_pagamento: 'PIX Mercado Pago',
          descricao: `Sinal de reserva de teste (${tipo})`,
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar transação de teste:', err);
      return null;
    }
  }

  /**
   * Envia uma mensagem de teste em tempo real no chat
   */
  static async enviarMensagemTeste(remetenteId: string, destinatarioId: string, texto: string) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          conteudo: texto,
          lida: false,
          criado_em: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao enviar mensagem de teste:', err);
      return null;
    }
  }

  /**
   * Limpa cache local de armazenamento
   */
  static async limparCacheLocal() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}
