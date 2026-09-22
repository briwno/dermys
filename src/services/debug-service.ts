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
   * Avança no tempo: simula o dia da sessão, completa a anamnese, conclui o agendamento e gera a NFS-e
   */
  static async avancarTempoEConcluirSessao(artistaId: string, clienteId: string) {
    try {
      // 1. Busca agendamento ativo ou cria um confirmado
      const { data: ags } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('artista_id', artistaId)
        .eq('cliente_id', clienteId)
        .order('criado_em', { ascending: false })
        .limit(1);

      let agId = ags?.[0]?.id;
      let valorTotal = ags?.[0]?.valor_total || 800;
      let valorSinal = ags?.[0]?.valor_sinal || 240;

      if (!agId) {
        const novo = await this.criarAgendamentoTeste(clienteId, artistaId, 'Fine Line Botânica');
        agId = novo?.id;
      }

      // 2. Garante Ficha de Anamnese preenchida e assinada
      try {
        await supabase.from('fichas_anamnese').insert({
          cliente_id: clienteId,
          artista_id: artistaId,
          alergias: 'Nenhuma',
          doencas_cronicas: 'Nenhuma',
          medicamentos: 'Nenhum',
          observacoes: 'Queloide: Não | Gestante: Não | Anticoagulante: Não (Validado via Simulador)',
          assinado: true,
          tem_alerta_saude: false,
          data_assinatura: new Date().toISOString(),
        });
      } catch {
        // segue
      }

      // 3. Atualiza agendamento para CONCLUIDO
      if (agId) {
        try {
          await supabase
            .from('agendamentos')
            .update({
              status: 'CONCLUIDO',
              valor_total: valorTotal,
              data_horario: new Date().toISOString(),
            })
            .eq('id', agId);
        } catch {
          // segue
        }
      }

      // 4. Cria transação de quitação do saldo
      await this.criarTransacaoTeste(clienteId, artistaId, 'TOTAL');

      // 5. Emite dados fiscais
      const hash = Math.random().toString(36).substring(2, 7).toUpperCase();
      const numNfse = `NFS-2026-${hash}`;
      const codVerif = `AUT-${Date.now().toString(16).toUpperCase()}`;

      // 6. Dispara mensagens no chat com o card de conclusão e Aftercare
      const payloadCard = {
        tipo: 'session_completed',
        payload: {
          agendamentoId: agId || `AG-${Date.now().toString().slice(-6)}`,
          valorTotal,
          valorSinalPago: valorSinal,
          valorRestantePago: Math.max(0, valorTotal - valorSinal),
          metodoPagamentoRestante: 'PIX Presencial',
          numeroNotaFiscal: numNfse,
          codigoVerificacaoNfse: codVerif,
          dataRealizacao: new Date().toLocaleDateString('pt-BR'),
          estilo: 'Fine Line',
          tomadorNome: 'Cliente Dermys',
        },
      };

      await supabase.from('mensagens').insert([
        {
          remetente_id: artistaId,
          destinatario_id: clienteId,
          conteudo: `[DERMYS_CARD:${JSON.stringify(payloadCard)}]`,
          lida: false,
          criado_em: new Date().toISOString(),
        },
        {
          remetente_id: artistaId,
          destinatario_id: clienteId,
          conteudo:
            '✨ Procedimento concluído com sucesso! Lembre-se de seguir o Guia de Cicatrização (Aftercare) para a melhor fixação dos pigmentos.',
          lida: false,
          criado_em: new Date(Date.now() + 1000).toISOString(),
        },
      ]);

      return {
        sucesso: true,
        numeroNotaFiscal: numNfse,
        codigoVerificacao: codVerif,
      };
    } catch (err) {
      console.error('Erro ao avançar tempo no simulador:', err);
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
