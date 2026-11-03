import { avisar } from '@/services/feedback';
import { demoAtiva } from '@/services/apresentacao-store';
import { copiarTexto } from '@/services/documentos-mobile';
import { ds } from '@/theme/design-system';
import { AppModal } from '@/components/ui/app-modal';
import { ChatService } from '@/services/chat-service';
import { confirmarSinalSimulado, criarCobrancaSinal } from '@/services/mercadopago';
import { supabase } from '@/services/data-client';
import type { CartaoArtista } from '@/telas/cliente/inicio-tab';
import type { ItemPortfolio } from '@/types/artista-detalhado';
import type { CardBriefingPayload } from '@/types/chat';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  FileHeart,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { PerfilUsuario } from '@/types/auth';
import { createThemedStyles, tc } from '@/theme';

interface ModalReservaProps {
  visivel: boolean;
  artista: CartaoArtista | null;
  flashInicial?: ItemPortfolio | {
    id: string;
    titulo: string;
    imagemUrl: string;
    preco?: number;
    estilo?: string;
  } | null;
  onClose: () => void;
  onSucesso: () => void;
  onRedirecionarChat?: (artistaId: string) => void;
  perfilAtual?: PerfilUsuario | null;
}

export type TipoSessao = 'flash' | 'exclusivo';
export type TipoTurno = 'manha' | 'tarde' | 'diaria';

interface OpcaoTurno {
  id: TipoTurno;
  nome: string;
  horarioInicio: string;
  horarioTexto: string;
  duracaoEstimada: string;
  icone: any;
  recomendadoPara: string;
  tag: string;
}

const TURNOS: OpcaoTurno[] = [
  {
    id: 'manha',
    nome: 'Turno Manhã',
    horarioInicio: '10:00',
    horarioTexto: '10:00 às 13:30',
    duracaoEstimada: '~3 horas',
    icone: Sun,
    recomendadoPara: 'Flashes autorais e peças médias',
    tag: 'Rápido & Médio',
  },
  {
    id: 'tarde',
    nome: 'Turno Tarde',
    horarioInicio: '14:00',
    horarioTexto: '14:00 às 19:00',
    duracaoEstimada: '~5 horas',
    icone: Sunset,
    recomendadoPara: 'Projetos autorais e sessões detalhadas',
    tag: 'Mais Popular',
  },
  {
    id: 'diaria',
    nome: 'Diária Completa',
    horarioInicio: '10:00',
    horarioTexto: '10:00 às 19:00 (Dia Todo)',
    duracaoEstimada: '~8 horas',
    icone: Zap,
    recomendadoPara: 'Fechamentos de braço, costas e realismo',
    tag: 'Exclusividade Total',
  },
];

const LOCAIS_CORPO = [
  'Antebraço',
  'Braço / Bíceps',
  'Costela',
  'Coxa',
  'Panturrilha',
  'Costas',
  'Ombro',
  'Peito',
  'Mão / Pulso',
  'Tornozelo',
];

const TAMANHOS_CM = [
  { id: 'mini', label: '5 a 8 cm (Mini/Pequena)', fator: 1, cmMedio: 7 },
  { id: 'medio', label: '10 a 15 cm (Média)', fator: 1.4, cmMedio: 13 },
  { id: 'grande', label: '18 a 25 cm (Grande)', fator: 2.1, cmMedio: 20 },
  { id: 'fechamento', label: 'Fechamento / Grande Área', fator: 3.5, cmMedio: 35 },
];

const DISPONIBILIDADES = [
  'Sextas ou sábados à tarde',
  'Dias de semana pela manhã (10h)',
  'Dias de semana à tarde (14h)',
  'Finais de semana (integral)',
  'Qualquer dia / Horário flexível',
];

export function ModalReservaCliente({
  visivel,
  artista,
  flashInicial,
  onClose,
  onSucesso,
  onRedirecionarChat,
  perfilAtual,
}: ModalReservaProps) {
  // Etapas: 1 = Briefing do Projeto, 2 = Data & Turno, 3 = Sinal Pix (Hold 30m), 4 = Sucesso
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1);
  const [carregando, setCarregando] = useState(false);

  // Etapa 1: Briefing do Projeto
  const [tipoSessao, setTipoSessao] = useState<TipoSessao>(flashInicial ? 'flash' : 'exclusivo');
  const [flashSelecionado, setFlashSelecionado] = useState<any>(flashInicial || null);
  const [flashesArtista, setFlashesArtista] = useState<any[]>([]);
  const [carregandoFlashes, setCarregandoFlashes] = useState(false);

  // Briefing exclusivo
  const [descricaoArte, setDescricaoArte] = useState('');
  const [localCorpo, setLocalCorpo] = useState('Antebraço');
  const [fotoLocalCorpo, setFotoLocalCorpo] = useState<string | null>(null);
  const [tamanhoCm, setTamanhoCm] = useState('10 a 15 cm (Média)');
  const [tamanhoNumericoCm, setTamanhoNumericoCm] = useState(13);
  const [fatorTamanho, setFatorTamanho] = useState(1.4);
  const [disponibilidade, setDisponibilidade] = useState('Sextas ou sábados à tarde');
  const [referenciasUrls, setReferenciasUrls] = useState<string[]>([]);
  const [inputCustomUrl, setInputCustomUrl] = useState('');
  const [mostrarInputUrl, setMostrarInputUrl] = useState(false);
  const [upandoFoto, setUpandoFoto] = useState(false);

  // Etapa 2: Data & Turno
  const [dataSelecionada, setDataSelecionada] = useState<Date>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  );
  const [turnoSelecionado, setTurnoSelecionado] = useState<TipoTurno>('tarde');

  // Etapa 3: Hold 30min & Sinal Pix
  const [segundosRestantes, setSegundosRestantes] = useState(1800); // 30 minutos
  const [cobrancaPix, setCobrancaPix] = useState<{
    qrCodePayload: string;
    qrCodeBase64?: string;
    paymentId: string;
    valor: number;
  } | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [protocoloReserva, setProtocoloReserva] = useState('');

  // Sincroniza flash inicial quando o modal abre
  useEffect(() => {
    if (flashInicial) {
      setTipoSessao('flash');
      setFlashSelecionado(flashInicial);
    } else {
      setTipoSessao('exclusivo');
      setFlashSelecionado(null);
    }
  }, [flashInicial, visivel]);

  // Carrega catálogo de flashes do artista
  useEffect(() => {
    if (visivel && artista?.id) {
      carregarFlashesArtista();
    }
  }, [visivel, artista?.id]);

  // Temporizador de Reserva (Hold de 30 minutos)
  useEffect(() => {
    let timer: any = null;
    if (etapa === 3 && segundosRestantes > 0) {
      timer = setInterval(() => {
        setSegundosRestantes((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [etapa, segundosRestantes]);

  // Cálculo financeiro transparente
  const valorTotalEstimado = useMemo(() => {
    if (tipoSessao === 'flash' && flashSelecionado) {
      return Number(flashSelecionado.preco || artista?.precoInicial || 350);
    }
    const base = artista?.precoInicial || 350;
    if (turnoSelecionado === 'diaria') {
      return Math.round(base * 3.2);
    }
    return Math.round(base * fatorTamanho);
  }, [tipoSessao, flashSelecionado, artista?.precoInicial, fatorTamanho, turnoSelecionado]);

  // Regra de Sinal (30% do total ou mínimo de R$ 100)
  const valorSinalCalculado = Math.max(100, Math.round(valorTotalEstimado * 0.3));
  const saldoRestanteEstudio = Math.max(0, valorTotalEstimado - valorSinalCalculado);

  const carregarFlashesArtista = async () => {
    if (!artista?.id) return;
    setCarregandoFlashes(true);
    try {
      const { data, error } = await supabase
        .from('flashes_portfolio')
        .select('*')
        .eq('artista_id', artista.id)
        .eq('disponivel', true)
        .order('criado_em', { ascending: false });

      if (!error && data && data.length > 0) {
        setFlashesArtista(data);
        if (tipoSessao === 'flash' && !flashSelecionado) {
          setFlashSelecionado(data[0]);
        }
      } else {
        const fallback = [
          {
            id: 'f1',
            titulo: 'Flash Flor de Lótus',
            imagem_url:
              'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=600&auto=format&fit=crop&q=80',
            preco: artista?.precoInicial || 350,
            estilo: artista?.estilo || 'Fine Line',
          },
          {
            id: 'f2',
            titulo: 'Flash Geometria Sagrada',
            imagem_url:
              'https://images.unsplash.com/photo-1590246814883-57c511e76523?w=600&auto=format&fit=crop&q=80',
            preco: (artista?.precoInicial || 350) + 50,
            estilo: artista?.estilo || 'Blackwork',
          },
        ];
        setFlashesArtista(fallback);
      }
    } catch {
      // silencioso
    } finally {
      setCarregandoFlashes(false);
    }
  };

  const formatoMinutosSegundos = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  /**
   * Upload / Seleção de fotos da galeria ou arquivos do celular/computador
   */
  const escolherFotoGaleria = async () => {
    if (referenciasUrls.length >= 3) {
      avisar('Você pode enviar no máximo 3 fotos de referência.');
      return;
    }

    setUpandoFoto(true);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setReferenciasUrls((prev) => [...prev, result]);
            }
            setUpandoFoto(false);
          };
          reader.onerror = () => setUpandoFoto(false);
          reader.readAsDataURL(file);
        } else {
          setUpandoFoto(false);
        }
      };
      fileInput.click();
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        avisar('Precisamos de permissão para acessar suas fotos.');
        setUpandoFoto(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fotoUri = result.assets[0].uri;
        setReferenciasUrls((prev) => [...prev, fotoUri]);
      }
    } catch (err) {
      console.warn('Erro ao selecionar foto:', err);
    } finally {
      setUpandoFoto(false);
    }
  };

  /**
   * Upload opcional de foto da região anatômica do corpo
   */
  const escolherFotoRegiaoCorpo = async () => {
    setUpandoFoto(true);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setFotoLocalCorpo(result);
            }
            setUpandoFoto(false);
          };
          reader.onerror = () => setUpandoFoto(false);
          reader.readAsDataURL(file);
        } else {
          setUpandoFoto(false);
        }
      };
      fileInput.click();
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        avisar('Precisamos de permissão para acessar suas fotos.');
        setUpandoFoto(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoLocalCorpo(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Erro ao selecionar foto do local:', err);
    } finally {
      setUpandoFoto(false);
    }
  };

  const removerFoto = (index: number) => {
    setReferenciasUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const adicionarUrlCustomizada = () => {
    if (!inputCustomUrl.trim()) return;
    if (referenciasUrls.length >= 3) {
      avisar('Você pode selecionar no máximo 3 referências.');
      return;
    }
    setReferenciasUrls([...referenciasUrls, inputCustomUrl.trim()]);
    setInputCustomUrl('');
    setMostrarInputUrl(false);
  };

  /**
   * FASE 1: Disparo do Envio do Briefing
   * Cria o agendamento inicial, envia card briefing no chat e redireciona para o chat!
   */
  const handleEnviarBriefingParaChat = async () => {
    if (!artista) return;
    setCarregando(true);

    try {
      let clienteId = perfilAtual?.id || perfilAtual?.uid;

      if (!clienteId) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            clienteId = (perfilAtual?.id || perfilAtual?.uid || session?.user?.id!);
          }
        } catch {
          // silencioso
        }
      }

      if (!clienteId) {
        clienteId = '99999999-9999-9999-9999-999999999999';
      }

      const descricaoFinal =
        tipoSessao === 'flash'
          ? `[Flash Autoral] ${flashSelecionado?.titulo || 'Flash'} • ${localCorpo}`
          : descricaoArte ||
            `[Projeto Exclusivo] Tatuagem ${artista.estilo} (${localCorpo}, ~${tamanhoNumericoCm}cm)`;

      // Uma reserva precisa existir antes de ser referenciada no chat.
        const { data: agendamentoCriado, error: errAgendamento } = await supabase
          .from('agendamentos')
          .insert({
            cliente_id: clienteId,
            artista_id: artista.id,
            data_horario: dataSelecionada.toISOString(),
            estilo: artista.estilo,
            descricao: descricaoFinal,
            local_corpo: localCorpo,
            tamanho_cm: `${tamanhoNumericoCm} cm (${tamanhoCm})`,
            tipo_sessao: tipoSessao,
            referencias_urls: referenciasUrls,
            status: 'pendente',
            sinal_pago: false,
            valor_total: valorTotalEstimado,
            valor_sinal: valorSinalCalculado,
          })
          .select('id')
          .single();

        if (errAgendamento || !agendamentoCriado?.id) throw new Error('Não foi possível registrar a reserva. Confira a conexão e tente novamente.');
        const bookingId = agendamentoCriado.id;

      // 2. Dispara card de Briefing no chat
      const payloadBriefing: CardBriefingPayload = {
        agendamentoId: bookingId,
        referenciasUrls,
        fotoLocalCorpoUrl: fotoLocalCorpo || undefined,
        localCorpo,
        tamanhoCm: `${tamanhoNumericoCm} cm`,
        tamanhoNumericoCm,
        descricao: descricaoFinal,
        disponibilidadePreferencial: disponibilidade,
        estilo: artista.estilo,
        flashTitulo: tipoSessao === 'flash' ? flashSelecionado?.titulo : undefined,
        flashImagemUrl:
          tipoSessao === 'flash'
            ? flashSelecionado?.imagem_url || flashSelecionado?.imagemUrl
            : undefined,
        valorEstimadoBase: valorTotalEstimado,
      };

      await ChatService.enviarBriefing(clienteId, artista.id, payloadBriefing);

      onClose();

      if (onRedirecionarChat) {
        onRedirecionarChat(artista.id);
      } else {
        onSucesso();
      }
    } catch (err) {
      console.warn('Erro ao enviar briefing:', err);
      avisar(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setCarregando(false);
    }
  };

  const avancarParaTurnos = () => {
    if (tipoSessao === 'flash' && !flashSelecionado && flashesArtista.length > 0) {
      setFlashSelecionado(flashesArtista[0]);
    }
    setEtapa(2);
  };

  const avancarParaSinalPix = async () => {
    if (!artista) return;
    setCarregando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user && !demoAtiva()) return;

      const turnoObj = TURNOS.find((t) => t.id === turnoSelecionado) || TURNOS[1];
      const dataHorarioCombinada = new Date(dataSelecionada);
      const [hh, mm] = turnoObj.horarioInicio.split(':');
      dataHorarioCombinada.setHours(Number(hh), Number(mm), 0, 0);

      const descricaoFinal =
        tipoSessao === 'flash'
          ? `[Flash Autoral] ${flashSelecionado?.titulo || 'Flash'} • ${localCorpo}`
          : descricaoArte ||
            `[Projeto Exclusivo] Tatuagem ${artista.estilo} (${localCorpo}, ${tamanhoCm})`;

      // Cria o agendamento pré-reservado no Supabase
      const { data: agendamentoCriado, error: errAgendamento } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: (perfilAtual?.id || perfilAtual?.uid || session?.user?.id!),
          artista_id: artista.id,
          data_horario: dataHorarioCombinada.toISOString(),
          estilo: artista.estilo,
          descricao: descricaoFinal,
          local_corpo: localCorpo,
          tamanho_cm: tipoSessao === 'flash' ? 'Tamanho Original Flash' : tamanhoCm,
          turno: turnoSelecionado,
          tipo_sessao: tipoSessao,
          referencias_urls: referenciasUrls,
          valor_sinal: valorSinalCalculado,
          valor_total: valorTotalEstimado,
          status: 'pendente',
          sinal_pago: false,
        })
        .select('id')
        .single();

      if (errAgendamento || !agendamentoCriado) {
        throw new Error('Falha ao registrar agendamento.');
      }

      // Gera cobrança Pix via Mercado Pago em custódia
      const cobranca = await criarCobrancaSinal({
        agendamentoId: agendamentoCriado.id,
        artistaId: artista.id,
        clienteId: (perfilAtual?.id || perfilAtual?.uid || session?.user?.id!),
        valorSinal: valorSinalCalculado,
        artistaNome: artista.nomeArtista,
        cidade: artista.cidade,
        descricao: `Sinal Reserva #${agendamentoCriado.id.slice(0, 8)} - ${artista.nomeArtista}`,
      });

      setCobrancaPix(cobranca);
      setProtocoloReserva(agendamentoCriado.id.substring(0, 8).toUpperCase());
      setSegundosRestantes(1800);
      setEtapa(3);
    } catch (err) {
      console.warn('Erro ao gerar cobrança de sinal:', err);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarSinalPago = async () => {
    setCarregando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if ((session?.user || demoAtiva()) && artista && cobrancaPix) {
        const { data: reserva, error } = await supabase.from('agendamentos').select('id').eq('mercado_pago_id', cobrancaPix.paymentId).single();
        if (error || !reserva?.id) throw new Error('Reserva não encontrada. Gere o sinal novamente.');
        await confirmarSinalSimulado(reserva.id);
        const turnoObj = TURNOS.find((t) => t.id === turnoSelecionado) || TURNOS[1];
        await ChatService.enviarConfirmacaoSinal((perfilAtual?.id || perfilAtual?.uid || session?.user?.id!), artista.id, {
          agendamentoId: reserva.id,
          valorSinal: valorSinalCalculado,
          dataHorarioFormatada: `${dataSelecionada.toLocaleDateString('pt-BR')} às ${turnoObj.horarioInicio}`,
          turnoNome: turnoObj.nome,
          protocoloReserva: `DERM-RES-${protocoloReserva}`,
        });
      }

      setEtapa(4);
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível confirmar o sinal.');
    } finally {
      setCarregando(false);
    }
  };

  const copiarChavePix = async () => {
    if (!cobrancaPix?.qrCodePayload) return;
    try { await copiarTexto(cobrancaPix.qrCodePayload); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 2500); }
    catch { avisar('Não foi possível copiar o código.'); }
  };

  const voltarEtapa = () => {
    if (etapa > 1 && etapa < 4) {
      setEtapa((prev) => (prev - 1) as any);
    } else {
      onClose();
    }
  };

  const diasDisponiveis = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  if (!visivel || !artista) {
    return null;
  }

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header com Navegação e Indicador de Progresso */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={voltarEtapa}>
              <ChevronLeft size={20} color={tc(ds.cores.texto)} />
            </Pressable>

            <View style={styles.progressWrap}>
              <View style={styles.progressPills}>
                {[1, 2, 3, 4].map((p) => (
                  <View
                    key={p}
                    style={[
                      styles.pill,
                      etapa === p ? styles.pillActive : etapa > p ? styles.pillDone : styles.pillIdle,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.progressText}>
                {etapa === 1 && 'Fase 1 • Briefing & Pedido'}
                {etapa === 2 && 'Fase 4 • Data & Turno'}
                {etapa === 3 && 'Fase 4 • Sinal (Pix Hold)'}
                {etapa === 4 && 'Reserva Confirmada'}
              </Text>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={tc(ds.cores.textoSuave)} />
            </Pressable>
          </View>

          {/* Conteúdo Dinâmico por Etapa */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ETAPA 1: FASE 1 - BRIEFING DO PROJETO */}
            {etapa === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Briefing do Projeto</Text>
                  <Text style={styles.stepSub}>
                    Envie referências, medidas e detalhes para{' '}
                    <Text style={{ color: tc(ds.cores.destaque), fontWeight: '800' }}>
                      {artista.nomeArtista}
                    </Text>{' '}
                    avaliar e formalizar a proposta de orçamento
                  </Text>
                </View>

                {/* Seletor de Categoria: Flash vs Exclusivo */}
                <View style={styles.categoryToggleRow}>
                  <Pressable
                    style={[
                      styles.categoryBtn,
                      tipoSessao === 'flash' ? styles.categoryBtnActive : styles.categoryBtnIdle,
                    ]}
                    onPress={() => setTipoSessao('flash')}
                  >
                    <Sparkles
                      size={16}
                      color={tipoSessao === 'flash' ? tc('#111') : tc(ds.cores.destaque)}
                    />
                    <View>
                      <Text
                        style={[
                          styles.categoryBtnTitle,
                          tipoSessao === 'flash' && styles.categoryBtnTitleActive,
                        ]}
                      >
                        Flash Tattoo
                      </Text>
                      <Text
                        style={[
                          styles.categoryBtnSub,
                          tipoSessao === 'flash' && styles.categoryBtnSubActive,
                        ]}
                      >
                        Artes prontas do artista
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.categoryBtn,
                      tipoSessao === 'exclusivo'
                        ? styles.categoryBtnActive
                        : styles.categoryBtnIdle,
                    ]}
                    onPress={() => setTipoSessao('exclusivo')}
                  >
                    <Layers
                      size={16}
                      color={tipoSessao === 'exclusivo' ? tc('#111') : tc(ds.cores.destaque)}
                    />
                    <View>
                      <Text
                        style={[
                          styles.categoryBtnTitle,
                          tipoSessao === 'exclusivo' && styles.categoryBtnTitleActive,
                        ]}
                      >
                        Ideia Própria
                      </Text>
                      <Text
                        style={[
                          styles.categoryBtnSub,
                          tipoSessao === 'exclusivo' && styles.categoryBtnSubActive,
                        ]}
                      >
                        Projeto sob medida
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* FLUXO A: FLASH TATTOO */}
                {tipoSessao === 'flash' && (
                  <View style={styles.flashSection}>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionLabel}>Catálogo de Flashes Disponíveis</Text>
                      <Text style={styles.badgeInfo}>Preço & Duração Fixos</Text>
                    </View>

                    {carregandoFlashes ? (
                      <ActivityIndicator color={tc(ds.cores.destaque)} style={{ marginVertical: 20 }} />
                    ) : flashesArtista.length === 0 ? (
                      <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>Nenhum flash cadastrado no momento.</Text>
                      </View>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.flashesHorizontalScroll}
                      >
                        {flashesArtista.map((flash) => {
                          const isSel = flashSelecionado?.id === flash.id;
                          return (
                            <Pressable
                              key={flash.id}
                              onPress={() => setFlashSelecionado(flash)}
                              style={[
                                styles.flashCard,
                                isSel ? styles.flashCardActive : styles.flashCardIdle,
                              ]}
                            >
                              <Image
                                source={{ uri: flash.imagem_url || flash.imagemUrl }}
                                style={styles.flashImage}
                              />
                              {isSel && (
                                <View style={styles.checkPill}>
                                  <Check size={12} color={tc('#111')} />
                                </View>
                              )}
                              <View style={styles.flashCardContent}>
                                <Text style={styles.flashTitle} numberOfLines={1}>
                                  {flash.titulo}
                                </Text>
                                <View style={styles.flashMeta}>
                                  <Text style={styles.flashPrice}>
                                    R$ {flash.preco || artista.precoInicial}
                                  </Text>
                                  <Text style={styles.flashDuration}>~1h30 - 2h</Text>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}

                {/* FLUXO B: PROJETO EXCLUSIVO (UPLOAD DE REFERÊNCIAS + ANATOMIA) */}
                {tipoSessao === 'exclusivo' && (
                  <View style={styles.exclusiveSection}>
                    {/* 1. Fotos de Referência */}
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionLabel}>
                        1. Fotos de Referência ({referenciasUrls.length}/3)
                      </Text>
                      <Text style={styles.badgeInfo}>Até 3 fotos da sua galeria</Text>
                    </View>

                    {/* Slots de Upload */}
                    <View style={styles.uploadSlotsRow}>
                      {[0, 1, 2].map((slotIndex) => {
                        const fotoUrl = referenciasUrls[slotIndex];
                        const isFilled = !!fotoUrl;

                        if (isFilled) {
                          return (
                            <View key={slotIndex} style={styles.uploadSlotFilled}>
                              <Image source={{ uri: fotoUrl }} style={styles.uploadSlotImage} />
                              <View style={styles.slotBadge}>
                                <Text style={styles.slotBadgeText}>Foto {slotIndex + 1}</Text>
                              </View>
                              <Pressable
                                style={styles.btnRemovePhoto}
                                onPress={() => removerFoto(slotIndex)}
                              >
                                <X size={12} color={tc(ds.cores.texto)} />
                              </Pressable>
                            </View>
                          );
                        }

                        return (
                          <Pressable
                            key={slotIndex}
                            style={styles.uploadSlotEmpty}
                            onPress={escolherFotoGaleria}
                            disabled={upandoFoto}
                          >
                            {upandoFoto ? (
                              <ActivityIndicator color={tc(ds.cores.destaque)} size="small" />
                            ) : (
                              <>
                                <View style={styles.uploadIconWrap}>
                                  <Camera size={16} color={tc(ds.cores.destaque)} />
                                </View>
                                <Text style={styles.uploadSlotTitle}>+ Foto {slotIndex + 1}</Text>
                                <Text style={styles.uploadSlotSub}>Galeria</Text>
                              </>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Botões de Ação para Upload e Link */}
                    <View style={styles.uploadActionsRow}>
                      <Pressable
                        style={styles.btnUploadPrincipal}
                        onPress={escolherFotoGaleria}
                        disabled={upandoFoto || referenciasUrls.length >= 3}
                      >
                        <UploadCloud size={16} color={tc('#111')} />
                        <Text style={styles.btnUploadPrincipalText}>
                          {referenciasUrls.length === 0
                            ? 'Fazer Upload da Galeria'
                            : 'Adicionar Outra Foto'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.btnToggleUrlLink}
                        onPress={() => setMostrarInputUrl(!mostrarInputUrl)}
                      >
                        <Plus size={14} color={tc(ds.cores.destaque)} />
                        <Text style={styles.btnToggleUrlLinkText}>Link da Web</Text>
                      </Pressable>
                    </View>

                    {mostrarInputUrl && (
                      <View style={styles.customUrlInputWrap}>
                        <TextInput
                          value={inputCustomUrl}
                          onChangeText={setInputCustomUrl}
                          placeholder="Cole o link da foto (Pinterest, Instagram, URL)..."
                          placeholderTextColor={tc(ds.cores.textoSuave)}
                          style={styles.customUrlInput}
                        />
                        <Pressable
                          style={styles.customUrlConfirmBtn}
                          onPress={adicionarUrlCustomizada}
                        >
                          <Check size={16} color={tc('#111')} />
                        </Pressable>
                      </View>
                    )}

                    {/* 2. Local do Corpo e Foto da Região Anatômica */}
                    <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                      2. Local do Corpo onde quer tatuar
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.tagsRow}
                    >
                      {LOCAIS_CORPO.map((loc) => {
                        const isSel = localCorpo === loc;
                        return (
                          <Pressable
                            key={loc}
                            onPress={() => setLocalCorpo(loc)}
                            style={[
                              styles.tagPill,
                              isSel ? styles.tagPillActive : styles.tagPillIdle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.tagPillText,
                                isSel && styles.tagPillTextActive,
                              ]}
                            >
                              {loc}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Foto Opcional da Região Anatômica */}
                    <View style={styles.anatomyPhotoBox}>
                      <View style={styles.anatomyPhotoHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.anatomyPhotoTitle}>
                            Foto da região do corpo (Opcional)
                          </Text>
                          <Text style={styles.anatomyPhotoSub}>
                            Recomendado para coberturas ou para o artista avaliar a curvatura e pele
                          </Text>
                        </View>
                        {fotoLocalCorpo ? (
                          <Pressable
                            style={styles.btnRemoverFotoCorpo}
                            onPress={() => setFotoLocalCorpo(null)}
                          >
                            <Trash2 size={14} color={tc('#ef4444')} />
                          </Pressable>
                        ) : null}
                      </View>

                      {fotoLocalCorpo ? (
                        <View style={styles.anatomyPreviewWrap}>
                          <Image source={{ uri: fotoLocalCorpo }} style={styles.anatomyPreviewImg} />
                          <View style={styles.anatomyBadge}>
                            <Text style={styles.anatomyBadgeText}>Região: {localCorpo}</Text>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.anatomyUploadBtn}
                          onPress={escolherFotoRegiaoCorpo}
                          disabled={upandoFoto}
                        >
                          <Camera size={16} color={tc(ds.cores.destaque)} />
                          <Text style={styles.anatomyUploadBtnText}>
                            Tirar ou Escolher Foto do {localCorpo}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* 3. Dimensões Estimadas em cm */}
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionLabel}>3. Dimensões Estimadas (cm)</Text>
                      <View style={styles.cmHighlightBadge}>
                        <Ruler size={12} color={tc('#111')} />
                        <Text style={styles.cmHighlightBadgeText}>~{tamanhoNumericoCm} cm</Text>
                      </View>
                    </View>

                    <View style={styles.sizeGrid}>
                      {TAMANHOS_CM.map((tam) => {
                        const isSel = tamanhoCm === tam.label;
                        return (
                          <Pressable
                            key={tam.id}
                            onPress={() => {
                              setTamanhoCm(tam.label);
                              setTamanhoNumericoCm(tam.cmMedio);
                              setFatorTamanho(tam.fator);
                            }}
                            style={[
                              styles.sizeBtn,
                              isSel ? styles.sizeBtnActive : styles.sizeBtnIdle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.sizeBtnText,
                                isSel && styles.sizeBtnTextActive,
                              ]}
                            >
                              {tam.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* 4. Descrição da Ideia */}
                    <View style={[styles.inputGroup, { marginTop: 12 }]}>
                      <Text style={styles.inputLabel}>
                        4. Descrição da sua ideia / Detalhes da arte
                      </Text>
                      <TextInput
                        value={descricaoArte}
                        onChangeText={setDescricaoArte}
                        placeholder="Ex: Quero um ramo floral com sombreamento suave e traços finos no antebraço direito..."
                        placeholderTextColor={tc(ds.cores.textoSuave)}
                        multiline
                        numberOfLines={3}
                        style={styles.textArea}
                      />
                    </View>

                    {/* 5. Disponibilidade Preferencial */}
                    <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                      5. Sua Disponibilidade Preferencial
                    </Text>
                    <View style={styles.dispList}>
                      {DISPONIBILIDADES.map((item) => {
                        const isSel = disponibilidade === item;
                        return (
                          <Pressable
                            key={item}
                            onPress={() => setDisponibilidade(item)}
                            style={[
                              styles.dispItem,
                              isSel ? styles.dispItemActive : styles.dispItemIdle,
                            ]}
                          >
                            <View
                              style={[
                                styles.radioCircle,
                                isSel && styles.radioCircleActive,
                              ]}
                            >
                              {isSel && <View style={styles.radioDot} />}
                            </View>
                            <Text
                              style={[
                                styles.dispItemText,
                                isSel && styles.dispItemTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Bloco de Envio Direto para o Chat (Fase 1 -> Fase 2) */}
                <View style={styles.briefingSubmitBlock}>
                  <Pressable
                    style={styles.btnEnviarBriefingChat}
                    onPress={handleEnviarBriefingParaChat}
                    disabled={carregando}
                  >
                    {carregando ? (
                      <ActivityIndicator color={tc('#111')} size="small" />
                    ) : (
                      <>
                        <Send size={18} color={tc('#111')} />
                        <Text style={styles.btnEnviarBriefingChatText}>
                          Enviar Briefing & Abrir Chat com Artista
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.btnAvancarDiretoTurno}
                    onPress={avancarParaTurnos}
                  >
                    <Text style={styles.btnAvancarDiretoTurnoText}>
                      Ou Agendar Turno & Pagar Sinal Diretamente →
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ETAPA 2: FASE 4 - DATA & TURNO DE BANCADA */}
            {etapa === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Escolha Data & Turno</Text>
                  <Text style={styles.stepSub}>
                    Tatuadores trabalham por turnos dedicados para garantir foco total na sua pele
                  </Text>
                </View>

                {/* Datas Disponíveis */}
                <Text style={styles.sectionLabel}>Datas Disponíveis na Agenda</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysRow}
                >
                  {diasDisponiveis.map((d, index) => {
                    const isSelected =
                      d.getDate() === dataSelecionada.getDate() &&
                      d.getMonth() === dataSelecionada.getMonth();
                    const diaSemana = d
                      .toLocaleDateString('pt-BR', { weekday: 'short' })
                      .replace('.', '');

                    return (
                      <Pressable
                        key={index}
                        onPress={() => setDataSelecionada(d)}
                        style={[
                          styles.dayCard,
                          isSelected ? styles.dayCardActive : styles.dayCardIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayWeekText,
                            isSelected && styles.dayTextActive,
                          ]}
                        >
                          {diaSemana.toUpperCase()}
                        </Text>
                        <Text
                          style={[
                            styles.dayNumText,
                            isSelected && styles.dayTextActive,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                        <Text
                          style={[
                            styles.dayMonthText,
                            isSelected && styles.dayTextActive,
                          ]}
                        >
                          {d
                            .toLocaleDateString('pt-BR', { month: 'short' })
                            .replace('.', '')
                            .toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Seleção de Turnos */}
                <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                  Selecione o Turno de Atendimento
                </Text>
                <View style={styles.shiftsList}>
                  {TURNOS.map((turno) => {
                    const isSelected = turnoSelecionado === turno.id;
                    const Icone = turno.icone;

                    return (
                      <Pressable
                        key={turno.id}
                        onPress={() => setTurnoSelecionado(turno.id)}
                        style={[
                          styles.shiftCard,
                          isSelected ? styles.shiftCardActive : styles.shiftCardIdle,
                        ]}
                      >
                        <View style={styles.shiftCardLeft}>
                          <View
                            style={[
                              styles.shiftIconWrap,
                              isSelected && styles.shiftIconWrapActive,
                            ]}
                          >
                            <Icone size={20} color={isSelected ? tc('#111') : tc(ds.cores.destaque)} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.shiftTitleRow}>
                              <Text
                                style={[
                                  styles.shiftTitle,
                                  isSelected && styles.shiftTitleActive,
                                ]}
                              >
                                {turno.nome}
                              </Text>
                              <View
                                style={[
                                  styles.shiftBadge,
                                  isSelected && styles.shiftBadgeActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.shiftBadgeText,
                                    isSelected && styles.shiftBadgeTextActive,
                                  ]}
                                >
                                  {turno.tag}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.shiftHours}>
                              Início às {turno.horarioInicio} ({turno.horarioTexto})
                            </Text>
                            <Text style={styles.shiftSub}>{turno.recomendadoPara}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Resumo da Data e Turno */}
                <View style={styles.summaryBar}>
                  <CalendarIcon size={14} color={tc(ds.cores.destaque)} />
                  <Text style={styles.summaryBarText}>
                    {dataSelecionada.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      weekday: 'long',
                    })}{' '}
                    • {TURNOS.find((t) => t.id === turnoSelecionado)?.nome}
                  </Text>
                </View>
              </View>
            )}

            {/* ETAPA 3: FASE 4 - SINAL PIX (HOLD 30MIN) */}
            {etapa === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Trava de Vaga com Sinal</Text>
                  <Text style={styles.stepSub}>
                    O sinal garante seu horário na agenda do artista e fica protegido em custódia
                  </Text>
                </View>

                {/* Temporizador de Reserva (Hold de 30min) */}
                <View style={styles.holdBanner}>
                  <View style={styles.holdBannerLeft}>
                    <Clock size={16} color={tc(ds.cores.destaque)} />
                    <View>
                      <Text style={styles.holdBannerTitle}>Temporizador de Reserva</Text>
                      <Text style={styles.holdBannerSub}>
                        Vaga segurada por mais {formatoMinutosSegundos(segundosRestantes)} min
                      </Text>
                    </View>
                  </View>
                  <View style={styles.holdTimerBadge}>
                    <Text style={styles.holdTimerBadgeText}>
                      {formatoMinutosSegundos(segundosRestantes)}
                    </Text>
                  </View>
                </View>

                {/* Resumo Financeiro */}
                <View style={styles.financialCard}>
                  <Text style={styles.finCardHeader}>Detalhamento do Orçamento</Text>

                  <View style={styles.finRow}>
                    <Text style={styles.finLabel}>Valor Total Estimado:</Text>
                    <Text style={styles.finValTotal}>R$ {valorTotalEstimado.toFixed(2)}</Text>
                  </View>

                  <View style={styles.finRowHighlight}>
                    <View>
                      <Text style={styles.finLabelHighlight}>Sinal de Reserva (Trava de Vaga):</Text>
                      <Text style={styles.finSubHighlight}>Pago agora via PIX protegido</Text>
                    </View>
                    <Text style={styles.finValHighlight}>
                      R$ {valorSinalCalculado.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.finDivider} />

                  <View style={styles.finRow}>
                    <Text style={styles.finLabel}>Saldo Restante no Estúdio:</Text>
                    <Text style={styles.finValRestante}>
                      R$ {saldoRestanteEstudio.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Bloco Mercado Pago PIX */}
                {cobrancaPix && (
                  <View style={styles.pixBox}>
                    <View style={styles.pixHeader}>
                      <ShieldCheck size={16} color={tc('#009ee3')} />
                      <Text style={styles.pixHeaderText}>PIX Mercado Pago em Custódia</Text>
                    </View>

                    <View style={styles.qrCodeWrapper}>
                      <View style={styles.qrMock}>
                        <QrCode size={110} color={tc(ds.cores.destaque)} />
                        <Text style={styles.qrMockLabel}>PAGAMENTO PROTEGIDO</Text>
                      </View>
                    </View>

                    <Pressable style={styles.copyPixBtn} onPress={copiarChavePix}>
                      {pixCopiado ? (
                        <Check size={16} color={tc('#10b981')} />
                      ) : (
                        <Copy size={16} color={tc('#111')} />
                      )}
                      <Text
                        style={[
                          styles.copyPixBtnText,
                          pixCopiado && styles.copyPixBtnTextDone,
                        ]}
                      >
                        {pixCopiado
                          ? 'Chave PIX Copiada com Sucesso!'
                          : 'Copiar Chave PIX (Copia e Cola)'}
                      </Text>
                    </Pressable>

                    <View style={styles.safeNotice}>
                      <ShieldCheck size={12} color={tc('#10b981')} />
                      <Text style={styles.safeNoticeText}>
                        O valor fica retido com segurança até o dia do procedimento.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Botão de Confirmação de Sinal */}
                <Pressable
                  style={styles.btnConfirmDeposit}
                  onPress={confirmarSinalPago}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator color={tc('#111')} size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color={tc('#111')} />
                      <Text style={styles.btnConfirmDepositText}>
                        Simular aprovação do sinal
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* ETAPA 4: CONFIRMAÇÃO & PROTOCOLO */}
            {etapa === 4 && (
              <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 14 }]}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={54} color={tc(ds.cores.destaque)} />
                </View>

                <Text style={styles.successTitle}>Sessão Confirmada!</Text>
                <Text style={styles.successSub}>
                  Sua vaga com <Text style={{ color: tc(ds.cores.texto), fontWeight: '800' }}>{artista.nomeArtista}</Text> foi travada com sucesso com o sinal de R$ {valorSinalCalculado}.
                </Text>

                <View style={styles.protocolCard}>
                  <Text style={styles.protocolLabel}>Protocolo de Reserva</Text>
                  <Text style={styles.protocolCode}>DERM-RES-{protocoloReserva}</Text>
                  <View style={styles.protocolDivider} />
                  <View style={styles.protocolRow}>
                    <Text style={styles.protocolKey}>Data & Turno:</Text>
                    <Text style={styles.protocolVal}>
                      {dataSelecionada.toLocaleDateString('pt-BR')} • {TURNOS.find((t) => t.id === turnoSelecionado)?.nome}
                    </Text>
                  </View>
                  <View style={styles.protocolRow}>
                    <Text style={styles.protocolKey}>Estúdio:</Text>
                    <Text style={styles.protocolVal}>
                      {artista.nomeEstudio} ({artista.cidade})
                    </Text>
                  </View>
                  <View style={styles.protocolRow}>
                    <Text style={styles.protocolKey}>Saldo Restante:</Text>
                    <Text style={styles.protocolVal}>
                      R$ {saldoRestanteEstudio.toFixed(2)} (no estúdio)
                    </Text>
                  </View>
                </View>

                <View style={styles.anamneseCallout}>
                  <View style={styles.anamneseCalloutHeader}>
                    <FileHeart size={18} color={tc(ds.cores.destaque)} />
                    <Text style={styles.anamneseCalloutTitle}>Fase 5: Ficha de Saúde (Anamnese)</Text>
                  </View>
                  <Text style={styles.anamneseCalloutText}>
                    Por exigência sanitária e biossegurança, complete e assine sua <Text style={{ color: tc(ds.cores.destaque), fontWeight: '700' }}>Ficha de Anamnese</Text> na aba <Text style={{ color: tc(ds.cores.texto), fontWeight: '700' }}>Meus Agendamentos</Text> ou no Chat antes da sessão.
                  </Text>
                </View>

                <Pressable
                  style={styles.btnFinishAll}
                  onPress={() => {
                    onSucesso();
                    onClose();
                  }}
                >
                  <Text style={styles.btnFinishAllText}>Ir para Meus Agendamentos</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Rodapé de Ação para Etapa 2 */}
          {etapa === 2 && (
            <View style={styles.footer}>
              <View style={styles.footerPriceCol}>
                <Text style={styles.footerPriceLabel}>Total Estimado:</Text>
                <Text style={styles.footerPriceVal}>R$ {valorTotalEstimado.toFixed(2)}</Text>
              </View>

              <Pressable
                style={styles.btnNext}
                onPress={avancarParaSinalPix}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color={tc('#111')} size="small" />
                ) : (
                  <>
                    <Text style={styles.btnNextText}>
                      Pagar Sinal (R$ {valorSinalCalculado})
                    </Text>
                    <ChevronRight size={18} color={tc('#111')} />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </AppModal>
  );
}

const styles = createThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '94%',
    backgroundColor: ds.cores.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingTop: 14,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1f',
  },
  backBtn: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 10,
    backgroundColor: '#18181e',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  progressWrap: {
    alignItems: 'center',
    gap: 4,
  },
  progressPills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    height: 4,
    borderRadius: 2,
  },
  pillActive: {
    width: 26,
    backgroundColor: ds.cores.destaque,
  },
  pillDone: {
    width: 14,
    backgroundColor: '#10b981',
  },
  pillIdle: {
    width: 10,
    backgroundColor: '#262630',
  },
  progressText: {
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    color: ds.cores.textoSuave,
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 20,
    flexShrink: 1,
  },
  closeBtn: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 10,
    backgroundColor: '#18181e',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stepContainer: {
    gap: 14,
  },
  stepHeader: {
    gap: 3,
    marginBottom: 2,
  },
  stepTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 26,
    flexShrink: 1,
  },
  stepSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  categoryToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  categoryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: ds.raio.controle,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  categoryBtnActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  categoryBtnIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: '#24242e',
  },
  categoryBtnTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  categoryBtnTitleActive: {
    color: '#111',
  },
  categoryBtnSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  categoryBtnSubActive: {
    color: '#333',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 17,
  },
  badgeInfo: {
    backgroundColor: '#1b1b22',
    color: ds.cores.destaque,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#33333f',
    lineHeight: 16,
  },
  flashSection: {
    gap: 10,
  },
  flashesHorizontalScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  flashCard: {
    width: 140,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  flashCardActive: {
    borderColor: ds.cores.destaque,
    backgroundColor: '#18181f',
  },
  flashCardIdle: {
    borderColor: '#22222a',
    backgroundColor: '#111115',
  },
  flashImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#1a1a22',
  },
  checkPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ds.cores.destaque,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashCardContent: {
    padding: 8,
    gap: 3,
  },
  flashTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  flashMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashPrice: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  flashDuration: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: ds.cores.superficie,
    alignItems: 'center',
  },
  emptyText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  tagsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagPillActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  tagPillIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: '#22222b',
  },
  tagPillText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  tagPillTextActive: {
    color: '#111',
    fontWeight: '800',
  },
  exclusiveSection: {
    gap: 10,
  },
  uploadSlotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  uploadSlotEmpty: {
    flex: 1,
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#383848',
    backgroundColor: '#111116',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    padding: 6,
  },
  uploadIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1b1b24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadSlotTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  uploadSlotSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  uploadSlotFilled: {
    flex: 1,
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ds.cores.destaque,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  uploadSlotImage: {
    width: '100%',
    height: '100%',
  },
  slotBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotBadgeText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  btnRemovePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnUploadPrincipal: {
    flex: 2,
    backgroundColor: ds.cores.destaque,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: ds.raio.controle,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minHeight: ds.alvo.controle,
  },
  btnUploadPrincipalText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnToggleUrlLink: {
    flex: 1,
    backgroundColor: '#171720',
    borderWidth: 1,
    borderColor: '#2e2e3e',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: ds.raio.controle,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    minHeight: ds.alvo.controle,
  },
  btnToggleUrlLinkText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  customUrlInputWrap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  customUrlInput: {
    flex: 1,
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.campo,
    borderWidth: 1,
    borderColor: '#2c2c38',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: ds.cores.texto,
    fontSize: ds.fonte.campo,
    lineHeight: 23,
    flexShrink: 1,
    minHeight: ds.alvo.controle,
  },
  customUrlConfirmBtn: {
    backgroundColor: ds.cores.destaque,
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  anatomyPhotoBox: {
    backgroundColor: ds.cores.superficie,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22222d',
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  anatomyPhotoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anatomyPhotoTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  anatomyPhotoSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  btnRemoverFotoCorpo: {
    padding: 6,
  },
  anatomyPreviewWrap: {
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: ds.cores.destaque,
  },
  anatomyPreviewImg: {
    width: '100%',
    height: '100%',
  },
  anatomyBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  anatomyBadgeText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  anatomyUploadBtn: {
    backgroundColor: '#181822',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#383848',
    borderRadius: ds.raio.controle,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ds.alvo.controle,
  },
  anatomyUploadBtnText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  cmHighlightBadge: {
    backgroundColor: ds.cores.destaque,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cmHighlightBadgeText: {
    color: '#111',
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  sizeGrid: {
    gap: 6,
  },
  sizeBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: ds.raio.controle,
    borderWidth: 1,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBtnActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  sizeBtnIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: '#22222b',
  },
  sizeBtnText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  sizeBtnTextActive: {
    color: '#111',
    fontWeight: '900',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    lineHeight: 17,
  },
  textArea: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.campo,
    borderWidth: 1,
    borderColor: '#22222b',
    padding: 12,
    color: ds.cores.texto,
    fontSize: ds.fonte.campo,
    textAlignVertical: 'top',
    lineHeight: 23,
    flexShrink: 1,
    minHeight: ds.alvo.controle,
  },
  dispList: {
    gap: 6,
  },
  dispItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dispItemActive: {
    backgroundColor: '#191812',
    borderColor: ds.cores.destaque,
  },
  dispItemIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: '#202028',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: ds.cores.destaque,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ds.cores.destaque,
  },
  dispItemText: {
    color: '#aaa',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  dispItemTextActive: {
    color: ds.cores.texto,
    fontWeight: '700',
  },
  briefingSubmitBlock: {
    gap: 8,
    marginTop: 10,
  },
  btnEnviarBriefingChat: {
    backgroundColor: ds.cores.destaque,
    borderRadius: ds.raio.controle,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ds.alvo.controle,
  },
  btnEnviarBriefingChatText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnAvancarDiretoTurno: {
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnAvancarDiretoTurnoText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.controle,
    fontWeight: '600',
    textDecorationLine: 'underline',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  daysRow: {
    gap: 8,
    paddingVertical: 4,
  },
  dayCard: {
    width: 66,
    height: 78,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  dayCardIdle: {
    backgroundColor: '#131318',
    borderColor: '#22222b',
  },
  dayWeekText: {
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    color: ds.cores.textoSuave,
    lineHeight: 16,
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '700',
    color: ds.cores.texto,
    lineHeight: 26,
    flexShrink: 1,
  },
  dayMonthText: {
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    color: ds.cores.textoSuave,
    lineHeight: 16,
  },
  dayTextActive: {
    color: '#111',
  },
  shiftsList: {
    gap: 8,
  },
  shiftCard: {
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    padding: ds.espaco.padrao,
  },
  shiftCardActive: {
    backgroundColor: '#181820',
    borderColor: ds.cores.destaque,
  },
  shiftCardIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: '#22222b',
  },
  shiftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shiftIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1a1a22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftIconWrapActive: {
    backgroundColor: ds.cores.destaque,
  },
  shiftTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  shiftTitleActive: {
    color: ds.cores.destaque,
  },
  shiftBadge: {
    backgroundColor: '#1c1c24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shiftBadgeActive: {
    backgroundColor: ds.cores.destaque,
  },
  shiftBadgeText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  shiftBadgeTextActive: {
    color: '#111',
  },
  shiftHours: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  shiftSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    marginTop: 1,
    lineHeight: 20,
    flexShrink: 1,
  },
  summaryBar: {
    backgroundColor: '#15151c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262633',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryBarText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    textTransform: 'capitalize',
    lineHeight: 20,
    flexShrink: 1,
  },
  holdBanner: {
    backgroundColor: '#18150c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#543f07',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holdBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  holdBannerTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  holdBannerSub: {
    color: '#aaa',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  holdTimerBadge: {
    backgroundColor: ds.cores.destaque,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  holdTimerBadgeText: {
    color: '#111',
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: 16,
  },
  financialCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: '#22222b',
    padding: ds.espaco.padrao,
    gap: 8,
  },
  finCardHeader: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 20,
    flexShrink: 1,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finRowHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#19181f',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#322c15',
  },
  finLabel: {
    color: '#aaa',
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  finLabelHighlight: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    lineHeight: 17,
  },
  finSubHighlight: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  finValTotal: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  finValHighlight: {
    color: ds.cores.destaque,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    flexShrink: 1,
  },
  finValRestante: {
    color: '#10b981',
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  finDivider: {
    height: 1,
    backgroundColor: '#1f1f28',
    marginVertical: 2,
  },
  pixBox: {
    backgroundColor: '#111115',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22222c',
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pixHeaderText: {
    color: '#009ee3',
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  qrCodeWrapper: {
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262633',
  },
  qrMock: {
    alignItems: 'center',
    gap: 6,
  },
  qrMockLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 17,
  },
  copyPixBtn: {
    backgroundColor: ds.cores.destaque,
    width: '100%',
    paddingVertical: 12,
    borderRadius: ds.raio.controle,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ds.alvo.controle,
  },
  copyPixBtnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  copyPixBtnTextDone: {
    color: '#10b981',
  },
  safeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safeNoticeText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  btnConfirmDeposit: {
    backgroundColor: '#10b981',
    borderRadius: ds.raio.controle,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ds.alvo.controle,
  },
  btnConfirmDepositText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#18170c',
    borderWidth: 2,
    borderColor: ds.cores.destaque,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    color: ds.cores.texto,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 26,
    flexShrink: 1,
  },
  successSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
    flexShrink: 1,
  },
  protocolCard: {
    width: '100%',
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 6,
    marginTop: 10,
  },
  protocolLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    textTransform: 'none',
    lineHeight: 17,
  },
  protocolCode: {
    color: ds.cores.destaque,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 23,
    flexShrink: 1,
  },
  protocolDivider: {
    height: 1,
    backgroundColor: '#20202a',
    marginVertical: 4,
  },
  protocolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  protocolKey: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  protocolVal: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  anamneseCallout: {
    width: '100%',
    backgroundColor: '#1b170c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4d390a',
    padding: 14,
    gap: 6,
    marginTop: 10,
  },
  anamneseCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anamneseCalloutTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  anamneseCalloutText: {
    color: '#bbb',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  btnFinishAll: {
    width: '100%',
    backgroundColor: ds.cores.destaque,
    borderRadius: ds.raio.controle,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnFinishAllText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a20',
  },
  footerPriceCol: {
    gap: 1,
  },
  footerPriceLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    lineHeight: 17,
  },
  footerPriceVal: {
    color: ds.cores.texto,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
  },
  btnNext: {
    backgroundColor: ds.cores.destaque,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: ds.raio.controle,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnNextText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
});
