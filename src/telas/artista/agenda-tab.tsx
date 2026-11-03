import { demoAtiva } from '@/services/apresentacao-store';
import { copiarTexto } from '@/services/documentos-mobile';
import { avisar } from '@/services/feedback';
import { ds } from '@/theme/design-system';
import { DetalhesNotaModal } from '@/components/fiscal/detalhes-nota-modal';
import { EmissaoNfseModal } from '@/components/fiscal/emissao-nfse-modal';
import { ReciboFiscalModal } from '@/components/recibo-fiscal-modal';
import { AppModal } from '@/components/ui/app-modal';
import { FiscalService } from '@/services/fiscal/fiscal-service';
import { criarCobrancaFinal, gerarReciboFiscal, obterUrlQrCodePix } from '@/services/mercadopago';
import { supabase } from '@/services/data-client';
import type { ReciboFiscal } from '@/types/financeiro';
import type { NotaFiscalRegistro } from '@/types/fiscal';
import type { PerfilUsuario } from '@/types/auth';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileCheck2,
  FileHeart,
  HeartPulse,
  Image as ImageIcon,
  Info,
  Layers,
  MapPin,
  Play,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Sunset,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createThemedStyles, tc } from '@/theme';

export interface FichaAnamneseArtista {
  id?: string;
  agendamento_id?: string;
  cliente_id?: string;
  alergias?: string;
  doencas_cronicas?: string;
  medicamentos?: string;
  observacoes?: string;
  assinado?: boolean;
  tem_alerta_saude?: boolean;
  data_assinatura?: string;
}

export interface ItemAgendaCompleto {
  id: string;
  clienteId: string;
  clienteNome: string;
  data: string;
  dataOriginal: string;
  horario: string;
  estilo: string;
  descricao?: string;
  localCorpo?: string;
  tamanhoCm?: string;
  turno?: string;
  tipoSessao?: string;
  referenciasUrls?: string[];
  status: 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  valorSinal: number;
  valorTotal: number;
  valorFinal?: number;
  sinalPago: boolean;
  fichaAnamnese?: FichaAnamneseArtista | null;
}

export function ArtistaAgendaTab({ perfil }: { perfil: PerfilUsuario }) {
  const artistaId = perfil.id || perfil.uid || '';
  const [agendamentos, setAgendamentos] = useState<ItemAgendaCompleto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'tudo' | 'proximos' | 'andamento' | 'historico'>('tudo');

  // Modais de apoio
  const [itemFinalizando, setItemFinalizando] = useState<ItemAgendaCompleto | null>(null);
  const [itemAnamnese, setItemAnamnese] = useState<ItemAgendaCompleto | null>(null);
  const [itemEmissaoNfse, setItemEmissaoNfse] = useState<ItemAgendaCompleto | null>(null);
  const [notaVisualizar, setNotaVisualizar] = useState<NotaFiscalRegistro | null>(null);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [reciboVisualizar, setReciboVisualizar] = useState<ReciboFiscal | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);

  // Estados do modal de finalização
  const [valorFinalInput, setValorFinalInput] = useState('350');
  const [metodoPagamentoFinal, setMetodoPagamentoFinal] = useState<'pix' | 'cartao' | 'dinheiro'>('pix');
  const [liquidando, setLiquidando] = useState(false);
  const [pixCopiaColaFinal, setPixCopiaColaFinal] = useState<string | null>(null);
  const [qrCodeUrlFinal, setQrCodeUrlFinal] = useState<string | null>(null);
  const [copiadoPix, setCopiadoPix] = useState(false);

  // Estados de Controle de Agenda (Aberta / Fechada)
  const [agendaAberta, setAgendaAberta] = useState(true);
  const [mensagemAgendaFechada, setMensagemAgendaFechada] = useState('');
  const [salvandoStatusAgenda, setSalvandoStatusAgenda] = useState(false);

  useEffect(() => {
    carregarAgenda();
    carregarStatusAgenda();
  }, [artistaId]);

  const carregarStatusAgenda = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user && !demoAtiva()) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('agenda_aberta, mensagem_agenda_fechada')
        .eq('id', artistaId)
        .maybeSingle();

      if (profile) {
        setAgendaAberta(profile.agenda_aberta ?? true);
        setMensagemAgendaFechada(profile.mensagem_agenda_fechada || '');
      }
    } catch {
      // silencioso
    }
  };

  const alternarAgendaAberta = async () => {
    setSalvandoStatusAgenda(true);
    const novoStatus = !agendaAberta;
    setAgendaAberta(novoStatus);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user && !demoAtiva()) return;

      await supabase
        .from('profiles')
        .update({ agenda_aberta: novoStatus })
        .eq('id', artistaId);
    } catch (err) {
      console.warn('Erro ao atualizar status da agenda:', err);
    } finally {
      setSalvandoStatusAgenda(false);
    }
  };

  const carregarAgenda = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user && !demoAtiva()) return;

      // 1. Busca agendamentos do artista
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          cliente_id,
          data_horario,
          estilo,
          descricao,
          local_corpo,
          tamanho_cm,
          turno,
          tipo_sessao,
          referencias_urls,
          status,
          valor_sinal,
          valor_total,
          valor_final,
          sinal_pago,
          cliente:profiles!agendamentos_cliente_id_fkey(nome_exibicao)
        `)
        .eq('artista_id', artistaId)
        .order('data_horario', { ascending: true });

      if (!error && data) {
        // 2. Busca fichas de anamnese
        const { data: fichasData } = await supabase
          .from('fichas_anamnese')
          .select('*')
          .eq('artista_id', artistaId);

        const fichasMap = new Map<string, FichaAnamneseArtista>();
        if (fichasData) {
          fichasData.forEach((f: any) => {
            if (f.agendamento_id) {
              fichasMap.set(f.agendamento_id, f);
            } else if (f.cliente_id) {
              fichasMap.set(f.cliente_id, f);
            }
          });
        }

        const formatados: ItemAgendaCompleto[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
          const ficha = fichasMap.get(item.id) || fichasMap.get(item.cliente_id) || null;

          return {
            id: item.id,
            clienteId: item.cliente_id,
            clienteNome: item.cliente?.nome_exibicao || 'Cliente Dermys',
            data: d.toLocaleDateString('pt-BR'),
            dataOriginal: item.data_horario,
            horario: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            estilo: item.estilo || 'Tatuagem Autoral',
            descricao: item.descricao,
            localCorpo: item.local_corpo || 'Braço / Antebraço',
            tamanhoCm: item.tamanho_cm || '10 a 15 cm',
            turno: item.turno || 'tarde',
            tipoSessao: item.tipo_sessao || 'exclusivo',
            referenciasUrls: item.referencias_urls || [],
            status: item.status || 'pendente',
            valorSinal: Number(item.valor_sinal || 0),
            valorTotal: Number(item.valor_total || 350),
            valorFinal: item.valor_final ? Number(item.valor_final) : undefined,
            sinalPago: item.sinal_pago ?? true,
            fichaAnamnese: ficha,
          };
        });
        setAgendamentos(formatados);
      }
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  const atualizarStatus = async (id: string, novoStatus: string, extras: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({
          status: novoStatus,
          ...extras,
        })
        .eq('id', id).select('id').single();
      if (error || !data) throw new Error('Não foi possível atualizar este agendamento.');

      setAgendamentos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: novoStatus as any, ...extras } : item))
      );
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'Não foi possível atualizar o agendamento.');
      throw e;
    }
  };

  const abrirModalFinalizar = (item: ItemAgendaCompleto) => {
    setItemFinalizando(item);
    setValorFinalInput(String(item.valorTotal || 350));
    setPixCopiaColaFinal(null);
    setQrCodeUrlFinal(null);
  };

  const confirmarLiquidacao = async () => {
    if (!itemFinalizando) return;
    setLiquidando(true);
    const precoFinal = Number(valorFinalInput) || itemFinalizando.valorTotal;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user || demoAtiva()) {
        const cobranca = await criarCobrancaFinal({
          agendamentoId: itemFinalizando.id,
          artistaId: artistaId,
          clienteId: itemFinalizando.clienteId,
          valorFinal: precoFinal,
          valorSinalJaPago: itemFinalizando.valorSinal,
          metodo: metodoPagamentoFinal,
          artistaNome: perfil.nomeExibicao || perfil.nome_exibicao || 'Tatuador Dermys',
        });

        if (metodoPagamentoFinal === 'pix') {
          setPixCopiaColaFinal(cobranca.qrCodePayload);
          setQrCodeUrlFinal(cobranca.qrCodeBase64 || obterUrlQrCodePix(cobranca.qrCodePayload));
        }

        await atualizarStatus(itemFinalizando.id, 'concluido', {
          valor_final: precoFinal,
          concluido_em: new Date().toISOString(),
        });

        try {
          const pFiscal = await FiscalService.obterOuCriarPerfilFiscal(artistaId);
          if (pFiscal.emissao_automatica) {
            await FiscalService.emitirNotaFiscal({
              artistaId: artistaId,
              clienteId: itemFinalizando.clienteId,
              agendamentoId: itemFinalizando.id,
              valorServico: precoFinal,
              descricaoServico:
                itemFinalizando.descricao ||
                `Procedimento de Tatuagem ${itemFinalizando.estilo} (${itemFinalizando.localCorpo || 'Corpo'})`,
              tomador: {
                nome: itemFinalizando.clienteNome,
              },
            });
          }
        } catch (errFiscal) {
          console.warn('[Agenda] Emissao automatica de nota:', errFiscal);
        }
      }
    } catch (err) {
      console.warn('Erro ao liquidar:', err);
    } finally {
      setLiquidando(false);
    }
  };

  const abrirReciboAgendamento = (item: ItemAgendaCompleto) => {
    const recibo = gerarReciboFiscal({
      agendamentoId: item.id,
      artistaNome: 'Tatuador Dermys',
      clienteNome: item.clienteNome,
      descricaoServico: item.descricao || `Tatuagem ${item.estilo} (${item.localCorpo || ''})`,
      estilo: item.estilo,
      valorSinal: item.valorSinal,
      valorFinal: item.valorFinal || item.valorTotal,
      formaPagamento: 'Mercado Pago (PIX/Sinal)',
    });
    setReciboVisualizar(recibo);
    setModalReciboAberto(true);
  };

  const agendamentosFiltrados = agendamentos.filter((item) => {
    if (filtro === 'tudo') return true;
    if (filtro === 'proximos') return item.status === 'pendente' || item.status === 'confirmado';
    if (filtro === 'andamento') return item.status === 'em_andamento';
    if (filtro === 'historico') return item.status === 'concluido' || item.status === 'cancelado';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Controle de Abertura e Fechamento de Agenda do Tatuador */}
      <View style={styles.agendaControlCard}>
        <View style={styles.agendaControlLeft}>
          <View
            style={[
              styles.agendaStatusDot,
              agendaAberta ? styles.dotGreen : styles.dotAmber,
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.agendaControlTitle}>
              {agendaAberta ? 'Agenda Aberta (Recebendo Reservas)' : 'Agenda Fechada (Pausada)'}
            </Text>
            <Text style={styles.agendaControlSub}>
              {agendaAberta
                ? 'Novos briefings e pedidos de orçamento habilitados'
                : 'Novos projetos temporariamente bloqueados no seu perfil'}
            </Text>
          </View>
        </View>
        <Pressable
          style={[
            styles.agendaToggleBtn,
            agendaAberta ? styles.btnFechada : styles.btnAberta,
          ]}
          onPress={alternarAgendaAberta}
          disabled={salvandoStatusAgenda}
        >
          {salvandoStatusAgenda ? (
            <ActivityIndicator color={agendaAberta ? tc('#ef4444') : tc('#10b981')} size="small" />
          ) : (
            <Text
              style={[
                styles.agendaToggleBtnText,
                agendaAberta ? styles.textFechada : styles.textAberta,
              ]}
            >
              {agendaAberta ? 'Pausar Agenda' : 'Abrir Agenda'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Abas de Filtros */}
      <View style={styles.filterRow}>
        {[
          { id: 'tudo', label: 'Tudo' },
          { id: 'proximos', label: 'Próximos' },
          { id: 'andamento', label: 'Em Andamento' },
          { id: 'historico', label: 'Histórico' },
        ].map((f) => {
          const ativo = filtro === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFiltro(f.id as any)}
              style={[styles.filterBtn, ativo ? styles.filterBtnActive : styles.filterBtnIdle]}
            >
              <Text style={[styles.filterBtnText, ativo && styles.filterBtnTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lista de Cards */}
      {carregando ? (
        <ActivityIndicator color={tc(ds.cores.destaque)} style={{ marginTop: 24 }} />
      ) : agendamentosFiltrados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Agenda vazia nesta categoria</Text>
          <Text style={styles.emptySub}>
            Novas solicitações de clientes aparecerão aqui organizadas por turnos de bancada e sinal em custódia.
          </Text>
        </View>
      ) : (
        agendamentosFiltrados.map((item) => {
          const isPendente = item.status === 'pendente';
          const isConfirmado = item.status === 'confirmado';
          const isAndamento = item.status === 'em_andamento';
          const isConcluido = item.status === 'concluido';
          const isCancelado = item.status === 'cancelado';

          const turnoNome =
            item.turno === 'manha'
              ? '🌅 Turno Manhã (10h)'
              : item.turno === 'diaria'
              ? '⚡ Diária Completa'
              : '☀️ Turno Tarde (14h)';

          const temAlerta = item.fichaAnamnese?.tem_alerta_saude;
          const anamneseAssinada = item.fichaAnamnese?.assinado;

          return (
            <View key={item.id} style={styles.card}>
              {/* Header do Card */}
              <View style={styles.cardHeader}>
                <View style={styles.clientInfo}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{item.clienteNome.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{item.clienteNome}</Text>
                    <Text style={styles.estiloText}>{item.estilo}</Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.badge,
                    isConfirmado
                      ? styles.badgeConfirmado
                      : isPendente
                      ? styles.badgePendente
                      : isAndamento
                      ? styles.badgeAndamento
                      : isConcluido
                      ? styles.badgeConcluido
                      : styles.badgeCancelado,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isConfirmado
                        ? styles.badgeTextConfirmado
                        : isPendente
                        ? styles.badgeTextPendente
                        : isAndamento
                        ? styles.badgeTextAndamento
                        : isConcluido
                        ? styles.badgeTextConcluido
                        : styles.badgeTextCancelado,
                    ]}
                  >
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Turno e Categoria */}
              <View style={styles.pillsRow}>
                <View style={styles.turnoBadge}>
                  <Text style={styles.turnoBadgeText}>{turnoNome}</Text>
                </View>

                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.tipoSessao === 'flash' ? 'Flash Autoral' : 'Projeto Exclusivo'}
                  </Text>
                </View>
              </View>

              {/* Detalhes de Data e Briefing */}
              <View style={styles.gridInfo}>
                <View style={styles.infoCol}>
                  <View style={styles.infoLine}>
                    <Calendar size={13} color={tc(ds.cores.destaque)} />
                    <Text style={styles.infoVal}>{item.data}</Text>
                  </View>
                  <View style={styles.infoLine}>
                    <Clock size={13} color={tc(ds.cores.destaque)} />
                    <Text style={styles.infoVal}>{item.horario}</Text>
                  </View>
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.briefingLabel}>Local & Tamanho:</Text>
                  <Text style={styles.briefingVal}>
                    {item.localCorpo} ({item.tamanhoCm})
                  </Text>
                </View>
              </View>

              {/* Status da Ficha Sanitária / Alerta Vermelho */}
              <View
                style={[
                  styles.anamneseCheckRow,
                  temAlerta
                    ? styles.anamneseCheckRowAlert
                    : anamneseAssinada
                    ? styles.anamneseCheckRowOk
                    : styles.anamneseCheckRowPending,
                ]}
              >
                {temAlerta ? (
                  <ShieldAlert size={14} color={tc('#ef4444')} />
                ) : anamneseAssinada ? (
                  <ShieldCheck size={14} color={tc('#10b981')} />
                ) : (
                  <HeartPulse size={14} color={tc(ds.cores.destaque)} />
                )}
                <Text
                  style={[
                    styles.anamneseCheckText,
                    temAlerta
                      ? styles.anamneseCheckTextAlert
                      : anamneseAssinada
                      ? styles.anamneseCheckTextOk
                      : styles.anamneseCheckTextPending,
                  ]}
                >
                  {temAlerta
                    ? 'ALERTA SANITÁRIO: Alergia / Queloide informado ⚠️'
                    : anamneseAssinada
                    ? 'Ficha de Saúde Assinada (Sem Restrições) ✅'
                    : 'Ficha de Saúde: Pendente de preenchimento pelo cliente ⏳'}
                </Text>
              </View>

              {/* Barra Financeira do Card */}
              <View style={styles.financialRow}>
                <View>
                  <Text style={styles.finLabel}>
                    {isConcluido ? 'Total Liquidado:' : 'Orçamento Total:'}
                  </Text>
                  <Text style={styles.finVal}>
                    R$ {isConcluido ? item.valorFinal || item.valorTotal : item.valorTotal}
                  </Text>
                </View>

                <View style={styles.sinalStatusWrap}>
                  <View style={styles.sinalIconRow}>
                    <CheckCircle2 size={12} color={tc('#10b981')} />
                    <Text style={styles.sinalStatusText}>Sinal Pago via MP: R$ {item.valorSinal}</Text>
                  </View>
                  {!isConcluido && !isCancelado && (
                    <Text style={styles.saldoRestanteText}>
                      Restante a cobrar: R$ {Math.max(0, item.valorTotal - item.valorSinal)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Botões de Ações */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.btnSecondary, temAlerta && styles.btnSecondaryAlert]}
                  onPress={() => setItemAnamnese(item)}
                >
                  <FileHeart size={14} color={temAlerta ? tc('#ef4444') : tc(ds.cores.destaque)} />
                  <Text style={[styles.btnSecondaryText, temAlerta && { color: tc('#ef4444') }]}>
                    {temAlerta ? 'Ver Alertas / Ficha' : 'Briefing & Saúde'}
                  </Text>
                </Pressable>

                {isPendente && (
                  <>
                    <Pressable
                      style={styles.btnSuccess}
                      onPress={() => { void atualizarStatus(item.id, 'confirmado').catch(() => {}); }}
                    >
                      <CheckCircle size={14} color={tc('#111')} />
                      <Text style={styles.btnSuccessText}>Aceitar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.btnDanger}
                      onPress={() => { void atualizarStatus(item.id, 'cancelado').catch(() => {}); }}
                    >
                      <XCircle size={14} color={tc('#ef4444')} />
                    </Pressable>
                  </>
                )}

                {isConfirmado && (
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={() => { void atualizarStatus(item.id, 'em_andamento').catch(() => {}); }}
                  >
                    <Play size={14} color={tc('#111')} />
                    <Text style={styles.btnPrimaryText}>Iniciar Sessão</Text>
                  </Pressable>
                )}

                {isAndamento && (
                  <Pressable
                    style={styles.btnDangerAction}
                    onPress={() => abrirModalFinalizar(item)}
                  >
                    <Square size={14} color={tc(ds.cores.texto)} fill={tc(ds.cores.texto)} />
                    <Text style={styles.btnDangerActionText}>Finalizar & Cobrar</Text>
                  </Pressable>
                )}

                {isConcluido && (
                  <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
                    <Pressable
                      style={[styles.btnReceipt, { flex: 1 }]}
                      onPress={() => setItemEmissaoNfse(item)}
                    >
                      <FileCheck2 size={13} color={tc(ds.cores.destaque)} />
                      <Text style={styles.btnReceiptText}>Emitir NFS-e</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btnReceipt, { flex: 1, backgroundColor: tc('#181818') }]}
                      onPress={() => abrirReciboAgendamento(item)}
                    >
                      <DollarSign size={13} color={tc('#10b981')} />
                      <Text style={[styles.btnReceiptText, { color: tc('#10b981') }]}>Recibo</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* MODAL DE FINALIZAÇÃO E COBRANÇA */}
      <AppModal
        visible={!!itemFinalizando}
        transparent
        animationType="slide"
        onRequestClose={() => setItemFinalizando(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.finishIconWrap}>
                  <Timer size={20} color={tc(ds.cores.destaque)} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Finalizar & Liquidar</Text>
                  <Text style={styles.modalSub}>Sessão de {itemFinalizando?.clienteNome}</Text>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setItemFinalizando(null)}>
                <X size={18} color={tc(ds.cores.textoSuave)} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.calcCard}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>Valor Total Final:</Text>
                  <TextInput
                    value={valorFinalInput}
                    onChangeText={setValorFinalInput}
                    keyboardType="numeric"
                    style={styles.calcInput}
                  />
                </View>

                <View style={styles.calcRow}>
                  <Text style={styles.calcLabel}>- Sinal já Pago (Mercado Pago):</Text>
                  <Text style={styles.calcDiscount}>- R$ {itemFinalizando?.valorSinal || 0}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.calcRowTotal}>
                  <Text style={styles.calcTotalLabel}>Saldo Restante a Cobrar:</Text>
                  <Text style={styles.calcTotalVal}>
                    R${' '}
                    {Math.max(
                      0,
                      (Number(valorFinalInput) || 0) - (itemFinalizando?.valorSinal || 0)
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={styles.methodTitle}>Forma de Recebimento do Restante:</Text>
              <View style={styles.methodRow}>
                {[
                  { id: 'pix', label: 'PIX Mercado Pago' },
                  { id: 'cartao', label: 'Cartão de Crédito' },
                  { id: 'dinheiro', label: 'No Estúdio (Dinheiro)' },
                ].map((m) => {
                  const sel = metodoPagamentoFinal === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMetodoPagamentoFinal(m.id as any)}
                      style={[styles.methodBtn, sel ? styles.methodBtnActive : styles.methodBtnIdle]}
                    >
                      <Text style={[styles.methodBtnText, sel && styles.methodBtnTextActive]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {pixCopiaColaFinal && (
                <View style={styles.pixResultBox}>
                  <Text style={styles.pixResultTitle}>QR Code de Quitação Gerado</Text>
                  <Text style={styles.pixResultSub}>Apresente ao cliente para leitura imediata:</Text>

                  <Pressable
                    style={styles.copyPixBtn}
                    onPress={async () => {
                      try { await copiarTexto(pixCopiaColaFinal || ''); setCopiadoPix(true); setTimeout(() => setCopiadoPix(false), 2000); }
                      catch { avisar('Não foi possível copiar o código.'); }
                    }}
                  >
                    <Copy size={14} color={tc('#111')} />
                    <Text style={styles.copyPixBtnText}>
                      {copiadoPix ? 'PIX Copia e Cola Copiado!' : 'Copiar Chave Copia e Cola'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.btnConfirmFinish}
                onPress={confirmarLiquidacao}
                disabled={liquidando}
              >
                {liquidando ? (
                  <ActivityIndicator color={tc('#111')} size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color={tc('#111')} />
                    <Text style={styles.btnConfirmFinishText}>
                      {pixCopiaColaFinal ? 'Concluir e Ver Recibo' : 'Liquidar e Gerar Recibo Fiscal'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      {/* MODAL DE DETALHES DE BRIEFING & ANAMNESE COM ALERTAS VERMELHOS */}
      <AppModal
        visible={!!itemAnamnese}
        transparent
        animationType="fade"
        onRequestClose={() => setItemAnamnese(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <FileHeart size={20} color={tc(ds.cores.destaque)} />
                <View>
                  <Text style={styles.modalTitle}>Briefing & Ficha de Saúde</Text>
                  <Text style={styles.modalSub}>Cliente: {itemAnamnese?.clienteNome}</Text>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setItemAnamnese(null)}>
                <X size={18} color={tc(ds.cores.textoSuave)} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Alerta Vermelho de Saúde se houver restrição */}
              {itemAnamnese?.fichaAnamnese?.tem_alerta_saude && (
                <View style={styles.redAlertBanner}>
                  <AlertTriangle size={20} color={tc('#ef4444')} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.redAlertTitle}>ATENÇÃO SANITÁRIA (ALERTA)</Text>
                    <Text style={styles.redAlertSub}>
                      O cliente informou condições ou sensibilidades que exigem cuidados especiais na bancada.
                    </Text>
                  </View>
                </View>
              )}

              {/* Conceito da Tatuagem & Briefing */}
              <View style={styles.briefingCard}>
                <Text style={styles.briefingCardHeader}>Projeto & Conceito</Text>
                <Text style={styles.briefingCardBody}>
                  {itemAnamnese?.descricao || 'Ideia autoral combinada diretamente com o artista.'}
                </Text>

                <View style={styles.briefingMetaRow}>
                  <View>
                    <Text style={styles.metaLabel}>Local do Corpo</Text>
                    <Text style={styles.metaVal}>{itemAnamnese?.localCorpo}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Tamanho Estimado</Text>
                    <Text style={styles.metaVal}>{itemAnamnese?.tamanhoCm}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Turno</Text>
                    <Text style={styles.metaVal}>
                      {itemAnamnese?.turno === 'manha'
                        ? 'Manhã (10h)'
                        : itemAnamnese?.turno === 'diaria'
                        ? 'Diária Completa'
                        : 'Tarde (14h)'}
                    </Text>
                  </View>
                </View>

                {/* Fotos de Referência */}
                {itemAnamnese?.referenciasUrls && itemAnamnese.referenciasUrls.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.metaLabel}>Fotos de Referência:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      {itemAnamnese.referenciasUrls.map((url, idx) => (
                        <Image key={idx} source={{ uri: url }} style={styles.refThumbModal} />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Declaração de Anamnese Sanitária */}
              <View style={styles.briefingCard}>
                <Text style={styles.briefingCardHeader}>Ficha de Anamnese & Biossegurança</Text>

                {itemAnamnese?.fichaAnamnese?.assinado ? (
                  <View style={styles.healthDetailsList}>
                    <View style={styles.healthItem}>
                      <Text style={styles.healthKey}>Alergias (Pigmentos/Látex/Pomadas):</Text>
                      <Text
                        style={[
                          styles.healthVal,
                          itemAnamnese.fichaAnamnese.alergias !== 'Nenhuma' && { color: tc('#ef4444'), fontWeight: '800' },
                        ]}
                      >
                        {itemAnamnese.fichaAnamnese.alergias || 'Nenhuma relatada'}
                      </Text>
                    </View>

                    <View style={styles.healthItem}>
                      <Text style={styles.healthKey}>Condições / Queloides / Cicatrização:</Text>
                      <Text
                        style={[
                          styles.healthVal,
                          itemAnamnese.fichaAnamnese.doencas_cronicas !== 'Nenhuma' && { color: tc('#ef4444'), fontWeight: '800' },
                        ]}
                      >
                        {itemAnamnese.fichaAnamnese.doencas_cronicas || 'Nenhuma relatada'}
                      </Text>
                    </View>

                    <View style={styles.healthItem}>
                      <Text style={styles.healthKey}>Medicamentos / Anticoagulantes:</Text>
                      <Text style={styles.healthVal}>
                        {itemAnamnese.fichaAnamnese.medicamentos || 'Nenhum'}
                      </Text>
                    </View>

                    <View style={styles.healthItem}>
                      <Text style={styles.healthKey}>Observações:</Text>
                      <Text style={styles.healthVal}>
                        {itemAnamnese.fichaAnamnese.observacoes || 'Sem observações adicionais'}
                      </Text>
                    </View>

                    <View style={styles.signedStamp}>
                      <ShieldCheck size={14} color={tc('#10b981')} />
                      <Text style={styles.signedStampText}>
                        Assinado digitalmente pelo cliente em{' '}
                        {itemAnamnese.fichaAnamnese.data_assinatura
                          ? new Date(itemAnamnese.fichaAnamnese.data_assinatura).toLocaleString('pt-BR')
                          : 'Data confirmada'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pendingAnamneseWrap}>
                    <Clock size={16} color={tc(ds.cores.destaque)} />
                    <Text style={styles.pendingAnamneseText}>
                      O cliente ainda não preencheu a ficha digital. Ele receberá o lembrete antes da sessão.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.btnCloseAnamnese} onPress={() => setItemAnamnese(null)}>
                <Text style={styles.btnCloseAnamneseText}>Fechar Ficha</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      {/* Recibo Fiscal Modal */}
      <ReciboFiscalModal
        visivel={modalReciboAberto}
        recibo={reciboVisualizar}
        onClose={() => setModalReciboAberto(false)}
      />

      {/* Emissão Manual de NFS-e */}
      {itemEmissaoNfse && (
        <EmissaoNfseModal
          visivel={!!itemEmissaoNfse}
          artistaId={itemEmissaoNfse.clienteId ? (itemEmissaoNfse as any).artistaId || 'current' : 'current'}
          dadosIniciais={{
            clienteId: itemEmissaoNfse.clienteId,
            clienteNome: itemEmissaoNfse.clienteNome,
            agendamentoId: itemEmissaoNfse.id,
            descricao:
              itemEmissaoNfse.descricao ||
              `Tatuagem ${itemEmissaoNfse.estilo} (${itemEmissaoNfse.localCorpo || 'Corpo'})`,
            valor: itemEmissaoNfse.valorFinal || itemEmissaoNfse.valorTotal,
            estilo: itemEmissaoNfse.estilo,
          }}
          onSucesso={(nota) => {
            setNotaVisualizar(nota);
            setModalNotaAberto(true);
            setItemEmissaoNfse(null);
          }}
          onClose={() => setItemEmissaoNfse(null)}
        />
      )}

      {/* Visualização da Nota Fiscal Emitida */}
      <DetalhesNotaModal
        visivel={modalNotaAberto}
        nota={notaVisualizar}
        onClose={() => setModalNotaAberto(false)}
      />
    </View>
  );
}

const styles = createThemedStyles({
  container: {
    flex: 1,
    gap: ds.espaco.padrao,
  },
  agendaControlCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  agendaControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  agendaStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  dotAmber: {
    backgroundColor: '#f59e0b',
  },
  agendaControlTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  agendaControlSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    marginTop: 1,
    lineHeight: 20,
    flexShrink: 1,
  },
  agendaToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: ds.raio.controle,
    borderWidth: 1,
    minHeight: ds.alvo.controle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFechada: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  btnAberta: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  agendaToggleBtnText: {
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  textFechada: {
    color: '#ef4444',
  },
  textAberta: {
    color: '#10b981',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: ds.raio.controle,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ds.alvo.compacto,
  },
  filterBtnActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  filterBtnIdle: {
    backgroundColor: ds.cores.superficie,
    borderColor: ds.cores.borda,
  },
  filterBtnText: {
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    color: ds.cores.textoSuave,
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  filterBtnTextActive: {
    color: '#111',
  },
  emptyWrap: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 30,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  emptySub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 1,
  },
  card: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: ds.cores.destaque,
    fontSize: 14,
    fontWeight: '700',
  },
  clientName: {
    color: ds.cores.texto,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    flexShrink: 1,
  },
  estiloText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeConfirmado: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgePendente: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
  },
  badgeAndamento: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  badgeConcluido: {
    backgroundColor: '#1c1c1c',
  },
  badgeCancelado: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeText: {
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  badgeTextConfirmado: { color: '#10b981' },
  badgeTextPendente: { color: ds.cores.destaque },
  badgeTextAndamento: { color: '#60a5fa' },
  badgeTextConcluido: { color: ds.cores.textoSuave },
  badgeTextCancelado: { color: '#ef4444' },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  turnoBadge: {
    backgroundColor: '#1c170c',
    borderWidth: 1,
    borderColor: '#4d390a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  turnoBadgeText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  typeBadge: {
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: '#262633',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  gridInfo: {
    flexDirection: 'row',
    backgroundColor: ds.cores.elevada,
    borderRadius: 10,
    padding: 10,
    gap: 14,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoVal: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  briefingLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  briefingVal: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  anamneseCheckRow: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  anamneseCheckRowAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  anamneseCheckRowOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  anamneseCheckRowPending: {
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderColor: 'rgba(243, 194, 26, 0.2)',
  },
  anamneseCheckText: {
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  anamneseCheckTextAlert: { color: '#ef4444' },
  anamneseCheckTextOk: { color: '#10b981' },
  anamneseCheckTextPending: { color: ds.cores.destaque },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ds.cores.borda,
    paddingTop: 8,
  },
  finLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  finVal: {
    color: ds.cores.texto,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    flexShrink: 1,
  },
  sinalStatusWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sinalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sinalStatusText: {
    color: '#10b981',
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  saldoRestanteText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnSecondary: {
    flex: 1,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryAlert: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  btnSecondaryText: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnSuccess: {
    flex: 1,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSuccessText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnDanger: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  btnPrimary: {
    flex: 1.2,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: ds.cores.destaque,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnDangerAction: {
    flex: 1.2,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnDangerActionText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnReceipt: {
    flex: 1,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnReceiptText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: ds.cores.borda,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    minWidth: 0,
  },
  finishIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '800',
    lineHeight: 26,
    flexShrink: 1,
  },
  modalSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  closeBtn: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 8,
    backgroundColor: ds.cores.elevada,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  calcCard: {
    backgroundColor: ds.cores.elevada,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    color: '#aaa',
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  calcInput: {
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: ds.cores.texto,
    fontSize: 14,
    fontWeight: '700',
    width: 100,
    textAlign: 'right',
    lineHeight: 20,
    flexShrink: 1,
  },
  calcDiscount: {
    color: '#10b981',
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: ds.cores.borda,
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTotalLabel: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    lineHeight: 17,
  },
  calcTotalVal: {
    color: ds.cores.destaque,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
  },
  methodTitle: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    textTransform: 'none',
    lineHeight: 23,
    flexShrink: 1,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: ds.raio.controle,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ds.alvo.controle,
  },
  methodBtnActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  methodBtnIdle: {
    backgroundColor: ds.cores.elevada,
    borderColor: ds.cores.borda,
  },
  methodBtnText: {
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    color: ds.cores.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 1,
  },
  methodBtnTextActive: {
    color: '#111',
  },
  pixResultBox: {
    backgroundColor: ds.cores.superficie,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  pixResultTitle: {
    color: '#10b981',
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  pixResultSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  copyPixBtn: {
    backgroundColor: ds.cores.destaque,
    borderRadius: ds.raio.controle,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  copyPixBtnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ds.cores.borda,
  },
  btnConfirmFinish: {
    backgroundColor: ds.cores.destaque,
    borderRadius: ds.raio.controle,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ds.alvo.controle,
  },
  btnConfirmFinishText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  redAlertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  redAlertTitle: {
    color: '#ef4444',
    fontSize: ds.fonte.subtitulo,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 23,
    flexShrink: 1,
  },
  redAlertSub: {
    color: '#ffcaca',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    marginTop: 2,
    flexShrink: 1,
  },
  briefingCard: {
    backgroundColor: '#131318',
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: '#22222c',
    padding: ds.espaco.padrao,
    gap: 8,
  },
  briefingCardHeader: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 20,
    flexShrink: 1,
  },
  briefingCardBody: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  briefingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#181820',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  metaLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  metaVal: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  refThumbModal: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333340',
  },
  healthDetailsList: {
    gap: 8,
    marginTop: 4,
  },
  healthItem: {
    gap: 2,
  },
  healthKey: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  healthVal: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  signedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  signedStampText: {
    color: '#10b981',
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
    flexShrink: 1,
  },
  pendingAnamneseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  pendingAnamneseText: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flex: 1,
    flexShrink: 1,
  },
  btnCloseAnamnese: {
    backgroundColor: '#1e1e24',
    borderRadius: ds.raio.controle,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
    justifyContent: 'center',
    width: ds.alvo.compacto,
  },
  btnCloseAnamneseText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
});
