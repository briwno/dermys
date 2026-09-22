import { AftercareModal } from '@/components/aftercare-modal';
import { PERSONAS_TESTE } from '@/components/debug/types';
import { DanfseDocumentoModal } from '@/components/fiscal/danfse-documento-modal';
import { AppModal } from '@/components/ui/app-modal';
import { ChatService } from '@/services/chat-service';
import { FiscalService } from '@/services/fiscal/fiscal-service';
import { criarCobrancaSinal } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { PerfilUsuario } from '@/types/auth';
import type {
  CardAnamnesePayload,
  CardBriefingPayload,
  CardDepositPayload,
  CardQuotePayload,
  CardSessionCompletedPayload,
  ConversaResumo,
  MensagemChat,
} from '@/types/chat';
import type { ReciboFiscal } from '@/types/financeiro';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileHeart,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Ruler,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  User,
  X,
  Zap,
} from 'lucide-react-native';
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

interface PainelChatRealtimeProps {
  perfilAtual: PerfilUsuario;
  contatoInicialId?: string;
}

const TURNOS_OPTIONS = [
  { id: 'manha', label: 'Turno Manhã (10h às 13h30)', horas: '3h30' },
  { id: 'tarde', label: 'Turno Tarde (14h às 19h)', horas: '5h' },
  { id: 'diaria', label: 'Diária Completa (Dia Todo)', horas: '8h' },
  { id: 'rapida', label: 'Sessão Rápida / Flash (~2h)', horas: '2h' },
];

export function PainelChatRealtime({ perfilAtual, contatoInicialId }: PainelChatRealtimeProps) {
  const usuarioId = perfilAtual.id || perfilAtual.uid || '';
  const tipoPerfil = perfilAtual.tipo_perfil || perfilAtual.role || 'cliente';
  const isArtista = tipoPerfil === 'artista';

  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<ConversaResumo | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [carregandoConversas, setCarregandoConversas] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [textoInput, setTextoInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');

  // Modais de Ação no Chat
  const [modalPropostaAberto, setModalPropostaAberto] = useState(false);
  const [modalReservaAberto, setModalReservaAberto] = useState(false);
  const [quoteAtivoParaReserva, setQuoteAtivoParaReserva] = useState<CardQuotePayload | null>(null);
  const [modalAnamneseAberto, setModalAnamneseAberto] = useState(false);
  const [agendamentoAnamneseId, setAgendamentoAnamneseId] = useState<string>('');

  // Form de Proposta do Tatuador (Fase 3)
  const [valorTotalInput, setValorTotalInput] = useState('800');
  const [duracaoSelecionada, setDuracaoSelecionada] = useState('Turno Tarde (14h às 19h)');
  const [sinalPersonalizado, setSinalPersonalizado] = useState('240'); // 30%
  const [observacoesProposta, setObservacoesProposta] = useState('');
  const [enviandoProposta, setEnviandoProposta] = useState(false);

  // Form de Ficha de Anamnese (Fase 5)
  const [temAlergia, setTemAlergia] = useState(false);
  const [detalheAlergia, setDetalheAlergia] = useState('');
  const [temQueloide, setTemQueloide] = useState(false);
  const [temCondicaoSaude, setTemCondicaoSaude] = useState(false);
  const [detalheCondicao, setDetalheCondicao] = useState('');
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [isGestanteLactante, setIsGestanteLactante] = useState(false);
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);

  // Form de Reserva e Sinal Pix (Fase 4)
  const [dataSelecionadaReserva, setDataSelecionadaReserva] = useState<Date>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  );
  const [turnoSelecionadoReserva, setTurnoSelecionadoReserva] = useState('tarde');
  const [etapaReserva, setEtapaReserva] = useState<1 | 2>(1); // 1 = Escolher Data/Turno, 2 = Pagar Sinal Pix
  const [segundosRestantesHold, setSegundosRestantesHold] = useState(1800);
  const [cobrancaPixChat, setCobrancaPixChat] = useState<{
    qrCodePayload: string;
    valor: number;
    paymentId: string;
  } | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  // Form de Conclusão de Sessão & Emissão Fiscal (Fase 6)
  const [modalConcluirSessaoAberto, setModalConcluirSessaoAberto] = useState(false);
  const [metodoPagamentoSaldo, setMetodoPagamentoSaldo] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [emitirNfseAutomatica, setEmitirNfseAutomatica] = useState(true);
  const [concluindoSessao, setConcluindoSessao] = useState(false);
  const [feedbackAviso, setFeedbackAviso] = useState<string | null>(null);

  // Modais de Recibo e Guia de Cicatrização (Aftercare)
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [reciboAtivo, setReciboAtivo] = useState<ReciboFiscal | null>(null);
  const [modalAftercareAberto, setModalAftercareAberto] = useState(false);

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

          if (contatoInicialId) {
            const achado = lista.find((c) => c.contato_id === contatoInicialId);
            if (achado) {
              abrirConversa(achado);
            } else {
              // Busca perfil do contato se não tiver mensagem ainda
              let p: any = null;
              try {
                const { data } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', contatoInicialId)
                  .maybeSingle();
                p = data;
              } catch {
                // silencioso
              }

              const persona = PERSONAS_TESTE.find((pt) => pt.id === contatoInicialId);
              const nomeFinal = p?.nome_exibicao || persona?.nome || 'Usuário Dermys';
              const fotoFinal = p?.foto_url || persona?.avatarUrl;
              const tipoFinal = (p?.tipo_perfil || persona?.tipo || 'artista') as any;
              const estudioFinal = p?.nome_estudio || persona?.estudio;
              const estiloFinal = p?.estilo_principal || persona?.estilo;
              const cidadeFinal = p?.cidade || persona?.cidade;

              if (montado) {
                const novaConversa: ConversaResumo = {
                  contato_id: contatoInicialId,
                  nome: nomeFinal,
                  foto_url: fotoFinal,
                  tipo_perfil: tipoFinal,
                  nome_estudio: estudioFinal,
                  estilo_principal: estiloFinal,
                  cidade: cidadeFinal,
                  ultima_mensagem: 'Iniciar conversa...',
                  data_ultima_mensagem: new Date().toISOString(),
                  nao_lidas: 0,
                };
                setConversas((prev) => [novaConversa, ...prev]);
                abrirConversa(novaConversa);
              }
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

  const adicionarOuAtualizarMensagem = (novaMsg: MensagemChat) => {
    setMensagens((prev) => {
      const lista = [...prev, novaMsg];
      return ChatService.deduplicarListaMensagens(lista);
    });
  };

  // 2. Inscreve canal Realtime
  useEffect(() => {
    if (!usuarioId || !conversaAtiva) return;

    const unsubscribe = ChatService.inscreverRealtime(
      usuarioId,
      conversaAtiva.contato_id,
      (novaMensagem) => {
        adicionarOuAtualizarMensagem(novaMensagem);

        setConversas((prev) =>
          prev.map((c) =>
            c.contato_id === conversaAtiva.contato_id
              ? {
                  ...c,
                  ultima_mensagem: ChatService.formatarResumoMensagem(novaMensagem),
                  data_ultima_mensagem: novaMensagem.criado_em,
                }
              : c
          )
        );

        if (novaMensagem.destinatario_id === usuarioId) {
          ChatService.marcarComoLidas(usuarioId, conversaAtiva.contato_id);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [usuarioId, conversaAtiva]);

  // Timer de Hold de 30 minutos
  useEffect(() => {
    let timer: any = null;
    if (modalReservaAberto && etapaReserva === 2 && segundosRestantesHold > 0) {
      timer = setInterval(() => {
        setSegundosRestantesHold((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [modalReservaAberto, etapaReserva, segundosRestantesHold]);

  const abrirConversa = async (conversa: ConversaResumo) => {
    setConversaAtiva(conversa);
    setCarregandoMensagens(true);
    try {
      const msgs = await ChatService.carregarMensagens(usuarioId, conversa.contato_id);
      setMensagens(msgs);
      ChatService.marcarComoLidas(usuarioId, conversa.contato_id);
      setConversas((prev) =>
        prev.map((c) => (c.contato_id === conversa.contato_id ? { ...c, nao_lidas: 0 } : c))
      );
    } catch {
      // silencioso
    } finally {
      setCarregandoMensagens(false);
    }
  };

  // Envio de mensagem padrão
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
      tipo_mensagem: 'texto',
    };

    setMensagens((prev) => [...prev, msgOtimista]);
    setTextoInput('');
    setEnviando(true);

    try {
      const confirmada = await ChatService.enviarMensagem(
        usuarioId,
        conversaAtiva.contato_id,
        texto
      );

      if (confirmada) {
        setMensagens((prev) =>
          ChatService.deduplicarListaMensagens(
            prev.map((m) => (m.id === idTemp ? { ...confirmada, status_envio: 'enviado' } : m))
          )
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

  // FASE 3: Envio de Proposta pelo Tatuador
  const handleEnviarProposta = async () => {
    if (!conversaAtiva || enviandoProposta) return;
    setEnviandoProposta(true);

    try {
      const valorTotal = Number(valorTotalInput) || 800;
      const valorSinal = Number(sinalPersonalizado) || Math.round(valorTotal * 0.3);

      const payloadQuote: CardQuotePayload = {
        agendamentoId: ultimoBriefing?.card_payload?.agendamentoId || `REQ-${Date.now().toString().slice(-6)}`,
        valorTotal,
        duracaoEstimada: duracaoSelecionada,
        valorSinal,
        observacoes: observacoesProposta.trim() || undefined,
        statusProposta: 'pendente',
      };

      const msg = await ChatService.enviarProposta(
        usuarioId,
        conversaAtiva.contato_id,
        payloadQuote
      );

      if (msg) {
        adicionarOuAtualizarMensagem(msg);
      }

      setModalPropostaAberto(false);
      setObservacoesProposta('');
    } catch (err) {
      console.warn('Erro ao enviar proposta:', err);
    } finally {
      setEnviandoProposta(false);
    }
  };

  // FASE 4: Cliente clica em [ Escolher Data & Reservar ] no Card do Chat
  const handleAbrirReservaQuote = (quote: CardQuotePayload) => {
    setQuoteAtivoParaReserva(quote);
    setEtapaReserva(1);
    setSegundosRestantesHold(1800);
    setModalReservaAberto(true);
  };

  // FASE 4: Avançar para tela de Sinal Pix com Hold de 30 min
  const handleGerarPixHold = async () => {
    if (!conversaAtiva || !quoteAtivoParaReserva) return;
    setProcessandoPagamento(true);

    try {
      const cobranca = await criarCobrancaSinal({
        agendamentoId: quoteAtivoParaReserva.agendamentoId,
        artistaId: isArtista ? usuarioId : conversaAtiva.contato_id,
        clienteId: isArtista ? conversaAtiva.contato_id : usuarioId,
        valorSinal: quoteAtivoParaReserva.valorSinal,
        artistaNome: conversaAtiva.nome,
        cidade: conversaAtiva.cidade || 'Estúdio Dermys',
        descricao: `Sinal Reserva - ${conversaAtiva.nome}`,
      });

      setCobrancaPixChat(cobranca);
      setEtapaReserva(2);
    } catch {
      setCobrancaPixChat({
        qrCodePayload: '00020126580014br.gov.bcb.pix0136dermys-hold-sinal-garantido5204000053039865802BR5925DERMYS6009SAO PAULO62070503***6304ABCD',
        valor: quoteAtivoParaReserva.valorSinal,
        paymentId: `PAY-${Date.now()}`,
      });
      setEtapaReserva(2);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  // FASE 4: Confirmação de Sinal Pago
  const handleConfirmarSinalNoChat = async () => {
    if (!conversaAtiva || !quoteAtivoParaReserva || processandoPagamento) return;
    setProcessandoPagamento(true);

    try {
      const payloadDeposit: CardDepositPayload = {
        agendamentoId: quoteAtivoParaReserva.agendamentoId,
        valorSinal: quoteAtivoParaReserva.valorSinal,
        dataHorarioFormatada: `${dataSelecionadaReserva.toLocaleDateString('pt-BR')} (Turno ${turnoSelecionadoReserva})`,
        turnoNome: `Turno ${turnoSelecionadoReserva.toUpperCase()}`,
        protocoloReserva: `DERM-${Date.now().toString().slice(-6)}`,
      };

      // Dispara card de confirmação de sinal (deduplicado)
      const msgSinal = await ChatService.enviarConfirmacaoSinal(
        usuarioId,
        conversaAtiva.contato_id,
        payloadDeposit
      );
      if (msgSinal) {
        adicionarOuAtualizarMensagem(msgSinal);
      }

      // Dispara card solicitando preenchimento da Anamnese (deduplicado)
      const payloadAnamnese: CardAnamnesePayload = {
        agendamentoId: quoteAtivoParaReserva.agendamentoId,
        clienteNome: perfilAtual.nome_exibicao || 'Cliente',
        statusFicha: 'pendente',
      };
      const msgAnamnese = await ChatService.enviarSolicitacaoAnamnese(
        usuarioId,
        conversaAtiva.contato_id,
        payloadAnamnese
      );
      if (msgAnamnese) {
        adicionarOuAtualizarMensagem(msgAnamnese);
      }

      setModalReservaAberto(false);
    } catch (err) {
      console.warn('Erro ao confirmar sinal:', err);
    } finally {
      setProcessandoPagamento(false);
    }
  };

  // FASE 5: Salvar Ficha de Anamnese preenchida pelo Chat
  const handleSalvarFichaAnamnese = async () => {
    setSalvandoAnamnese(true);
    try {
      const temAlerta =
        temAlergia || temQueloide || temCondicaoSaude || isGestanteLactante || usaAnticoagulante;

      const alergiasTexto = temAlergia
        ? detalheAlergia || 'Alergia relatada a pigmentos/látex'
        : 'Nenhuma';
      const condicoesTexto = temCondicaoSaude
        ? detalheCondicao || 'Condição de saúde relatada'
        : temQueloide
        ? 'Histórico de queloide/cicatrização'
        : 'Nenhuma';

      const observacoes = `Queloide: ${temQueloide ? 'Sim' : 'Não'} | Gestante: ${
        isGestanteLactante ? 'Sim' : 'Não'
      } | Anticoagulante: ${usaAnticoagulante ? 'Sim' : 'Não'}`;

      if (conversaAtiva) {
        await supabase.from('fichas_anamnese').insert({
          cliente_id: usuarioId,
          artista_id: conversaAtiva.contato_id,
          alergias: alergiasTexto,
          doencas_cronicas: condicoesTexto,
          medicamentos: usaAnticoagulante ? 'Anticoagulante' : 'Nenhum',
          observacoes,
          assinado: true,
          tem_alerta_saude: temAlerta,
          data_assinatura: new Date().toISOString(),
        });

        // Envia confirmação no chat
        const msgTexto = temAlerta
          ? '🩺 Ficha de Saúde assinada! (Aviso: Contém observação de sensibilidade/saúde)'
          : '✅ Ficha de Anamnese & Saúde assinada e validada digitalmente!';
        const msgEnv = await ChatService.enviarMensagem(usuarioId, conversaAtiva.contato_id, msgTexto);
        if (msgEnv) {
          adicionarOuAtualizarMensagem(msgEnv);
        }
      }

      setModalAnamneseAberto(false);
    } catch (err) {
      console.warn('Erro ao salvar anamnese:', err);
    } finally {
      setSalvandoAnamnese(false);
    }
  };

  // Análise do Estado do Fluxo de Atendimento
  const ultimoBriefing = [...mensagens].reverse().find((m) => m.tipo_mensagem === 'briefing');
  const ultimaProposta = [...mensagens].reverse().find((m) => m.tipo_mensagem === 'quote');
  const ultimoSinal = [...mensagens].reverse().find((m) => m.tipo_mensagem === 'deposit_confirmed');
  const ultimaAnamnese = [...mensagens].reverse().find((m) => m.tipo_mensagem === 'anamnese_card');
  const ultimaSessaoConcluida = [...mensagens].reverse().find((m) => m.tipo_mensagem === 'session_completed');

  const temAnamneseAssinada = mensagens.some(
    (m) =>
      m.conteudo?.includes('Ficha de Anamnese & Saúde assinada') ||
      m.conteudo?.includes('Ficha de Saúde assinada')
  );

  // A opção de enviar proposta só deve aparecer quando há briefing E ainda não houve proposta / sinal / conclusão
  const podeEnviarProposta =
    isArtista && Boolean(ultimoBriefing) && !ultimaProposta && !ultimoSinal && !ultimaSessaoConcluida;

  // A sessão está pronta para confirmação de atendimento quando o sinal/reserva estiver travada e ainda não foi concluída
  const sessaoProntaParaFinalizar = Boolean(ultimoSinal && !ultimaSessaoConcluida);

  // FASE 6: Avançar no tempo para o dia da sessão (Simulador / Debug)
  const handleAvancarNoTempoSimulacao = () => {
    setFeedbackAviso('⏱️ Avançado no tempo para o dia marcado! Atendimento pronto para conclusão.');
    setModalConcluirSessaoAberto(true);
    setTimeout(() => setFeedbackAviso(null), 4000);
  };

  // FASE 6: Confirmar realização da sessão e emitir documento fiscal (NFS-e / Recibo)
  const handleConfirmarRealizacaoSessao = async () => {
    if (!conversaAtiva) return;
    setConcluindoSessao(true);
    try {
      const quotePayload = ultimaProposta?.card_payload as CardQuotePayload | undefined;
      const depositPayload = ultimoSinal?.card_payload as CardDepositPayload | undefined;

      const valorTotal = quotePayload?.valorTotal || 800;
      const valorSinal = depositPayload?.valorSinal || quotePayload?.valorSinal || Math.round(valorTotal * 0.3);
      const valorRestante = Math.max(0, valorTotal - valorSinal);
      const agendamentoId =
        quotePayload?.agendamentoId ||
        depositPayload?.agendamentoId ||
        `AG-${Date.now().toString().slice(-6)}`;

      let numeroNfse: string | undefined = undefined;
      let codigoVerificacao: string | undefined = undefined;
      let urlPdf: string | undefined = undefined;

      if (emitirNfseAutomatica) {
        try {
          const nf = await FiscalService.emitirNotaFiscal({
            artistaId: usuarioId,
            clienteId: conversaAtiva.contato_id,
            agendamentoId,
            valorServico: valorTotal,
            descricaoServico: `Procedimento de Tatuagem Autoral (${conversaAtiva.estilo_principal || 'Fine Line'})`,
            tomador: {
              nome: conversaAtiva.nome,
            },
          });
          if (nf) {
            numeroNfse = nf.numero_documento;
            codigoVerificacao = nf.codigo_verificacao;
            urlPdf = nf.url_pdf;
          }
        } catch (errNf) {
          console.warn('Emissão fiscal fallback:', errNf);
          numeroNfse = `NFS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          codigoVerificacao = `VER-${Date.now().toString(16).toUpperCase()}`;
        }
      } else {
        numeroNfse = `REC-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        codigoVerificacao = `AUT-${Date.now().toString(16).toUpperCase()}`;
      }

      // Atualiza banco de dados
      try {
        await supabase
          .from('agendamentos')
          .update({
            status: 'CONCLUIDO',
            valor_total: valorTotal,
          })
          .match({ artista_id: usuarioId, cliente_id: conversaAtiva.contato_id });
      } catch {
        // segue para chat
      }

      // 1. Envia Card de Sessão Concluída no chat
      const payloadSession: CardSessionCompletedPayload = {
        agendamentoId,
        valorTotal,
        valorSinalPago: valorSinal,
        valorRestantePago: valorRestante,
        metodoPagamentoRestante:
          metodoPagamentoSaldo === 'pix'
            ? 'PIX'
            : metodoPagamentoSaldo === 'cartao'
            ? 'Cartão de Débito/Crédito'
            : 'Dinheiro',
        numeroNotaFiscal: numeroNfse,
        codigoVerificacaoNfse: codigoVerificacao,
        dataRealizacao: new Date().toLocaleDateString('pt-BR'),
        estilo: conversaAtiva.estilo_principal || 'Fine Line',
        urlPdf,
        tomadorNome: conversaAtiva.nome,
      };

      const msgConclusao = await ChatService.enviarConclusaoSessao(
        usuarioId,
        conversaAtiva.contato_id,
        payloadSession
      );

      if (msgConclusao) {
        adicionarOuAtualizarMensagem(msgConclusao);
      }

      // 2. Envia mensagem de cuidados de pós-procedimento
      const msgAftercare = await ChatService.enviarMensagem(
        usuarioId,
        conversaAtiva.contato_id,
        '✨ Procedimento concluído com sucesso! Lembre-se de seguir o Guia de Cicatrização (Aftercare) para a melhor fixação dos pigmentos.'
      );
      if (msgAftercare) {
        adicionarOuAtualizarMensagem(msgAftercare);
      }

      setModalConcluirSessaoAberto(false);
      setFeedbackAviso('✅ Procedimento finalizado e documento fiscal emitido com sucesso!');
      setTimeout(() => setFeedbackAviso(null), 4000);
    } catch (err) {
      console.warn('Erro ao concluir sessão:', err);
    } finally {
      setConcluindoSessao(false);
    }
  };

  // Abrir visualização do Recibo Fiscal
  const handleAbrirReciboCard = (s: CardSessionCompletedPayload) => {
    const reciboObj: ReciboFiscal = {
      numeroRecibo: s.numeroNotaFiscal || `REC-${Date.now()}`,
      dataEmissao: s.dataRealizacao || new Date().toLocaleDateString('pt-BR'),
      agendamentoId: s.agendamentoId,
      artistaNome: isArtista
        ? perfilAtual.nome_exibicao || 'Tatuador Dermys'
        : conversaAtiva?.nome || 'Tatuador Dermys',
      artistaDocumento: perfilAtual.cpf_cnpj || '54.321.987/0001-23',
      artistaEstudio: perfilAtual.nome_estudio || conversaAtiva?.nome_estudio || 'Estúdio Particular',
      clienteNome:
        s.tomadorNome ||
        (!isArtista ? perfilAtual.nome_exibicao || 'Cliente' : conversaAtiva?.nome || 'Cliente'),
      clienteDocumento: '***.***.***-**',
      descricaoServico: `Procedimento de Tatuagem ${s.estilo || 'Autoral'}`,
      estilo: s.estilo || 'Fine Line',
      valorSinal: s.valorSinalPago,
      valorFinal: s.valorRestantePago,
      valorTotal: s.valorTotal,
      formaPagamento: `Sinal Mercado Pago + Saldo ${s.metodoPagamentoRestante}`,
      codigoAutenticacao: s.codigoVerificacaoNfse || `AUT-${Date.now()}`,
      regimeTributario: 'MEI',
      tributosEstimados: 0,
    };
    setReciboAtivo(reciboObj);
    setModalReciboAberto(true);
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

  const formatoMinutosSegundos = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const diasDisponiveisReserva = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

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
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderTitle}>Mensagens</Text>
          <Text style={styles.topHeaderSubtitle}>
            {isArtista
              ? 'Converse diretamente com seus clientes sobre briefings e propostas'
              : 'Tire dúvidas, envie referências e alinhe orçamentos com os tatuadores'}
          </Text>
        </View>

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

  // SE UMA CONVERSA ESTIVER ABERTA (CHAT ATIVO EM TEMPO REAL COM CARDS INTERATIVOS)
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
            <Text style={styles.onlineText}>Online</Text>
          </Text>
        </View>

        {/* Botão de Enviar Proposta no Topo (Ação Rápida para o Tatuador) */}
        {isArtista && (
          <Pressable
            style={styles.topBtnProposta}
            onPress={() => setModalPropostaAberto(true)}
          >
            <DollarSign size={14} color="#111" />
            <Text style={styles.topBtnPropostaText}>Proposta</Text>
          </Pressable>
        )}
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

            // RENDERIZAÇÃO DE CARDS ESPECIAIS
            // 1. CARD DE BRIEFING (Fase 1 & 2)
            if (item.tipo_mensagem === 'briefing' && item.card_payload) {
              const b = item.card_payload as CardBriefingPayload;
              return (
                <View key={item.id} style={styles.cardContainerWrapper}>
                  {mostrarData && (
                    <View style={styles.dateSeparatorWrap}>
                      <Text style={styles.dateSeparatorText}>
                        {formatarDataHeader(item.criado_em)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.briefingCard}>
                    <View style={styles.briefingCardHeader}>
                      <View style={styles.cardHeaderIconWrap}>
                        <FileText size={16} color="#f3c21a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.briefingCardTitle}>📋 Briefing do Projeto</Text>
                        <Text style={styles.briefingCardSub}>
                          Enviado por {isMe ? 'você' : conversaAtiva.nome}
                        </Text>
                      </View>
                      <View style={styles.statusBadgeYellow}>
                        <Text style={styles.statusBadgeYellowText}>Fase 1 • Briefing</Text>
                      </View>
                    </View>

                    {/* Miniaturas de Referências & Anatomia */}
                    {b.referenciasUrls && b.referenciasUrls.length > 0 && (
                      <View style={styles.briefingImagesSection}>
                        <Text style={styles.cardSectionLabel}>Fotos de Referência:</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.briefingThumbRow}
                        >
                          {b.referenciasUrls.map((url, i) => (
                            <Image key={i} source={{ uri: url }} style={styles.briefingThumb} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Foto da Região Anatômica se houver */}
                    {b.fotoLocalCorpoUrl && (
                      <View style={styles.anatomyThumbBox}>
                        <Text style={styles.cardSectionLabel}>Foto da Região do Corpo:</Text>
                        <Image
                          source={{ uri: b.fotoLocalCorpoUrl }}
                          style={styles.anatomyThumbImg}
                        />
                      </View>
                    )}

                    {/* Tags: Local & Dimensões cm */}
                    <View style={styles.briefingMetaRow}>
                      <View style={styles.metaBadge}>
                        <MapPin size={12} color="#f3c21a" />
                        <Text style={styles.metaBadgeText}>{b.localCorpo}</Text>
                      </View>
                      <View style={styles.metaBadge}>
                        <Ruler size={12} color="#f3c21a" />
                        <Text style={styles.metaBadgeText}>{b.tamanhoCm}</Text>
                      </View>
                      {b.estilo && (
                        <View style={styles.metaBadge}>
                          <Sparkles size={12} color="#f3c21a" />
                          <Text style={styles.metaBadgeText}>{b.estilo}</Text>
                        </View>
                      )}
                    </View>

                    {/* Disponibilidade Preferencial */}
                    {b.disponibilidadePreferencial && (
                      <View style={styles.availabilityBox}>
                        <Clock size={12} color="#f3c21a" />
                        <Text style={styles.availabilityText}>
                          Disponibilidade: {b.disponibilidadePreferencial}
                        </Text>
                      </View>
                    )}

                    {/* Descrição */}
                    {b.descricao && (
                      <Text style={styles.briefingDescText}>"{b.descricao}"</Text>
                    )}

                    {/* Ação do Tatuador: Responder com Proposta */}
                    {podeEnviarProposta && !isMe && (
                      <Pressable
                        style={styles.btnCardActionPrimary}
                        onPress={() => setModalPropostaAberto(true)}
                      >
                        <DollarSign size={16} color="#111" />
                        <Text style={styles.btnCardActionPrimaryText}>
                          + Enviar Proposta de Orçamento
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }

            // 2. CARD DE PROPOSTA / QUOTE (Fase 3 & 4)
            if (item.tipo_mensagem === 'quote' && item.card_payload) {
              const q = item.card_payload as CardQuotePayload;
              return (
                <View key={item.id} style={styles.cardContainerWrapper}>
                  {mostrarData && (
                    <View style={styles.dateSeparatorWrap}>
                      <Text style={styles.dateSeparatorText}>
                        {formatarDataHeader(item.criado_em)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.quoteCard}>
                    <View style={styles.quoteCardHeader}>
                      <View style={styles.cardHeaderIconWrapGreen}>
                        <DollarSign size={18} color="#10b981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.quoteCardTitle}>💰 Proposta de Orçamento</Text>
                        <Text style={styles.quoteCardSub}>
                          Oficializada por {isMe ? 'você' : conversaAtiva.nome}
                        </Text>
                      </View>
                      <View style={styles.statusBadgeGreen}>
                        <Text style={styles.statusBadgeGreenText}>
                          {ultimoSinal ? 'Proposta Aceita' : 'Fase 3 • Orçamento'}
                        </Text>
                      </View>
                    </View>

                    {/* Detalhamento Financeiro */}
                    <View style={styles.quoteFinBox}>
                      <View style={styles.quoteFinRow}>
                        <Text style={styles.quoteFinLabel}>Valor Total da Tattoo:</Text>
                        <Text style={styles.quoteFinValTotal}>
                          R$ {q.valorTotal.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.quoteFinRowHighlight}>
                        <View>
                          <Text style={styles.quoteFinLabelHighlight}>Sinal de Reserva:</Text>
                          <Text style={styles.quoteFinSubHighlight}>Trava de vaga na agenda</Text>
                        </View>
                        <Text style={styles.quoteFinValHighlight}>
                          R$ {q.valorSinal.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.quoteFinRow}>
                        <Text style={styles.quoteFinLabel}>Duração / Turno:</Text>
                        <Text style={styles.quoteFinVal}>{q.duracaoEstimada}</Text>
                      </View>
                    </View>

                    {q.observacoes && (
                      <Text style={styles.quoteObsText}>Obs: {q.observacoes}</Text>
                    )}

                    {/* BOTÃO EM DESTAQUE PARA O CLIENTE: [ Escolher Data & Reservar ] */}
                    {!isArtista && !ultimoSinal && (
                      <Pressable
                        style={styles.btnBookFromQuote}
                        onPress={() => handleAbrirReservaQuote(q)}
                      >
                        <Calendar size={18} color="#111" />
                        <Text style={styles.btnBookFromQuoteText}>
                          [ Escolher Data & Reservar ]
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }

            // 3. CARD DE SINAL CONFIRMADO (Fase 4)
            if (item.tipo_mensagem === 'deposit_confirmed' && item.card_payload) {
              const d = item.card_payload as CardDepositPayload;
              return (
                <View key={item.id} style={styles.cardContainerWrapper}>
                  {mostrarData && (
                    <View style={styles.dateSeparatorWrap}>
                      <Text style={styles.dateSeparatorText}>
                        {formatarDataHeader(item.criado_em)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.depositConfirmedCard}>
                    <View style={styles.depositConfirmedHeader}>
                      <CheckCircle2 size={24} color="#10b981" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.depositConfirmedTitle}>
                          ✅ Sinal Confirmado com Sucesso!
                        </Text>
                        <Text style={styles.depositConfirmedSub}>
                          Sessão travada na agenda: {d.dataHorarioFormatada}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.depositProtocolRow}>
                      <Text style={styles.depositProtocolKey}>Protocolo:</Text>
                      <Text style={styles.depositProtocolVal}>{d.protocoloReserva}</Text>
                    </View>
                  </View>
                </View>
              );
            }

            // 4. CARD DE FICHA DE ANAMNESE (Fase 5)
            if (item.tipo_mensagem === 'anamnese_card' && item.card_payload) {
              const a = item.card_payload as CardAnamnesePayload;
              const assinada = temAnamneseAssinada || a.statusFicha === 'assinada';

              return (
                <View key={item.id} style={styles.cardContainerWrapper}>
                  {mostrarData && (
                    <View style={styles.dateSeparatorWrap}>
                      <Text style={styles.dateSeparatorText}>
                        {formatarDataHeader(item.criado_em)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.anamneseCard}>
                    <View style={styles.anamneseCardHeader}>
                      <HeartPulse size={20} color={assinada ? '#10b981' : '#f3c21a'} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.anamneseCardTitle}>
                          Fase 5 • Ficha de Saúde (Anamnese)
                        </Text>
                        <Text style={styles.anamneseCardSub}>
                          Exigência da Vigilância Sanitária antes do procedimento
                        </Text>
                      </View>
                    </View>

                    {assinada ? (
                      <View style={styles.anamneseSignedBadge}>
                        <ShieldCheck size={16} color="#10b981" />
                        <Text style={styles.anamneseSignedBadgeText}>
                          Ficha de Saúde Assinada & Validada Digitalmente
                        </Text>
                      </View>
                    ) : !isArtista ? (
                      <Pressable
                        style={styles.btnPreencherAnamneseChat}
                        onPress={() => {
                          setAgendamentoAnamneseId(a.agendamentoId);
                          setModalAnamneseAberto(true);
                        }}
                      >
                        <FileHeart size={16} color="#111" />
                        <Text style={styles.btnPreencherAnamneseChatText}>
                          Preencher Ficha de Saúde (Anamnese)
                        </Text>
                      </Pressable>
                    ) : (
                      <View style={styles.anamnesePendenteBadge}>
                        <Clock size={15} color="#f3c21a" />
                        <Text style={styles.anamnesePendenteBadgeText}>
                          Aguardando preenchimento e assinatura pelo cliente
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }

            // 5. CARD DE SESSÃO CONCLUÍDA & FISCAL (Fase 6)
            if (item.tipo_mensagem === 'session_completed' && item.card_payload) {
              const s = item.card_payload as CardSessionCompletedPayload;
              return (
                <View key={item.id} style={styles.cardContainerWrapper}>
                  {mostrarData && (
                    <View style={styles.dateSeparatorWrap}>
                      <Text style={styles.dateSeparatorText}>
                        {formatarDataHeader(item.criado_em)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.sessionCompletedCard}>
                    <View style={styles.sessionCompletedHeader}>
                      <View style={styles.cardHeaderIconWrapGold}>
                        <Sparkles size={18} color="#f3c21a" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionCompletedTitle}>
                          🎉 Sessão Concluída & Liquidada
                        </Text>
                        <Text style={styles.sessionCompletedSub}>
                          Procedimento realizado em {s.dataRealizacao}
                        </Text>
                      </View>
                      <View style={styles.statusBadgeGold}>
                        <Text style={styles.statusBadgeGoldText}>Fase 6 • Finalizado</Text>
                      </View>
                    </View>

                    {/* Detalhamento Financeiro Liquidado */}
                    <View style={styles.completedFinBox}>
                      <View style={styles.quoteFinRow}>
                        <Text style={styles.quoteFinLabel}>Valor Total do Serviço:</Text>
                        <Text style={styles.completedFinValTotal}>
                          R$ {s.valorTotal.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.completedFinRowBreakdown}>
                        <Text style={styles.completedFinSubText}>
                          Sinal: R$ {s.valorSinalPago.toFixed(2)} (MP) • Saldo: R$ {s.valorRestantePago.toFixed(2)} ({s.metodoPagamentoRestante})
                        </Text>
                      </View>
                      {s.numeroNotaFiscal && (
                        <View style={styles.nfseDocRow}>
                          <FileText size={14} color="#10b981" />
                          <Text style={styles.nfseDocText}>
                            Doc Fiscal: {s.numeroNotaFiscal} (Cod: {s.codigoVerificacaoNfse || 'AUT'})
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Botões de Ação */}
                    <View style={styles.completedActionsRow}>
                      <Pressable
                        style={styles.btnVerReciboChat}
                        onPress={() => handleAbrirReciboCard(s)}
                      >
                        <FileText size={15} color="#111" />
                        <Text style={styles.btnVerReciboChatText}>Ver Nota / Recibo</Text>
                      </Pressable>

                      <Pressable
                        style={styles.btnVerAftercareChat}
                        onPress={() => setModalAftercareAberto(true)}
                      >
                        <ShieldCheck size={15} color="#10b981" />
                        <Text style={styles.btnVerAftercareChatText}>Cuidados Pós</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }

            // MENSAGEM PADRÃO DE TEXTO
            return (
              <View key={item.id}>
                {mostrarData && (
                  <View style={styles.dateSeparatorWrap}>
                    <Text style={styles.dateSeparatorText}>
                      {formatarDataHeader(item.criado_em)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.bubbleWrap,
                    isMe ? styles.bubbleWrapMe : styles.bubbleWrapOther,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe ? styles.bubbleTextMe : styles.bubbleTextOther,
                      ]}
                    >
                      {item.conteudo}
                    </Text>

                    <View style={styles.bubbleFooter}>
                      <Text
                        style={[
                          styles.bubbleTime,
                          isMe ? styles.bubbleTimeMe : styles.bubbleTimeOther,
                        ]}
                      >
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

      {/* Toast de Feedback */}
      {feedbackAviso && (
        <View style={styles.feedbackToastWrap}>
          <Text style={styles.feedbackToastText}>{feedbackAviso}</Text>
        </View>
      )}

      {/* BARRA DE AÇÃO 1 (Fase 3): + Enviar Proposta (Somente quando há briefing pendente) */}
      {podeEnviarProposta && (
        <View style={styles.artistActionBar}>
          <Pressable
            style={styles.btnPropostaArtist}
            onPress={() => setModalPropostaAberto(true)}
          >
            <DollarSign size={16} color="#111" />
            <Text style={styles.btnPropostaArtistText}>+ Enviar Proposta de Orçamento</Text>
          </Pressable>
        </View>
      )}

      {/* BARRA DE AÇÃO 2 (Fase 6): Sessão Confirmada -> Confirmar Realização & Avançar no Tempo */}
      {isArtista && sessaoProntaParaFinalizar && (
        <View style={styles.sessionReadyActionBar}>
          <Pressable
            style={styles.btnConfirmarSessaoArtist}
            onPress={() => setModalConcluirSessaoAberto(true)}
          >
            <CheckCircle2 size={16} color="#111" />
            <Text style={styles.btnConfirmarSessaoArtistText}>
              Confirmar Realização & Emitir NFS-e
            </Text>
          </Pressable>

          <Pressable
            style={styles.btnAvancarTempoDebug}
            onPress={handleAvancarNoTempoSimulacao}
          >
            <Clock size={14} color="#f3c21a" />
            <Text style={styles.btnAvancarTempoDebugText}>⏱️ Avançar no Tempo</Text>
          </Pressable>
        </View>
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
            if (
              Platform.OS === 'web' &&
              e.nativeEvent.key === 'Enter' &&
              !e.nativeEvent.shiftKey
            ) {
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
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <Send size={18} color="#111" />
          )}
        </Pressable>
      </View>

      {/* MODAL 1: ENVIAR PROPOSTA (Ação do Tatuador - Fase 3) */}
      <AppModal
        visible={modalPropostaAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalPropostaAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Enviar Proposta de Orçamento</Text>
                <Text style={styles.modalSub}>
                  Defina o valor, duração e sinal para {conversaAtiva?.nome}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalPropostaAberto(false)}
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              {/* Valor Total */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valor Total da Tatuagem (R$)</Text>
                <TextInput
                  value={valorTotalInput}
                  onChangeText={(val) => {
                    setValorTotalInput(val);
                    const n = Number(val) || 0;
                    setSinalPersonalizado(Math.round(n * 0.3).toString());
                  }}
                  keyboardType="numeric"
                  placeholder="Ex: 800"
                  placeholderTextColor="#666"
                  style={styles.modalInput}
                />
              </View>

              {/* Duração / Turno */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duração / Turno Recomendado</Text>
                <View style={{ gap: 6 }}>
                  {TURNOS_OPTIONS.map((t) => {
                    const isSel = duracaoSelecionada === t.label;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setDuracaoSelecionada(t.label)}
                        style={[
                          styles.turnOptionItem,
                          isSel ? styles.turnOptionActive : styles.turnOptionIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.turnOptionText,
                            isSel && styles.turnOptionTextActive,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Sinal (Entrada) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Valor do Sinal de Reserva (Sugerido 30% = R$ {sinalPersonalizado})
                </Text>
                <TextInput
                  value={sinalPersonalizado}
                  onChangeText={setSinalPersonalizado}
                  keyboardType="numeric"
                  placeholder="Ex: 240"
                  placeholderTextColor="#666"
                  style={styles.modalInput}
                />
              </View>

              {/* Observações */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Observações da Proposta (Opcional)</Text>
                <TextInput
                  value={observacoesProposta}
                  onChangeText={setObservacoesProposta}
                  placeholder="Ex: Inclui criação exclusiva da arte e retoque em até 60 dias..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={2}
                  style={styles.modalTextArea}
                />
              </View>
            </ScrollView>

            <Pressable
              style={styles.btnConfirmarProposta}
              onPress={handleEnviarProposta}
              disabled={enviandoProposta}
            >
              {enviandoProposta ? (
                <ActivityIndicator color="#111" size="small" />
              ) : (
                <>
                  <Send size={18} color="#111" />
                  <Text style={styles.btnConfirmarPropostaText}>
                    Enviar Proposta Oficial no Chat
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </AppModal>

      {/* MODAL 2: SELEÇÃO DE DATA & SINAL PIX (Ação do Cliente - Fase 4) */}
      <AppModal
        visible={modalReservaAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalReservaAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {etapaReserva === 1 ? 'Escolha Data & Turno' : 'Trava de Vaga com Sinal (Pix)'}
                </Text>
                <Text style={styles.modalSub}>
                  {etapaReserva === 1
                    ? `Proposta de R$ ${quoteAtivoParaReserva?.valorTotal.toFixed(2)} com ${conversaAtiva?.nome}`
                    : 'Garante o horário na agenda com proteção em custódia'}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalReservaAberto(false)}
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            {etapaReserva === 1 && (
              <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
                {/* Calendário de Datas Disponíveis */}
                <Text style={styles.inputLabel}>Selecione a Data:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysRow}
                >
                  {diasDisponiveisReserva.map((d, index) => {
                    const isSel =
                      d.getDate() === dataSelecionadaReserva.getDate() &&
                      d.getMonth() === dataSelecionadaReserva.getMonth();
                    const sem = d.toLocaleDateString('pt-BR', { weekday: 'short' });

                    return (
                      <Pressable
                        key={index}
                        onPress={() => setDataSelecionadaReserva(d)}
                        style={[
                          styles.dayPill,
                          isSel ? styles.dayPillActive : styles.dayPillIdle,
                        ]}
                      >
                        <Text style={[styles.daySem, isSel && styles.dayTextActive]}>
                          {sem.toUpperCase()}
                        </Text>
                        <Text style={[styles.dayNum, isSel && styles.dayTextActive]}>
                          {d.getDate()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Seleção do Turno */}
                <Text style={styles.inputLabel}>Selecione o Turno:</Text>
                <View style={{ gap: 6 }}>
                  {[
                    { id: 'manha', nome: 'Turno Manhã (10:00 às 13:30)' },
                    { id: 'tarde', nome: 'Turno Tarde (14:00 às 19:00)' },
                    { id: 'diaria', nome: 'Diária Completa (Dia Todo)' },
                  ].map((turn) => {
                    const isSel = turnoSelecionadoReserva === turn.id;
                    return (
                      <Pressable
                        key={turn.id}
                        onPress={() => setTurnoSelecionadoReserva(turn.id)}
                        style={[
                          styles.turnOptionItem,
                          isSel ? styles.turnOptionActive : styles.turnOptionIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.turnOptionText,
                            isSel && styles.turnOptionTextActive,
                          ]}
                        >
                          {turn.nome}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Resumo Financeiro */}
                <View style={styles.resumoFinBox}>
                  <View style={styles.resumoFinRow}>
                    <Text style={styles.resumoFinLabel}>Total:</Text>
                    <Text style={styles.resumoFinVal}>
                      R$ {quoteAtivoParaReserva?.valorTotal.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.resumoFinRowHighlight}>
                    <Text style={styles.resumoFinLabelHighlight}>Sinal de Entrada:</Text>
                    <Text style={styles.resumoFinValHighlight}>
                      R$ {quoteAtivoParaReserva?.valorSinal.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.btnConfirmarProposta}
                  onPress={handleGerarPixHold}
                  disabled={processandoPagamento}
                >
                  {processandoPagamento ? (
                    <ActivityIndicator color="#111" size="small" />
                  ) : (
                    <>
                      <QrCode size={18} color="#111" />
                      <Text style={styles.btnConfirmarPropostaText}>
                        Pagar Sinal (R$ {quoteAtivoParaReserva?.valorSinal.toFixed(2)})
                      </Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            )}

            {etapaReserva === 2 && (
              <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
                {/* Hold 30min */}
                <View style={styles.holdBannerChat}>
                  <Clock size={16} color="#f3c21a" />
                  <Text style={styles.holdBannerChatText}>
                    Horário bloqueado provisoriamente por mais{' '}
                    <Text style={{ fontWeight: '900', color: '#fff' }}>
                      {formatoMinutosSegundos(segundosRestantesHold)} min
                    </Text>
                  </Text>
                </View>

                {/* QR Code Pix */}
                <View style={styles.pixCardChat}>
                  <QrCode size={100} color="#f3c21a" />
                  <Text style={styles.pixLabelChat}>PIX SEGURO EM CUSTÓDIA</Text>
                  <Text style={styles.pixValChat}>
                    R$ {quoteAtivoParaReserva?.valorSinal.toFixed(2)}
                  </Text>

                  <Pressable
                    style={styles.btnCopyPixChat}
                    onPress={() => {
                      setPixCopiado(true);
                      setTimeout(() => setPixCopiado(false), 2000);
                    }}
                  >
                    <Copy size={14} color="#111" />
                    <Text style={styles.btnCopyPixChatText}>
                      {pixCopiado ? 'Chave Copiada!' : 'Copiar Chave Pix'}
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.btnFinalizarSinalChat}
                  onPress={handleConfirmarSinalNoChat}
                  disabled={processandoPagamento}
                >
                  {processandoPagamento ? (
                    <ActivityIndicator color="#111" size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#111" />
                      <Text style={styles.btnFinalizarSinalChatText}>
                        Confirmar Pagamento do Sinal
                      </Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </AppModal>

      {/* MODAL 3: FICHA DE ANAMNESE (Ação do Cliente - Fase 5) */}
      <AppModal
        visible={modalAnamneseAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAnamneseAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ficha de Anamnese & Biossegurança</Text>
                <Text style={styles.modalSub}>
                  Protocolo de saúde pré-procedimento com {conversaAtiva?.nome}
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalAnamneseAberto(false)}
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
              {/* Alergias */}
              <Pressable
                style={styles.anamneseCheckItem}
                onPress={() => setTemAlergia(!temAlergia)}
              >
                <View
                  style={[
                    styles.checkSquare,
                    temAlergia && styles.checkSquareActive,
                  ]}
                >
                  {temAlergia && <Check size={12} color="#111" />}
                </View>
                <Text style={styles.anamneseCheckText}>
                  Possui alergia a pigmentos, látex ou pomadas cicatrizantes?
                </Text>
              </Pressable>
              {temAlergia && (
                <TextInput
                  value={detalheAlergia}
                  onChangeText={setDetalheAlergia}
                  placeholder="Especifique a alergia..."
                  placeholderTextColor="#666"
                  style={styles.modalInput}
                />
              )}

              {/* Queloides */}
              <Pressable
                style={styles.anamneseCheckItem}
                onPress={() => setTemQueloide(!temQueloide)}
              >
                <View
                  style={[
                    styles.checkSquare,
                    temQueloide && styles.checkSquareActive,
                  ]}
                >
                  {temQueloide && <Check size={12} color="#111" />}
                </View>
                <Text style={styles.anamneseCheckText}>
                  Histórico de queloides ou cicatrização hipertrófica?
                </Text>
              </Pressable>

              {/* Anticoagulantes */}
              <Pressable
                style={styles.anamneseCheckItem}
                onPress={() => setUsaAnticoagulante(!usaAnticoagulante)}
              >
                <View
                  style={[
                    styles.checkSquare,
                    usaAnticoagulante && styles.checkSquareActive,
                  ]}
                >
                  {usaAnticoagulante && <Check size={12} color="#111" />}
                </View>
                <Text style={styles.anamneseCheckText}>
                  Faz uso contínuo de anticoagulantes ou aspirina?
                </Text>
              </Pressable>

              {/* Gestante / Lactante */}
              <Pressable
                style={styles.anamneseCheckItem}
                onPress={() => setIsGestanteLactante(!isGestanteLactante)}
              >
                <View
                  style={[
                    styles.checkSquare,
                    isGestanteLactante && styles.checkSquareActive,
                  ]}
                >
                  {isGestanteLactante && <Check size={12} color="#111" />}
                </View>
                <Text style={styles.anamneseCheckText}>
                  Está gestante ou em período de lactação?
                </Text>
              </Pressable>
            </ScrollView>

            <Pressable
              style={styles.btnConfirmarProposta}
              onPress={handleSalvarFichaAnamnese}
              disabled={salvandoAnamnese}
            >
              {salvandoAnamnese ? (
                <ActivityIndicator color="#111" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#111" />
                  <Text style={styles.btnConfirmarPropostaText}>
                    Assinar & Enviar Ficha no Chat
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </AppModal>

      {/* MODAL 4: CONCLUIR SESSÃO & EMITIR NFS-E (Fase 6) */}
      <AppModal
        visible={modalConcluirSessaoAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalConcluirSessaoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Concluir Sessão & Emitir NFS-e</Text>
                <Text style={styles.modalSub}>
                  Finalize o procedimento de {conversaAtiva?.nome} e gere a documentação fiscal
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalConcluirSessaoAberto(false)}
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              {/* Resumo Financeiro da Sessão */}
              <View style={styles.resumoFinModalWrap}>
                <View style={styles.resumoFinRowModal}>
                  <Text style={styles.resumoFinModalLabel}>Valor Total do Procedimento:</Text>
                  <Text style={styles.resumoFinModalValTotal}>
                    R$ {Number((ultimaProposta?.card_payload as CardQuotePayload)?.valorTotal || 800).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.resumoFinRowModal}>
                  <Text style={styles.resumoFinModalLabel}>Sinal já Pago (Mercado Pago):</Text>
                  <Text style={styles.resumoFinModalValSinal}>
                    - R$ {Number((ultimoSinal?.card_payload as CardDepositPayload)?.valorSinal || 240).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.dividerFinModal} />

                <View style={styles.resumoFinRowModalHighlight}>
                  <Text style={styles.resumoFinModalLabelHighlight}>Saldo a Liquidar Hoje:</Text>
                  <Text style={styles.resumoFinModalValHighlight}>
                    R$ {Math.max(
                      0,
                      Number((ultimaProposta?.card_payload as CardQuotePayload)?.valorTotal || 800) -
                        Number((ultimoSinal?.card_payload as CardDepositPayload)?.valorSinal || 240)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Forma de Pagamento do Saldo Restante */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Forma de Pagamento do Saldo Restante</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { id: 'pix', label: 'PIX Presencial' },
                    { id: 'cartao', label: 'Cartão' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                  ].map((m) => {
                    const isSel = metodoPagamentoSaldo === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMetodoPagamentoSaldo(m.id as any)}
                        style={[
                          styles.metodoSaldoItem,
                          isSel && styles.metodoSaldoItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.metodoSaldoText,
                            isSel && styles.metodoSaldoTextActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Opção de Emissão de Nota Fiscal (NFS-e) */}
              <Pressable
                style={styles.nfseCheckOption}
                onPress={() => setEmitirNfseAutomatica(!emitirNfseAutomatica)}
              >
                <View
                  style={[
                    styles.checkSquare,
                    emitirNfseAutomatica && styles.checkSquareActive,
                  ]}
                >
                  {emitirNfseAutomatica && <Check size={12} color="#111" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nfseCheckTitle}>Emitir Nota Fiscal de Serviço (NFS-e)</Text>
                  <Text style={styles.nfseCheckSub}>
                    Gera e registra a NFS-e eletrônica oficial e disponibiliza o recibo no chat
                  </Text>
                </View>
              </Pressable>
            </ScrollView>

            <Pressable
              style={styles.btnConfirmarConclusao}
              onPress={handleConfirmarRealizacaoSessao}
              disabled={concluindoSessao}
            >
              {concluindoSessao ? (
                <ActivityIndicator color="#111" size="small" />
              ) : (
                <>
                  <Sparkles size={18} color="#111" />
                  <Text style={styles.btnConfirmarConclusaoText}>
                    Confirmar Realização & Emitir NFS-e
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </AppModal>

      {/* MODAL 5: NFS-E / RECIBO FISCAL DANFSE V1.0 */}
      <DanfseDocumentoModal
        visivel={modalReciboAberto}
        dadosNotaOuRecibo={reciboAtivo}
        perfilTatuador={isArtista ? perfilAtual : conversaAtiva}
        perfilCliente={!isArtista ? perfilAtual : conversaAtiva}
        onClose={() => setModalReciboAberto(false)}
      />

      {/* MODAL 6: GUIA DE CICATRIZAÇÃO (AFTERCARE) */}
      <AftercareModal
        visivel={modalAftercareAberto}
        artistaNome={isArtista ? perfilAtual.nome_exibicao : conversaAtiva?.nome}
        onClose={() => setModalAftercareAberto(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070707',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16161a',
  },
  topHeaderTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  topHeaderSubtitle: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121216',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#202028',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 12,
  },
  loadingWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#888',
    fontSize: 11,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  conversasListScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#141418',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1a1a22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#070707',
  },
  conversaInfo: {
    flex: 1,
    gap: 2,
  },
  conversaNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversaName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  conversaNameUnread: {
    fontWeight: '900',
    color: '#f3c21a',
  },
  conversaHora: {
    color: '#666',
    fontSize: 10,
  },
  conversaEstudio: {
    color: '#888',
    fontSize: 10,
  },
  conversaSnippetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  conversaLastMsg: {
    color: '#666',
    fontSize: 11,
    flex: 1,
    paddingRight: 6,
  },
  conversaLastMsgUnread: {
    color: '#ddd',
    fontWeight: '600',
  },
  unreadCounterBadge: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadCounterText: {
    color: '#111',
    fontSize: 10,
    fontWeight: '900',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#070707',
  },
  activeChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0e0e12',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
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
  },
  activeChatAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1c24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: '#0e0e12',
  },
  activeChatHeaderInfo: {
    flex: 1,
    gap: 1,
  },
  activeChatName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  activeChatSubtitle: {
    color: '#888',
    fontSize: 10,
  },
  onlineText: {
    color: '#10b981',
    fontWeight: '700',
  },
  topBtnProposta: {
    backgroundColor: '#f3c21a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topBtnPropostaText: {
    color: '#111',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dateSeparatorWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    color: '#666',
    fontSize: 10,
    backgroundColor: '#14141a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontWeight: '700',
  },
  bubbleWrap: {
    flexDirection: 'row',
  },
  bubbleWrapMe: {
    justifyContent: 'flex-end',
  },
  bubbleWrapOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  bubbleMe: {
    backgroundColor: '#262633',
    borderBottomRightRadius: 3,
  },
  bubbleOther: {
    backgroundColor: '#14141a',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#202028',
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTextOther: {
    color: '#eee',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  bubbleTime: {
    fontSize: 9,
  },
  bubbleTimeMe: {
    color: '#aaa',
  },
  bubbleTimeOther: {
    color: '#666',
  },
  readReceiptWrap: {
    marginLeft: 2,
  },
  cardContainerWrapper: {
    marginVertical: 4,
  },
  briefingCard: {
    backgroundColor: '#131318',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38321a',
    padding: 14,
    gap: 10,
  },
  briefingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#221f14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  briefingCardTitle: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '800',
  },
  briefingCardSub: {
    color: '#888',
    fontSize: 10,
  },
  statusBadgeYellow: {
    backgroundColor: '#241f0f',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#544415',
  },
  statusBadgeYellowText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '800',
  },
  briefingImagesSection: {
    gap: 4,
  },
  cardSectionLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  briefingThumbRow: {
    gap: 6,
    paddingVertical: 2,
  },
  briefingThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  anatomyThumbBox: {
    gap: 4,
  },
  anatomyThumbImg: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  briefingMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1c1c24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: '#ddd',
    fontSize: 10,
    fontWeight: '700',
  },
  availabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1810',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#383015',
  },
  availabilityText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '700',
  },
  briefingDescText: {
    color: '#bbb',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  btnCardActionPrimary: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  btnCardActionPrimaryText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  quoteCard: {
    backgroundColor: '#121516',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#19382c',
    padding: 14,
    gap: 10,
  },
  quoteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIconWrapGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#12241b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteCardTitle: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  quoteCardSub: {
    color: '#888',
    fontSize: 10,
  },
  statusBadgeGreen: {
    backgroundColor: '#0f241a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e543b',
  },
  statusBadgeGreenText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },
  quoteFinBox: {
    backgroundColor: '#0d1211',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2b23',
    padding: 10,
    gap: 6,
  },
  quoteFinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteFinRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15241d',
    padding: 8,
    borderRadius: 8,
  },
  quoteFinLabel: {
    color: '#888',
    fontSize: 11,
  },
  quoteFinValTotal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  quoteFinLabelHighlight: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  quoteFinSubHighlight: {
    color: '#666',
    fontSize: 8,
  },
  quoteFinValHighlight: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '900',
  },
  quoteFinVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  quoteObsText: {
    color: '#888',
    fontSize: 10,
  },
  btnBookFromQuote: {
    backgroundColor: '#f3c21a',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnBookFromQuoteText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  depositConfirmedCard: {
    backgroundColor: '#101814',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#194d34',
    padding: 12,
    gap: 8,
  },
  depositConfirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  depositConfirmedTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  depositConfirmedSub: {
    color: '#aaa',
    fontSize: 10,
  },
  depositProtocolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a2e23',
    paddingTop: 6,
  },
  depositProtocolKey: {
    color: '#666',
    fontSize: 9,
  },
  depositProtocolVal: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
  },
  anamneseCard: {
    backgroundColor: '#18150c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4d3a0a',
    padding: 12,
    gap: 8,
  },
  anamneseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anamneseCardTitle: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
  },
  anamneseCardSub: {
    color: '#aaa',
    fontSize: 10,
  },
  btnPreencherAnamneseChat: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  btnPreencherAnamneseChatText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  anamneseSignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  anamneseSignedBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  anamnesePendenteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  anamnesePendenteBadgeText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '700',
  },
  artistActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0e0e12',
    borderTopWidth: 1,
    borderTopColor: '#1c1c24',
  },
  btnPropostaArtist: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnPropostaArtistText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0e0e12',
    borderTopWidth: 1,
    borderTopColor: '#1c1c24',
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#16161e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262633',
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
    maxHeight: 90,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3c21a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0e0e12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 20,
    maxHeight: '90%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
    paddingBottom: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSub: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#16161e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262633',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
  },
  modalTextArea: {
    backgroundColor: '#16161e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262633',
    padding: 10,
    color: '#fff',
    fontSize: 11,
    textAlignVertical: 'top',
  },
  turnOptionItem: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  turnOptionActive: {
    backgroundColor: '#1a1810',
    borderColor: '#f3c21a',
  },
  turnOptionIdle: {
    backgroundColor: '#14141a',
    borderColor: '#22222c',
  },
  turnOptionText: {
    color: '#888',
    fontSize: 11,
  },
  turnOptionTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  btnConfirmarProposta: {
    backgroundColor: '#f3c21a',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  btnConfirmarPropostaText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  daysRow: {
    gap: 8,
    paddingVertical: 4,
  },
  dayPill: {
    width: 60,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dayPillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  dayPillIdle: {
    backgroundColor: '#14141a',
    borderColor: '#242430',
  },
  daySem: {
    fontSize: 9,
    fontWeight: '800',
    color: '#777',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  dayTextActive: {
    color: '#111',
  },
  resumoFinBox: {
    backgroundColor: '#14141a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 10,
    gap: 4,
  },
  resumoFinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoFinRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#20202a',
    paddingTop: 4,
    marginTop: 2,
  },
  resumoFinLabel: {
    color: '#888',
    fontSize: 11,
  },
  resumoFinVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  resumoFinLabelHighlight: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
  },
  resumoFinValHighlight: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
  },
  holdBannerChat: {
    backgroundColor: '#18150c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#543f07',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  holdBannerChatText: {
    color: '#f3c21a',
    fontSize: 11,
    flex: 1,
  },
  pixCardChat: {
    backgroundColor: '#121217',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262633',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  pixLabelChat: {
    color: '#888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pixValChat: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  btnCopyPixChat: {
    backgroundColor: '#f3c21a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
  },
  btnCopyPixChatText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
  },
  btnFinalizarSinalChat: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnFinalizarSinalChatText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  anamneseCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#14141a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22222c',
  },
  checkSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#1b1b22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkSquareActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  anamneseCheckText: {
    color: '#ccc',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  feedbackToastWrap: {
    backgroundColor: '#1b1b22',
    borderTopWidth: 1,
    borderTopColor: '#f3c21a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  feedbackToastText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  sessionReadyActionBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0e0e12',
    borderTopWidth: 1,
    borderTopColor: '#1c1c24',
    flexDirection: 'row',
    gap: 8,
  },
  btnConfirmarSessaoArtist: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnConfirmarSessaoArtistText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  btnAvancarTempoDebug: {
    backgroundColor: '#191812',
    borderWidth: 1,
    borderColor: '#543f07',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnAvancarTempoDebugText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  sessionCompletedCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#3a331a',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sessionCompletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderIconWrapGold: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCompletedTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  sessionCompletedSub: {
    color: '#999',
    fontSize: 10,
    marginTop: 1,
  },
  statusBadgeGold: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeGoldText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  completedFinBox: {
    backgroundColor: '#17171d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 10,
    gap: 6,
  },
  completedFinValTotal: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '900',
  },
  completedFinRowBreakdown: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#22222e',
  },
  completedFinSubText: {
    color: '#888',
    fontSize: 10,
  },
  nfseDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  nfseDocText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  completedActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnVerReciboChat: {
    flex: 1,
    backgroundColor: '#f3c21a',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnVerReciboChatText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
  },
  btnVerAftercareChat: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnVerAftercareChatText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  resumoFinModalWrap: {
    backgroundColor: '#14141c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242434',
    padding: 12,
    gap: 8,
  },
  resumoFinRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoFinModalLabel: {
    color: '#aaa',
    fontSize: 11,
  },
  resumoFinModalValTotal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resumoFinModalValSinal: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  dividerFinModal: {
    height: 1,
    backgroundColor: '#262638',
  },
  resumoFinRowModalHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoFinModalLabelHighlight: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  resumoFinModalValHighlight: {
    color: '#f3c21a',
    fontSize: 16,
    fontWeight: '900',
  },
  metodoSaldoItem: {
    flex: 1,
    backgroundColor: '#14141c',
    borderWidth: 1,
    borderColor: '#262636',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metodoSaldoItemActive: {
    backgroundColor: '#1d190d',
    borderColor: '#f3c21a',
  },
  metodoSaldoText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
  },
  metodoSaldoTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  nfseCheckOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#14141c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242434',
    padding: 10,
  },
  nfseCheckTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  nfseCheckSub: {
    color: '#888',
    fontSize: 10,
    marginTop: 1,
  },
  btnConfirmarConclusao: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  btnConfirmarConclusaoText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
