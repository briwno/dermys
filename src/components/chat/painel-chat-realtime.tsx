import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  FileText,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  User,
} from 'lucide-react-native';
import { ChatService } from '@/services/chat-service';
import type { PerfilUsuario } from '@/types/auth';
import type { ConversaResumo, MensagemChat } from '@/types/chat';

interface PainelChatRealtimeProps {
  perfilAtual: PerfilUsuario;
  contatoInicialId?: string;
}

export function PainelChatRealtime({ perfilAtual, contatoInicialId }: PainelChatRealtimeProps) {
  const usuarioId = perfilAtual.id || perfilAtual.uid || '';
  const tipoPerfil = perfilAtual.tipo_perfil || perfilAtual.role || 'cliente';

  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<ConversaResumo | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [carregandoConversas, setCarregandoConversas] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [textoInput, setTextoInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');

  const flatListRef = useRef<FlatList>(null);

  // 1. Carrega lista de conversas ao montar
  useEffect(() => {
    if (!usuarioId) return;

    let montado = true;
    async function carregarLista() {
      setCarregandoConversas(true);
      try {
        const lista = await ChatService.listarConversas(usuarioId);
        if (montado) {
          setConversas(lista);

          // Se tiver contato inicial pré-selecionado
          if (contatoInicialId) {
            const achado = lista.find((c) => c.contato_id === contatoInicialId);
            if (achado) {
              abrirConversa(achado);
            }
          }
        }
      } catch {
        // silencioso
      } finally {
        if (montado) setCarregandoConversas(false);
      }
    }

    carregarLista();

    return () => {
      montado = false;
    };
  }, [usuarioId, contatoInicialId]);

  // 2. Inscreve canal Realtime quando uma conversa estiver aberta
  useEffect(() => {
    if (!usuarioId || !conversaAtiva) return;

    const unsubscribe = ChatService.inscreverRealtime(
      usuarioId,
      conversaAtiva.contato_id,
      (novaMensagem) => {
        setMensagens((prev) => {
          // Evita duplicata caso já tenha sido adicionada optimisticamente
          if (prev.some((m) => m.id === novaMensagem.id)) return prev;
          return [...prev, novaMensagem];
        });

        // Atualiza última mensagem na lista de conversas
        setConversas((prev) =>
          prev.map((c) =>
            c.contato_id === conversaAtiva.contato_id
              ? {
                  ...c,
                  ultima_mensagem: novaMensagem.conteudo,
                  data_ultima_mensagem: novaMensagem.criado_em,
                }
              : c
          )
        );

        // Marca como lida se a janela estiver aberta
        if (novaMensagem.destinatario_id === usuarioId) {
          ChatService.marcarComoLidas(usuarioId, conversaAtiva.contato_id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [usuarioId, conversaAtiva]);

  // 3. Abre conversa e carrega histórico de mensagens
  const abrirConversa = async (conversa: ConversaResumo) => {
    setConversaAtiva(conversa);
    setCarregandoMensagens(true);
    try {
      const msgs = await ChatService.carregarMensagens(usuarioId, conversa.contato_id);
      setMensagens(msgs);

      // Marca como lida
      ChatService.marcarComoLidas(usuarioId, conversa.contato_id);

      // Zera contador de não lidas localmente
      setConversas((prev) =>
        prev.map((c) => (c.contato_id === conversa.contato_id ? { ...c, nao_lidas: 0 } : c))
      );
    } catch {
      // silencioso
    } finally {
      setCarregandoMensagens(false);
    }
  };

  // 4. Envio de mensagem com append otimista
  const handleEnviar = async () => {
    const texto = textoInput.trim();
    if (!texto || !conversaAtiva || enviando) return;

    const idTemp = `temp_${Date.now()}`;
    const msgOtimista: MensagemChat = {
      id: idTemp,
      remetente_id: usuarioId,
      destinatario_id: conversaAtiva.contato_id,
      conteudo: texto,
      lida: false,
      criado_em: new Date().toISOString(),
      status_envio: 'enviando',
    };

    // Append imediato
    setMensagens((prev) => [...prev, msgOtimista]);
    setTextoInput('');
    setEnviando(true);

    // Atualiza preview na lista lateral
    setConversas((prev) =>
      prev.map((c) =>
        c.contato_id === conversaAtiva.contato_id
          ? {
              ...c,
              ultima_mensagem: texto,
              data_ultima_mensagem: msgOtimista.criado_em,
            }
          : c
      )
    );

    try {
      const confirmada = await ChatService.enviarMensagem(
        usuarioId,
        conversaAtiva.contato_id,
        texto
      );

      if (confirmada) {
        setMensagens((prev) =>
          prev.map((m) => (m.id === idTemp ? { ...confirmada, status_envio: 'enviado' } : m))
        );
      }
    } catch {
      setMensagens((prev) =>
        prev.map((m) => (m.id === idTemp ? { ...m, status_envio: 'erro' } : m))
      );
    } finally {
      setEnviando(false);
    }
  };

  const formatarHora = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatarDataHeader = (iso: string) => {
    try {
      const d = new Date(iso);
      const hoje = new Date();
      if (d.toDateString() === hoje.toDateString()) return 'Hoje';
      const ontem = new Date();
      ontem.setDate(hoje.getDate() - 1);
      if (d.toDateString() === ontem.toDateString()) return 'Ontem';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const conversasFiltradas = conversas.filter((c) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      (c.nome_estudio && c.nome_estudio.toLowerCase().includes(q)) ||
      (c.estilo_principal && c.estilo_principal.toLowerCase().includes(q))
    );
  });

  // SE ESTIVER NA LISTA DE CONVERSAS (MASTER)
  if (!conversaAtiva) {
    return (
      <View style={styles.container}>
        {/* Header da Aba de Mensagens */}
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderTitle}>Mensagens</Text>
          <Text style={styles.topHeaderSubtitle}>
            {tipoPerfil === 'artista'
              ? 'Converse diretamente com seus clientes sobre briefings e reservas'
              : 'Tire dúvidas, envie referências e alinhe orçamentos com os tatuadores'}
          </Text>
        </View>

        {/* Barra de Busca de Conversas */}
        <View style={styles.searchWrap}>
          <Search size={16} color="#666" />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por artista, estúdio ou cliente..."
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
        </View>

        {/* Lista de Conversas */}
        {carregandoConversas ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#f3c21a" size="small" />
            <Text style={styles.loadingText}>Carregando mensagens...</Text>
          </View>
        ) : conversasFiltradas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MessageSquare size={32} color="#333" />
            <Text style={styles.emptyTitle}>Nenhuma conversa encontrada</Text>
            <Text style={styles.emptySubtitle}>
              {busca
                ? 'Nenhum resultado para a busca.'
                : 'Suas mensagens em tempo real aparecerão aqui.'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.conversasListScroll} showsVerticalScrollIndicator={false}>
            {conversasFiltradas.map((item) => {
              const temNaoLidas = item.nao_lidas > 0;

              return (
                <Pressable
                  key={item.contato_id}
                  style={styles.conversaCard}
                  onPress={() => abrirConversa(item)}
                >
                  <View style={styles.avatarWrap}>
                    {item.foto_url ? (
                      <Image source={{ uri: item.foto_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <User size={18} color="#f3c21a" />
                      </View>
                    )}
                    <View style={styles.onlineBadge} />
                  </View>

                  <View style={styles.conversaInfo}>
                    <View style={styles.conversaNameRow}>
                      <Text style={[styles.conversaName, temNaoLidas && styles.conversaNameUnread]}>
                        {item.nome}
                      </Text>
                      <Text style={styles.conversaHora}>
                        {formatarDataHeader(item.data_ultima_mensagem)}
                      </Text>
                    </View>

                    {item.nome_estudio ? (
                      <Text style={styles.conversaEstudio}>
                        {item.nome_estudio}
                        {item.estilo_principal ? ` • ${item.estilo_principal}` : ''}
                      </Text>
                    ) : null}

                    <View style={styles.conversaSnippetRow}>
                      <Text
                        style={[
                          styles.conversaLastMsg,
                          temNaoLidas && styles.conversaLastMsgUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {item.ultima_mensagem || 'Iniciar conversa...'}
                      </Text>

                      {temNaoLidas ? (
                        <View style={styles.unreadCounterBadge}>
                          <Text style={styles.unreadCounterText}>{item.nao_lidas}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }

  // SE UMA CONVERSA ESTIVER ABERTA (CHAT ATIVO EM TEMPO REAL)
  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header do Chat Ativo */}
      <View style={styles.activeChatHeader}>
        <Pressable
          style={styles.backBtn}
          onPress={() => setConversaAtiva(null)}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#fff" />
        </Pressable>

        <View style={styles.activeChatAvatarWrap}>
          {conversaAtiva.foto_url ? (
            <Image source={{ uri: conversaAtiva.foto_url }} style={styles.activeChatAvatar} />
          ) : (
            <View style={styles.activeChatAvatarFallback}>
              <User size={16} color="#f3c21a" />
            </View>
          )}
          <View style={styles.onlineBadgeSmall} />
        </View>

        <View style={styles.activeChatHeaderInfo}>
          <Text style={styles.activeChatName}>{conversaAtiva.nome}</Text>
          <Text style={styles.activeChatSubtitle}>
            {conversaAtiva.nome_estudio ||
              (conversaAtiva.tipo_perfil === 'artista' ? 'Tatuador(a)' : 'Cliente')}
            {' • '}
            <Text style={styles.onlineText}>Online agora</Text>
          </Text>
        </View>
      </View>

      {/* Stream de Mensagens */}
      {carregandoMensagens ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#f3c21a" size="small" />
          <Text style={styles.loadingText}>Sincronizando conversa...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isMe = item.remetente_id === usuarioId;
            const msgAnterior = index > 0 ? mensagens[index - 1] : null;
            const mostrarData =
              !msgAnterior ||
              new Date(msgAnterior.criado_em).toDateString() !==
                new Date(item.criado_em).toDateString();

            return (
              <View>
                {mostrarData && (
                  <View style={styles.dateSeparatorWrap}>
                    <Text style={styles.dateSeparatorText}>
                      {formatarDataHeader(item.criado_em)}
                    </Text>
                  </View>
                )}

                <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther]}>
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                    ]}
                  >
                    <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                      {item.conteudo}
                    </Text>

                    <View style={styles.bubbleFooter}>
                      <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther]}>
                        {formatarHora(item.criado_em)}
                      </Text>
                      {isMe && (
                        <View style={styles.readReceiptWrap}>
                          {item.status_envio === 'enviando' ? (
                            <Clock size={11} color="#999" />
                          ) : item.lida ? (
                            <CheckCheck size={13} color="#f3c21a" />
                          ) : (
                            <Check size={13} color="#888" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Barra de Input de Mensagens */}
      <View style={styles.inputBar}>
        <TextInput
          value={textoInput}
          onChangeText={setTextoInput}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#666"
          style={styles.chatTextInput}
          multiline
          maxLength={1000}
          onKeyPress={(e: any) => {
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
              e.preventDefault();
              handleEnviar();
            }
          }}
        />

        <Pressable
          style={[styles.sendBtn, !textoInput.trim() && styles.sendBtnDisabled]}
          onPress={handleEnviar}
          disabled={!textoInput.trim() || enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Send size={16} color="#000" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  topHeader: {
    gap: 4,
  },
  topHeaderTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  topHeaderSubtitle: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  loadingWrap: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#777777',
    fontSize: 12,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
  conversasListScroll: {
    gap: 8,
  },
  conversaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111111',
  },
  conversaInfo: {
    flex: 1,
    gap: 2,
  },
  conversaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversaName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  conversaNameUnread: {
    fontWeight: '900',
    color: '#ffffff',
  },
  conversaHora: {
    color: '#666666',
    fontSize: 10,
  },
  conversaEstudio: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '600',
  },
  conversaSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  conversaLastMsg: {
    color: '#888888',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  conversaLastMsgUnread: {
    color: '#ffffff',
    fontWeight: '700',
  },
  unreadCounterBadge: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCounterText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  // Chat Ativo
  chatContainer: {
    flex: 1,
    minHeight: 480,
    backgroundColor: '#0c0c0c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  activeChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1c',
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  activeChatAvatarWrap: {
    position: 'relative',
  },
  activeChatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
  },
  activeChatAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadgeSmall: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#121212',
  },
  activeChatHeaderInfo: {
    flex: 1,
  },
  activeChatName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  activeChatSubtitle: {
    color: '#777777',
    fontSize: 10,
  },
  onlineText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
    gap: 10,
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    color: '#555555',
    fontSize: 10,
    backgroundColor: '#141414',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bubbleWrap: {
    marginVertical: 2,
    flexDirection: 'row',
  },
  bubbleWrapMe: {
    justifyContent: 'flex-end',
  },
  bubbleWrapOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 3,
  },
  bubbleMe: {
    backgroundColor: '#1f1f1f',
    borderBottomRightRadius: 3,
    borderWidth: 1,
    borderColor: '#2d2d2d',
  },
  bubbleOther: {
    backgroundColor: '#131313',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextMe: {
    color: '#ffffff',
  },
  bubbleTextOther: {
    color: '#e5e5e5',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    alignSelf: 'flex-end',
  },
  bubbleTime: {
    fontSize: 9,
  },
  bubbleTimeMe: {
    color: '#888888',
  },
  bubbleTimeOther: {
    color: '#666666',
  },
  readReceiptWrap: {
    marginLeft: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#1c1c1c',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3c21a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
