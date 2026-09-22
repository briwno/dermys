import { supabase } from './supabase';
import type {
  CardAnamnesePayload,
  CardBriefingPayload,
  CardDepositPayload,
  CardQuotePayload,
  ConversaResumo,
  MensagemChat,
  TipoCardMensagem,
} from '@/types/chat';

export class ChatService {
  /**
   * Helper para deserializar mensagens especiais com payload de cards
   */
  static parsearMensagem(msg: any): MensagemChat {
    const rawConteudo = msg.conteudo || '';
    let tipo: TipoCardMensagem = 'texto';
    let cardPayload: any = undefined;

    if (rawConteudo.startsWith('[DERMYS_CARD:') && rawConteudo.endsWith(']')) {
      try {
        const jsonStr = rawConteudo.slice('[DERMYS_CARD:'.length, -1);
        const parsed = JSON.parse(jsonStr);
        tipo = parsed.tipo || 'texto';
        cardPayload = parsed.payload;
      } catch {
        tipo = 'texto';
      }
    }

    return {
      id: msg.id,
      remetente_id: msg.remetente_id,
      destinatario_id: msg.destinatario_id,
      conteudo: rawConteudo,
      lida: msg.lida ?? false,
      criado_em: msg.criado_em,
      status_envio: 'enviado',
      tipo_mensagem: tipo,
      card_payload: cardPayload,
    };
  }

  /**
   * Helper para formatar o resumo de visualização da última mensagem na lista
   */
  static formatarResumoMensagem(msg: MensagemChat): string {
    if (msg.tipo_mensagem === 'briefing') {
      const b = msg.card_payload as CardBriefingPayload;
      return `📋 Briefing de Projeto: ${b?.localCorpo || 'Tatuagem'} (${b?.tamanhoCm || 'Tamanho estimado'})`;
    }
    if (msg.tipo_mensagem === 'quote') {
      const q = msg.card_payload as CardQuotePayload;
      return `💰 Proposta de Orçamento: R$ ${Number(q?.valorTotal || 0).toFixed(2)} (${q?.duracaoEstimada || 'Sessão'})`;
    }
    if (msg.tipo_mensagem === 'deposit_confirmed') {
      const d = msg.card_payload as CardDepositPayload;
      return `✅ Sinal Confirmado: R$ ${Number(d?.valorSinal || 0).toFixed(2)} (${d?.turnoNome || 'Agendado'})`;
    }
    if (msg.tipo_mensagem === 'anamnese_card') {
      return `🩺 Ficha de Saúde & Biossegurança enviada`;
    }
    return msg.conteudo || '';
  }

  /**
   * Lista todas as conversas ativas do usuário atual
   */
  static async listarConversas(usuarioId: string): Promise<ConversaResumo[]> {
    if (!usuarioId) return [];

    try {
      // 1. Busca todas as mensagens onde o usuário é remetente ou destinatário
      const { data: mensagens, error: errMensagens } = await supabase
        .from('mensagens')
        .select('*')
        .or(`remetente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
        .order('criado_em', { ascending: false });

      if (errMensagens || !mensagens) {
        return await this.obterContatosSugeridos(usuarioId);
      }

      // 2. Agrupa por contato
      const mapaContatos = new Map<
        string,
        { ultimaMensagem: string; dataUltimaMensagem: string; naoLidas: number }
      >();

      for (const msg of mensagens) {
        const contatoId = msg.remetente_id === usuarioId ? msg.destinatario_id : msg.remetente_id;
        if (!contatoId) continue;

        const msgObj = this.parsearMensagem(msg);
        const resumoTexto = this.formatarResumoMensagem(msgObj);

        if (!mapaContatos.has(contatoId)) {
          mapaContatos.set(contatoId, {
            ultimaMensagem: resumoTexto,
            dataUltimaMensagem: msg.criado_em,
            naoLidas: msg.destinatario_id === usuarioId && !msg.lida ? 1 : 0,
          });
        } else {
          const item = mapaContatos.get(contatoId)!;
          if (msg.destinatario_id === usuarioId && !msg.lida) {
            item.naoLidas += 1;
          }
        }
      }

      const contatosIds = Array.from(mapaContatos.keys());
      if (contatosIds.length === 0) {
        return await this.obterContatosSugeridos(usuarioId);
      }

      // 3. Busca perfis dos contatos
      const { data: profiles, error: errProfiles } = await supabase
        .from('profiles')
        .select('id, nome_exibicao, foto_url, tipo_perfil, nome_estudio, estilo_principal, cidade')
        .in('id', contatosIds);

      if (errProfiles || !profiles) {
        return [];
      }

      const listaConversas: ConversaResumo[] = profiles.map((p) => {
        const dadosMsg = mapaContatos.get(p.id) || {
          ultimaMensagem: '',
          dataUltimaMensagem: new Date().toISOString(),
          naoLidas: 0,
        };

        return {
          contato_id: p.id,
          nome: p.nome_exibicao || 'Usuário Dermys',
          foto_url: p.foto_url,
          tipo_perfil: (p.tipo_perfil as any) || 'artista',
          nome_estudio: p.nome_estudio,
          estilo_principal: p.estilo_principal,
          cidade: p.cidade,
          ultima_mensagem: dadosMsg.ultimaMensagem,
          data_ultima_mensagem: dadosMsg.dataUltimaMensagem,
          nao_lidas: dadosMsg.naoLidas,
        };
      });

      return listaConversas.sort(
        (a, b) =>
          new Date(b.data_ultima_mensagem).getTime() - new Date(a.data_ultima_mensagem).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * Retorna sugestões de contatos quando o usuário ainda não tiver mensagens
   */
  static async obterContatosSugeridos(usuarioId: string): Promise<ConversaResumo[]> {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome_exibicao, foto_url, tipo_perfil, nome_estudio, estilo_principal, cidade')
        .neq('id', usuarioId)
        .limit(6);

      if (!profiles) return [];

      return profiles.map((p) => ({
        contato_id: p.id,
        nome: p.nome_exibicao || 'Artista / Estúdio',
        foto_url: p.foto_url,
        tipo_perfil: (p.tipo_perfil as any) || 'artista',
        nome_estudio: p.nome_estudio,
        estilo_principal: p.estilo_principal,
        cidade: p.cidade,
        ultima_mensagem: 'Toque para iniciar um chat...',
        data_ultima_mensagem: new Date().toISOString(),
        nao_lidas: 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Carrega histórico completo de mensagens entre dois usuários com parse de cards
   */
  static async carregarMensagens(usuarioId: string, contatoId: string): Promise<MensagemChat[]> {
    if (!usuarioId || !contatoId) return [];

    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .or(
          `and(remetente_id.eq.${usuarioId},destinatario_id.eq.${contatoId}),and(remetente_id.eq.${contatoId},destinatario_id.eq.${usuarioId})`
        )
        .order('criado_em', { ascending: true });

      if (error || !data) return [];
      return data.map((d) => this.parsearMensagem(d));
    } catch {
      return [];
    }
  }

  /**
   * Envia uma mensagem comum de texto
   */
  static async enviarMensagem(
    remetenteId: string,
    destinatarioId: string,
    conteudo: string
  ): Promise<MensagemChat | null> {
    const textoLimpo = conteudo.trim();
    if (!textoLimpo || !remetenteId || !destinatarioId) return null;

    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          conteudo: textoLimpo,
          lida: false,
          criado_em: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error || !data) throw error;
      return this.parsearMensagem(data);
    } catch (err) {
      console.error('Erro ao enviar mensagem no Supabase:', err);
      return null;
    }
  }

  /**
   * FASE 1 -> FASE 2: Envia o card de abertura de Briefing no chat
   */
  static async enviarBriefing(
    remetenteId: string,
    destinatarioId: string,
    payload: CardBriefingPayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'briefing', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }

  /**
   * FASE 3: Tatuador envia proposta de orçamento
   */
  static async enviarProposta(
    remetenteId: string,
    destinatarioId: string,
    payload: CardQuotePayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'quote', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }

  /**
   * FASE 4: Sistema / Gateway envia confirmação de sinal pago
   */
  static async enviarConfirmacaoSinal(
    remetenteId: string,
    destinatarioId: string,
    payload: CardDepositPayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'deposit_confirmed', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }

  /**
   * FASE 5: Envia card para preencher Ficha de Anamnese
   */
  static async enviarSolicitacaoAnamnese(
    remetenteId: string,
    destinatarioId: string,
    payload: CardAnamnesePayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'anamnese_card', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }

  /**
   * Marca mensagens recebidas como lidas
   */
  static async marcarComoLidas(usuarioId: string, contatoId: string): Promise<void> {
    if (!usuarioId || !contatoId) return;

    try {
      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('remetente_id', contatoId)
        .eq('destinatario_id', usuarioId)
        .eq('lida', false);
    } catch {
      // silencioso
    }
  }

  /**
   * Inscreve um canal Realtime do Supabase para escutar novas mensagens instantâneas
   */
  static inscreverRealtime(
    usuarioId: string,
    contatoId: string,
    onNovaMensagem: (msg: MensagemChat) => void
  ) {
    const canalNome = `chat_${[usuarioId, contatoId].sort().join('_')}`;

    const channel = supabase
      .channel(canalNome)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
        },
        (payload) => {
          const raw = payload.new;
          if (
            (raw.remetente_id === usuarioId && raw.destinatario_id === contatoId) ||
            (raw.remetente_id === contatoId && raw.destinatario_id === usuarioId)
          ) {
            const parsed = ChatService.parsearMensagem(raw);
            onNovaMensagem(parsed);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
