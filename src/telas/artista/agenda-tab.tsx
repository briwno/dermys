import { DetalhesNotaModal } from '@/components/fiscal/detalhes-nota-modal';
import { EmissaoNfseModal } from '@/components/fiscal/emissao-nfse-modal';
import { ReciboFiscalModal } from '@/components/recibo-fiscal-modal';
import { FiscalService } from '@/services/fiscal/fiscal-service';
import { criarCobrancaFinal, gerarReciboFiscal, obterUrlQrCodePix } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { ReciboFiscal } from '@/types/financeiro';
import type { NotaFiscalRegistro } from '@/types/fiscal';
import {
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  FileCheck2,
  FileHeart,
  Play,
  QrCode,
  Square,
  Timer,
  X,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  status: 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
  valorSinal: number;
  valorTotal: number;
  valorFinal?: number;
  sinalPago: boolean;
}

export function ArtistaAgendaTab() {
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

  useEffect(() => {
    carregarAgenda();
  }, []);

  const carregarAgenda = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

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
          status,
          valor_sinal,
          valor_total,
          valor_final,
          sinal_pago,
          cliente:profiles!agendamentos_cliente_id_fkey(nome_exibicao)
        `)
        .eq('artista_id', session.user.id)
        .order('data_horario', { ascending: true });

      if (!error && data) {
        const formatados: ItemAgendaCompleto[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
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
            status: item.status || 'pendente',
            valorSinal: Number(item.valor_sinal || 0),
            valorTotal: Number(item.valor_total || 350),
            valorFinal: item.valor_final ? Number(item.valor_final) : undefined,
            sinalPago: item.sinal_pago ?? true,
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
      await supabase
        .from('agendamentos')
        .update({
          status: novoStatus,
          ...extras,
        })
        .eq('id', id);

      setAgendamentos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: novoStatus as any, ...extras } : item))
      );
    } catch {
      // silencioso
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

      if (session?.user) {
        // Gera cobrança final no Mercado Pago
        const cobranca = await criarCobrancaFinal({
          agendamentoId: itemFinalizando.id,
          artistaId: session.user.id,
          clienteId: itemFinalizando.clienteId,
          valorFinal: precoFinal,
          valorSinalJaPago: itemFinalizando.valorSinal,
          metodo: metodoPagamentoFinal,
          artistaNome: session.user.user_metadata?.full_name || 'Tatuador Dermys',
        });

        if (metodoPagamentoFinal === 'pix') {
          setPixCopiaColaFinal(cobranca.qrCodePayload);
          setQrCodeUrlFinal(cobranca.qrCodeBase64 || obterUrlQrCodePix(cobranca.qrCodePayload));
        }

        // Conclui o agendamento
        await atualizarStatus(itemFinalizando.id, 'concluido', {
          valor_final: precoFinal,
          concluido_em: new Date().toISOString(),
        });

        // Emissão automática de NFS-e caso configurado
        try {
          const pFiscal = await FiscalService.obterOuCriarPerfilFiscal(session.user.id);
          if (pFiscal.emissao_automatica) {
            await FiscalService.emitirNotaFiscal({
              artistaId: session.user.id,
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
              <Text style={[styles.filterBtnText, ativo && styles.filterBtnTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lista de Cards */}
      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginTop: 24 }} />
      ) : agendamentosFiltrados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Agenda vazia nesta categoria</Text>
          <Text style={styles.emptySub}>Novas solicitações de clientes aparecerão aqui com sinal em custódia.</Text>
        </View>
      ) : (
        agendamentosFiltrados.map((item) => {
          const isPendente = item.status === 'pendente';
          const isConfirmado = item.status === 'confirmado';
          const isAndamento = item.status === 'em_andamento';
          const isConcluido = item.status === 'concluido';
          const isCancelado = item.status === 'cancelado';

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

              {/* Detalhes de Data e Local */}
              <View style={styles.gridInfo}>
                <View style={styles.infoCol}>
                  <View style={styles.infoLine}>
                    <Calendar size={13} color="#f3c21a" />
                    <Text style={styles.infoVal}>{item.data}</Text>
                  </View>
                  <View style={styles.infoLine}>
                    <Clock size={13} color="#f3c21a" />
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

              {/* Barra Financeira do Card */}
              <View style={styles.financialRow}>
                <View>
                  <Text style={styles.finLabel}>
                    {isConcluido ? 'Total Liquidado:' : 'Orçamento Total:'}
                  </Text>
                  <Text style={styles.finVal}>
                    R$ {isConcluido ? (item.valorFinal || item.valorTotal) : item.valorTotal}
                  </Text>
                </View>

                <View style={styles.sinalStatusWrap}>
                  <View style={styles.sinalIconRow}>
                    <CheckCircle2 size={12} color="#10b981" />
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
                <Pressable style={styles.btnSecondary} onPress={() => setItemAnamnese(item)}>
                  <FileHeart size={14} color="#f3c21a" />
                  <Text style={styles.btnSecondaryText}>Briefing/Anamnese</Text>
                </Pressable>

                {isPendente && (
                  <>
                    <Pressable
                      style={styles.btnSuccess}
                      onPress={() => atualizarStatus(item.id, 'confirmado')}
                    >
                      <CheckCircle size={14} color="#111" />
                      <Text style={styles.btnSuccessText}>Aceitar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.btnDanger}
                      onPress={() => atualizarStatus(item.id, 'cancelado')}
                    >
                      <XCircle size={14} color="#ef4444" />
                    </Pressable>
                  </>
                )}

                {isConfirmado && (
                  <Pressable
                    style={styles.btnPrimary}
                    onPress={() => atualizarStatus(item.id, 'em_andamento')}
                  >
                    <Play size={14} color="#111" />
                    <Text style={styles.btnPrimaryText}>Iniciar Sessão</Text>
                  </Pressable>
                )}

                {isAndamento && (
                  <Pressable style={styles.btnDangerAction} onPress={() => abrirModalFinalizar(item)}>
                    <Square size={14} color="#fff" fill="#fff" />
                    <Text style={styles.btnDangerActionText}>Finalizar & Cobrar</Text>
                  </Pressable>
                )}

                {isConcluido && (
                  <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
                    <Pressable
                      style={[styles.btnReceipt, { flex: 1 }]}
                      onPress={() => setItemEmissaoNfse(item)}
                    >
                      <FileCheck2 size={13} color="#f3c21a" />
                      <Text style={styles.btnReceiptText}>Emitir NFS-e</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btnReceipt, { flex: 1, backgroundColor: '#181818' }]}
                      onPress={() => abrirReciboAgendamento(item)}
                    >
                      <DollarSign size={13} color="#10b981" />
                      <Text style={[styles.btnReceiptText, { color: '#10b981' }]}>Recibo</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Modal de Finalização de Sessão & Cobrança MP */}
      <Modal
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
                  <Timer size={20} color="#f3c21a" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Finalizar & Liquidar</Text>
                  <Text style={styles.modalSub}>Sessão de {itemFinalizando?.clienteNome}</Text>
                </View>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setItemFinalizando(null)}>
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Resumo Financeiro */}
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

              {/* Seletor de Método de Liquidação */}
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

              {/* Se PIX foi gerado na finalização */}
              {pixCopiaColaFinal && (
                <View style={styles.pixResultBox}>
                  <Text style={styles.pixResultTitle}>QR Code de Quitação Gerado</Text>
                  <Text style={styles.pixResultSub}>Apresente ao cliente para leitura imediata:</Text>

                  <Pressable
                    style={styles.copyPixBtn}
                    onPress={() => {
                      setCopiadoPix(true);
                      setTimeout(() => setCopiadoPix(false), 2000);
                    }}
                  >
                    <Copy size={14} color="#111" />
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
                  <ActivityIndicator color="#111" size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#111" />
                    <Text style={styles.btnConfirmFinishText}>
                      {pixCopiaColaFinal ? 'Concluir e Ver Recibo' : 'Liquidar e Gerar Recibo Fiscal'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes da Anamnese e Briefing */}
      <Modal
        visible={!!itemAnamnese}
        transparent
        animationType="fade"
        onRequestClose={() => setItemAnamnese(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <FileHeart size={20} color="#f3c21a" />
                <Text style={styles.modalTitle}>Briefing & Anamnese</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setItemAnamnese(null)}>
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.briefingCard}>
                <Text style={styles.briefingCardHeader}>Conceito da Tatuagem</Text>
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
                </View>
              </View>

              <View style={styles.briefingCard}>
                <Text style={styles.briefingCardHeader}>Declaração de Saúde Digital</Text>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.checkText}>Sem histórico de alergia a pigmentos</Text>
                </View>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.checkText}>Não gestante / lactante</Text>
                </View>
                <View style={styles.checkItem}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <Text style={styles.checkText}>Termo de responsabilidade assinado digitalmente</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.btnCloseAnamnese} onPress={() => setItemAnamnese(null)}>
                <Text style={styles.btnCloseAnamneseText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Recibo Fiscal Modal */}
      <ReciboFiscalModal
        visivel={modalReciboAberto}
        recibo={reciboVisualizar}
        onClose={() => setModalReciboAberto(false)}
      />

      {/* Emissão Manual de NFS-e a partir do Agendamento */}
      {itemEmissaoNfse && (
        <EmissaoNfseModal
          visivel={!!itemEmissaoNfse}
          artistaId={itemEmissaoNfse.clienteId ? (itemEmissaoNfse as any).artistaId || 'current' : 'current'}
          dadosIniciais={{
            clienteId: itemEmissaoNfse.clienteId,
            clienteNome: itemEmissaoNfse.clienteNome,
            agendamentoId: itemEmissaoNfse.id,
            descricao: itemEmissaoNfse.descricao || `Tatuagem ${itemEmissaoNfse.estilo} (${itemEmissaoNfse.localCorpo || 'Corpo'})`,
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

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  filterBtnIdle: {
    backgroundColor: '#111',
    borderColor: '#222',
  },
  filterBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888',
    textTransform: 'uppercase',
  },
  filterBtnTextActive: {
    color: '#111',
  },
  emptyWrap: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 30,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 14,
    gap: 12,
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
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
  },
  clientName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  estiloText: {
    color: '#9ca3af',
    fontSize: 11,
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
    fontSize: 9,
    fontWeight: '900',
  },
  badgeTextConfirmado: { color: '#10b981' },
  badgeTextPendente: { color: '#f3c21a' },
  badgeTextAndamento: { color: '#60a5fa' },
  badgeTextConcluido: { color: '#9ca3af' },
  badgeTextCancelado: { color: '#ef4444' },
  gridInfo: {
    flexDirection: 'row',
    backgroundColor: '#141414',
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
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '700',
  },
  briefingLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  briefingVal: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 8,
  },
  finLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  finVal: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
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
    fontSize: 11,
    fontWeight: '800',
  },
  saldoRestanteText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryText: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '800',
  },
  btnSuccess: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSuccessText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  btnDanger: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1.2,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#f3c21a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  btnReceipt: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnReceiptText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '88%',
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
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
    borderBottomColor: '#1a1a1a',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    color: '#9ca3af',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  calcCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    gap: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  calcInput: {
    width: 90,
    height: 38,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#f3c21a',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  calcDiscount: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
  },
  calcRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTotalLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  calcTotalVal: {
    color: '#f3c21a',
    fontSize: 18,
    fontWeight: '900',
  },
  methodTitle: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  methodRow: {
    gap: 6,
  },
  methodBtn: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  methodBtnActive: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderColor: '#f3c21a',
  },
  methodBtnIdle: {
    backgroundColor: '#141414',
    borderColor: '#222',
  },
  methodBtnText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
  methodBtnTextActive: {
    color: '#f3c21a',
    fontWeight: '900',
  },
  pixResultBox: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  pixResultTitle: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pixResultSub: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
  },
  copyPixBtn: {
    backgroundColor: '#f3c21a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyPixBtnText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btnConfirmFinish: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnConfirmFinishText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  briefingCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    gap: 10,
  },
  briefingCardHeader: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  briefingCardBody: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
  briefingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 8,
  },
  metaLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  btnCloseAnamnese: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCloseAnamneseText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
