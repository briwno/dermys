import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERSONAS_TESTE } from '@/components/debug/types';
import { supabase } from './supabase';
import type {
  CardAnamnesePayload,
  CardBriefingPayload,
  CardDepositPayload,
  CardQuotePayload,
  CardSessionCompletedPayload,
  ConversaResumo,
  MensagemChat,
  TipoCardMensagem,
} from '@/types/chat';

const STORAGE_KEY_CHAT_MENSAGENS = '@dermys:chat_cache_mensagens';

type ChatListener = (msg: MensagemChat) => void;

export class ChatService {
  private static memoriaMensagens: MensagemChat[] = [];
  private static memoriaCarregada = false;
  private static listeners = new Set<{
    usuarioId: string;
    contatoId: string;
    callback: ChatListener;
  }>();

  /**
   * Garante o carregamento do cache local de mensagens no AsyncStorage
   */
  /**
   * Garante o carregamento do cache local de mensagens no AsyncStorage com auto-limpeza de spam
   */
  private static async garantirCacheLocal() {
    if (this.memoriaCarregada) return;
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_KEY_CHAT_MENSAGENS);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          this.memoriaMensagens = this.deduplicarListaMensagens(
            parsed.map((p) => this.parsearMensagem(p))
          );
        }
      }
    } catch {
      // fallback silencioso
    } finally {
      this.memoriaCarregada = true;
    }
  }

  /**
   * Deduplica mensagens eliminando cards repetidos do mesmo agendamento e mensagens de texto duplicadas
   */
  static deduplicarListaMensagens(lista: MensagemChat[]): MensagemChat[] {
    const mapaUnicas = new Map<string, MensagemChat>();

    for (const m of lista) {
      const agId = m.card_payload?.agendamentoId;
      const chaveCard = agId && m.tipo_mensagem !== 'texto' ? `card_${m.tipo_mensagem}_${agId}` : null;

      let chaveExistente: string | null = null;
      for (const [k, existente] of mapaUnicas.entries()) {
        if (existente.id === m.id) {
          chaveExistente = k;
          break;
        }
        if (
          chaveCard &&
          existente.tipo_mensagem === m.tipo_mensagem &&
          existente.card_payload?.agendamentoId === agId
        ) {
          chaveExistente = k;
          break;
        }
        if (
          existente.tipo_mensagem === 'texto' &&
          m.tipo_mensagem === 'texto' &&
          existente.remetente_id === m.remetente_id &&
          existente.destinatario_id === m.destinatario_id &&
          existente.conteudo.trim() === m.conteudo.trim() &&
          Math.abs(new Date(existente.criado_em).getTime() - new Date(m.criado_em).getTime()) < 4000
        ) {
          chaveExistente = k;
          break;
        }
      }

      if (chaveExistente) {
        const atual = mapaUnicas.get(chaveExistente)!;
        if (new Date(m.criado_em).getTime() >= new Date(atual.criado_em).getTime()) {
          mapaUnicas.set(chaveExistente, m);
        }
      } else {
        const chaveFinal = chaveCard || m.id;
        mapaUnicas.set(chaveFinal, m);
      }
    }

    const resultado = Array.from(mapaUnicas.values());
    resultado.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
    return resultado;
  }

  /**
   * Salva o estado atual das mensagens na persistência local
   */
  private static async persistirCacheLocal() {
    try {
      this.memoriaMensagens = this.deduplicarListaMensagens(this.memoriaMensagens);
      await AsyncStorage.setItem(
        STORAGE_KEY_CHAT_MENSAGENS,
        JSON.stringify(this.memoriaMensagens.slice(-200)) // mantém as 200 mensagens mais recentes
      );
    } catch {
      // silencioso
    }
  }

  /**
   * Dispara listeners locais ativos para comunicação em tempo real imediata
   */
  private static notificarListenersLocais(msg: MensagemChat) {
    for (const item of this.listeners) {
      if (
        (item.usuarioId === msg.remetente_id && item.contatoId === msg.destinatario_id) ||
        (item.usuarioId === msg.destinatario_id && item.contatoId === msg.remetente_id)
      ) {
        try {
          item.callback(msg);
        } catch (err) {
          console.warn('Erro no callback local do chat:', err);
        }
      }
    }
  }

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
      id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      remetente_id: msg.remetente_id,
      destinatario_id: msg.destinatario_id,
      conteudo: rawConteudo,
      lida: msg.lida ?? false,
      criado_em: msg.criado_em || new Date().toISOString(),
      status_envio: msg.status_envio || 'enviado',
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
    if (msg.tipo_mensagem === 'session_completed') {
      const s = msg.card_payload as CardSessionCompletedPayload;
      return `🎉 Sessão Concluída! NF-e ${s?.numeroNotaFiscal || 'Emitida'} (R$ ${Number(s?.valorTotal || 0).toFixed(2)})`;
    }
    return msg.conteudo || '';
  }

  /**
   * Lista todas as conversas ativas do usuário atual (Supabase + Cache Local + Personas)
   */
  static async listarConversas(usuarioId: string): Promise<ConversaResumo[]> {
    if (!usuarioId) return [];
    await this.garantirCacheLocal();

    try {
      // 1. Busca todas as mensagens do Supabase
      let mensagensSupabase: any[] = [];
      try {
        const { data } = await supabase
          .from('mensagens')
          .select('*')
          .or(`remetente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
          .order('criado_em', { ascending: false });
        if (data) mensagensSupabase = data;
      } catch {
        // silencioso
      }

      // 2. Mensagens locais relevantes
      const mensagensLocaisRelevantes = this.memoriaMensagens.filter(
        (m) => m.remetente_id === usuarioId || m.destinatario_id === usuarioId
      );

      // 3. Mescla e deduplica
      const todas = [...mensagensLocaisRelevantes, ...mensagensSupabase.map((d) => this.parsearMensagem(d))];
      todas.sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );

      // 4. Agrupa por contato
      const mapaContatos = new Map<
        string,
        { ultimaMensagem: string; dataUltimaMensagem: string; naoLidas: number }
      >();

      for (const msg of todas) {
        const contatoId = msg.remetente_id === usuarioId ? msg.destinatario_id : msg.remetente_id;
        if (!contatoId || contatoId === usuarioId) continue;

        const resumoTexto = this.formatarResumoMensagem(msg);

        if (!mapaContatos.has(contatoId)) {
          mapaContatos.set(contatoId, {
            ultimaMensagem: resumoTexto,
            dataUltimaMensagem: msg.criado_em,
            naoLidas: msg.destinatario_id === usuarioId && !msg.lida ? 1 : 0,
          });
        }
      }

      const contatosIds = Array.from(mapaContatos.keys());
      if (contatosIds.length === 0) {
        return await this.obterContatosSugeridos(usuarioId);
      }

      // 5. Busca perfis dos contatos no Supabase
      let perfisSupabase: any[] = [];
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome_exibicao, foto_url, tipo_perfil, nome_estudio, estilo_principal, cidade')
          .in('id', contatosIds);
        if (profiles) perfisSupabase = profiles;
      } catch {
        // silencioso
      }

      const mapaPerfis = new Map<string, any>();
      perfisSupabase.forEach((p) => mapaPerfis.set(p.id, p));

      // 6. Monta lista final mesclando com personas conhecidas
      const listaConversas: ConversaResumo[] = contatosIds.map((cId) => {
        const dadosMsg = mapaContatos.get(cId) || {
          ultimaMensagem: '',
          dataUltimaMensagem: new Date().toISOString(),
          naoLidas: 0,
        };

        const dbProf = mapaPerfis.get(cId);
        const persona = PERSONAS_TESTE.find((p) => p.id === cId);

        const nomeFinal = dbProf?.nome_exibicao || persona?.nome || 'Usuário Dermys';
        const fotoFinal = dbProf?.foto_url || persona?.avatarUrl;
        const tipoFinal = (dbProf?.tipo_perfil || persona?.tipo || 'artista') as any;
        const estudioFinal = dbProf?.nome_estudio || persona?.estudio;
        const estiloFinal = dbProf?.estilo_principal || persona?.estilo;
        const cidadeFinal = dbProf?.cidade || persona?.cidade;

        return {
          contato_id: cId,
          nome: nomeFinal,
          foto_url: fotoFinal,
          tipo_perfil: tipoFinal,
          nome_estudio: estudioFinal,
          estilo_principal: estiloFinal,
          cidade: cidadeFinal,
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
      return await this.obterContatosSugeridos(usuarioId);
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

      if (profiles && profiles.length > 0) {
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
      }

      // Fallback para personas de teste
      return PERSONAS_TESTE.filter((p) => p.id !== usuarioId).slice(0, 6).map((p) => ({
        contato_id: p.id,
        nome: p.nome,
        foto_url: p.avatarUrl,
        tipo_perfil: p.tipo,
        nome_estudio: p.estudio,
        estilo_principal: p.estilo,
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
   * Carrega histórico completo de mensagens entre dois usuários (sem spam e deduplicado)
   */
  static async carregarMensagens(usuarioId: string, contatoId: string): Promise<MensagemChat[]> {
    if (!usuarioId || !contatoId) return [];
    await this.garantirCacheLocal();

    let msgsSupabase: MensagemChat[] = [];
    try {
      const { data } = await supabase
        .from('mensagens')
        .select('*')
        .or(
          `and(remetente_id.eq.${usuarioId},destinatario_id.eq.${contatoId}),and(remetente_id.eq.${contatoId},destinatario_id.eq.${usuarioId})`
        )
        .order('criado_em', { ascending: true });

      if (data && Array.isArray(data)) {
        msgsSupabase = data.map((d) => this.parsearMensagem(d));
      }
    } catch {
      // silencioso
    }

    // Filtra do cache local
    const msgsLocais = this.memoriaMensagens.filter(
      (m) =>
        (m.remetente_id === usuarioId && m.destinatario_id === contatoId) ||
        (m.remetente_id === contatoId && m.destinatario_id === usuarioId)
    );

    // Mescla e deduplica rigorosamente
    const todas = [...msgsSupabase, ...msgsLocais];
    const resultado = this.deduplicarListaMensagens(todas);
    return resultado;
  }

  /**
   * Envia uma mensagem com garantia de persistência imediata e sincronização Supabase
   */
  static async enviarMensagem(
    remetenteId: string,
    destinatarioId: string,
    conteudo: string
  ): Promise<MensagemChat | null> {
    const textoLimpo = conteudo.trim();
    if (!textoLimpo || !remetenteId || !destinatarioId) return null;
    await this.garantirCacheLocal();

    const idGerado = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const agoraIso = new Date().toISOString();

    const mensagemCriada: MensagemChat = this.parsearMensagem({
      id: idGerado,
      remetente_id: remetenteId,
      destinatario_id: destinatarioId,
      conteudo: textoLimpo,
      lida: false,
      criado_em: agoraIso,
      status_envio: 'enviado',
    });

    // 1. Se for card de agendamento, atualiza card existente ou adiciona
    const agId = mensagemCriada.card_payload?.agendamentoId;
    if (agId && mensagemCriada.tipo_mensagem !== 'texto') {
      const idxExistente = this.memoriaMensagens.findIndex(
        (m) =>
          m.tipo_mensagem === mensagemCriada.tipo_mensagem &&
          m.card_payload?.agendamentoId === agId
      );
      if (idxExistente !== -1) {
        this.memoriaMensagens[idxExistente] = mensagemCriada;
      } else {
        this.memoriaMensagens.push(mensagemCriada);
      }
    } else {
      this.memoriaMensagens.push(mensagemCriada);
    }

    this.persistirCacheLocal();

    // 2. Notifica inscritos em tempo real
    this.notificarListenersLocais(mensagemCriada);

    // 3. Sincroniza em background com Supabase (best-effort)
    (async () => {
      try {
        const { data, error } = await supabase
          .from('mensagens')
          .insert({
            remetente_id: remetenteId,
            destinatario_id: destinatarioId,
            conteudo: textoLimpo,
            lida: false,
            criado_em: agoraIso,
          })
          .select('*')
          .single();

        if (!error && data?.id) {
          mensagemCriada.id = data.id;
        }
      } catch (err) {
        console.warn('Sincronização em nuvem da mensagem:', err);
      }
    })();

    return mensagemCriada;
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
   * FASE 6: Sessão realizada e concluída + Emissão Fiscal
   */
  static async enviarConclusaoSessao(
    remetenteId: string,
    destinatarioId: string,
    payload: CardSessionCompletedPayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'session_completed', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }

  /**
   * Marca mensagens recebidas como lidas
   */
  static async marcarComoLidas(usuarioId: string, contatoId: string): Promise<void> {
    if (!usuarioId || !contatoId) return;

    // Atualiza cache local
    for (const m of this.memoriaMensagens) {
      if (m.remetente_id === contatoId && m.destinatario_id === usuarioId) {
        m.lida = true;
      }
    }
    this.persistirCacheLocal();

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
   * Inscreve um canal Realtime para escutar novas mensagens instantâneas (Supabase + Local)
   */
  static inscreverRealtime(
    usuarioId: string,
    contatoId: string,
    onNovaMensagem: (msg: MensagemChat) => void
  ) {
    const listenerItem = { usuarioId, contatoId, callback: onNovaMensagem };
    this.listeners.add(listenerItem);

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
      this.listeners.delete(listenerItem);
      supabase.removeChannel(channel);
    };
  }
}

