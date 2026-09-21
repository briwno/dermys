import { supabase } from './supabase';
import type { ConversaResumo, MensagemChat } from '@/types/chat';

export class ChatService {
  /**
   * Lista todas as conversas ativas do usuário atual, com resumo da última mensagem e perfil do contato
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
        return [];
      }

      // 2. Agrupa por contato (o outro lado da conversa)
      const mapaContatos = new Map<
        string,
        { ultimaMensagem: string; dataUltimaMensagem: string; naoLidas: number }
      >();

      for (const msg of mensagens) {
        const contatoId = msg.remetente_id === usuarioId ? msg.destinatario_id : msg.remetente_id;
        if (!contatoId) continue;

        if (!mapaContatos.has(contatoId)) {
          mapaContatos.set(contatoId, {
            ultimaMensagem: msg.conteudo,
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
        // Se não houver conversas, busca perfis de artistas ou clientes para iniciar conversa
        return await this.obterContatosSugeridos(usuarioId);
      }

      // 3. Busca detalhes dos perfis dos contatos
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

      // Ordena por data da última mensagem decrescente
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
   * Carrega histórico completo de mensagens entre dois usuários
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
      return data as MensagemChat[];
    } catch {
      return [];
    }
  }

  /**
   * Envia uma nova mensagem com persistência no Supabase
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

      if (error) {
        throw error;
      }

      return data as MensagemChat;
    } catch (err) {
      console.error('Erro ao enviar mensagem no Supabase:', err);
      return null;
    }
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
          const nova = payload.new as MensagemChat;
          // Verifica se a mensagem pertence a essa conversa ativa
          if (
            (nova.remetente_id === usuarioId && nova.destinatario_id === contatoId) ||
            (nova.remetente_id === contatoId && nova.destinatario_id === usuarioId)
          ) {
            onNovaMensagem(nova);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
