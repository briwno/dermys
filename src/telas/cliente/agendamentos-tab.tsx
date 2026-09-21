import { AftercareModal } from '@/components/aftercare-modal';
import { DetalhesNotaModal } from '@/components/fiscal/detalhes-nota-modal';
import { ReciboFiscalModal } from '@/components/recibo-fiscal-modal';
import { gerarReciboFiscal } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { ReciboFiscal } from '@/types/financeiro';
import type { NotaFiscalRegistro } from '@/types/fiscal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export interface ItemAgendamentoCliente {
  id: string;
  artistaId: string;
  artistaNome: string;
  estudioNome: string;
  cidade: string;
  data: string;
  horario: string;
  estilo: string;
  descricao?: string;
  localCorpo?: string;
  tamanhoCm?: string;
  status: 'confirmado' | 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  valorTotal: number;
  valorSinal: number;
  valorFinal?: number;
  sinalPago: boolean;
}

export function ClienteAgendamentosTab() {
  const [agendamentos, setAgendamentos] = useState<ItemAgendamentoCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'concluidos'>('todos');

  // Modais
  const [aftercareAberto, setAftercareAberto] = useState(false);
  const [artistaAftercareNome, setArtistaAftercareNome] = useState('');
  const [reciboSelecionado, setReciboSelecionado] = useState<ReciboFiscal | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscalRegistro | null>(null);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          artista_id,
          data_horario,
          estilo,
          descricao,
          local_corpo,
          tamanho_cm,
          status,
          valor_total,
          valor_sinal,
          valor_final,
          sinal_pago,
          artista:profiles!agendamentos_artista_id_fkey(nome_exibicao, nome_estudio, cidade)
        `)
        .eq('cliente_id', session.user.id)
        .order('data_horario', { ascending: false });

      if (!error && data) {
        const formatados: ItemAgendamentoCliente[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
          return {
            id: item.id,
            artistaId: item.artista_id,
            artistaNome: item.artista?.nome_exibicao || 'Artista Dermys',
            estudioNome: item.artista?.nome_estudio || 'Estúdio Particular',
            cidade: item.artista?.cidade || 'São Paulo, SP',
            data: d.toLocaleDateString('pt-BR'),
            horario: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            estilo: item.estilo || 'Fine Line',
            descricao: item.descricao,
            localCorpo: item.local_corpo || 'Braço',
            tamanhoCm: item.tamanho_cm || '10 a 15 cm',
            status: item.status || 'pendente',
            valorTotal: Number(item.valor_total || 350),
            valorSinal: Number(item.valor_sinal || 100),
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

  const cancelarAgendamento = async (id: string) => {
    try {
      await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id);

      setAgendamentos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'cancelado' } : item))
      );
    } catch {
      // silencioso
    }
  };

  const abrirGuiaAftercare = (artistaNome: string) => {
    setArtistaAftercareNome(artistaNome);
    setAftercareAberto(true);
  };

  const abrirRecibo = async (item: ItemAgendamentoCliente) => {
    try {
      // Verifica se já existe NFS-e emitida no banco para este agendamento
      const { data } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('agendamento_id', item.id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setNotaSelecionada(data as any);
        setModalNotaAberto(true);
        return;
      }
    } catch {
      // fallback
    }

    const recibo = gerarReciboFiscal({
      agendamentoId: item.id,
      artistaNome: item.artistaNome,
      artistaEstudio: item.estudioNome,
      clienteNome: 'Cliente Dermys',
      descricaoServico: item.descricao || `Procedimento ${item.estilo} (${item.localCorpo})`,
      estilo: item.estilo,
      valorSinal: item.valorSinal,
      valorFinal: item.valorFinal || item.valorTotal,
      formaPagamento: 'Mercado Pago PIX',
    });
    setReciboSelecionado(recibo);
    setModalReciboAberto(true);
  };

  const agendamentosFiltrados = agendamentos.filter((item) => {
    if (filtro === 'todos') return true;
    if (filtro === 'ativos') return item.status === 'pendente' || item.status === 'confirmado' || item.status === 'em_andamento';
    if (filtro === 'concluidos') return item.status === 'concluido' || item.status === 'cancelado';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Abas de Filtros */}
      <View style={styles.filterRow}>
        {[
          { id: 'todos', label: 'Tudo' },
          { id: 'ativos', label: 'Em Aberto' },
          { id: 'concluidos', label: 'Histórico' },
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

      {/* Lista de Agendamentos */}
      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginTop: 20 }} />
      ) : agendamentosFiltrados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nenhum agendamento encontrado</Text>
          <Text style={styles.emptySub}>Explore os artistas no feed para agendar sua próxima tatuagem com sinal protegido.</Text>
        </View>
      ) : (
        agendamentosFiltrados.map((item) => {
          const isConfirmado = item.status === 'confirmado';
          const isPendente = item.status === 'pendente';
          const isAndamento = item.status === 'em_andamento';
          const isConcluido = item.status === 'concluido';
          const isCancelado = item.status === 'cancelado';

          const saldoRestante = Math.max(0, item.valorTotal - item.valorSinal);

          return (
            <View key={item.id} style={styles.card}>
              {/* Header do Card */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.artistName}>{item.artistaNome}</Text>
                  <Text style={styles.studioName}>{item.estudioNome} • {item.cidade}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
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
                      styles.statusText,
                      isConfirmado
                        ? styles.statusTextConfirmado
                        : isPendente
                        ? styles.statusTextPendente
                        : isAndamento
                        ? styles.statusTextAndamento
                        : isConcluido
                        ? styles.statusTextConcluido
                        : styles.statusTextCancelado,
                    ]}
                  >
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Data, Horário e Estilo */}
              <View style={styles.gridInfo}>
                <View style={styles.infoLine}>
                  <Calendar size={13} color="#f3c21a" />
                  <Text style={styles.infoText}>{item.data} às {item.horario}</Text>
                </View>
                <View style={styles.infoLine}>
                  <Sparkles size={13} color="#f3c21a" />
                  <Text style={styles.infoText}>Estilo: {item.estilo} ({item.localCorpo || 'Corpo'})</Text>
                </View>
              </View>

              {/* Bloco Financeiro Mercado Pago */}
              <View style={styles.finCard}>
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>Sinal de Reserva:</Text>
                  <View style={styles.sinalPaidRow}>
                    <ShieldCheck size={13} color="#10b981" />
                    <Text style={styles.sinalPaidText}>R$ {item.valorSinal} (Pago via MP)</Text>
                  </View>
                </View>

                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>
                    {isConcluido ? 'Total Liquidado:' : 'Restante a Pagar na Sessão:'}
                  </Text>
                  <Text style={styles.finTotalVal}>
                    R$ {isConcluido ? (item.valorFinal || item.valorTotal) : saldoRestante}
                  </Text>
                </View>
              </View>

              {/* Ações do Cliente */}
              <View style={styles.actionsRow}>
                {isConcluido && (
                  <Pressable
                    style={styles.btnAftercare}
                    onPress={() => abrirGuiaAftercare(item.artistaNome)}
                  >
                    <ShieldCheck size={13} color="#10b981" />
                    <Text style={styles.btnAftercareText}>Guia Pós-Tattoo</Text>
                  </Pressable>
                )}

                {(isConcluido || isConfirmado) && (
                  <Pressable style={styles.btnRecibo} onPress={() => abrirRecibo(item)}>
                    <FileText size={13} color="#f3c21a" />
                    <Text style={styles.btnReciboText}>Recibo Fiscal</Text>
                  </Pressable>
                )}

                {isPendente && (
                  <Pressable
                    style={styles.btnCancelar}
                    onPress={() => cancelarAgendamento(item.id)}
                  >
                    <X size={13} color="#ef4444" />
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Modais de Suporte */}
      <AftercareModal
        visivel={aftercareAberto}
        artistaNome={artistaAftercareNome}
        onClose={() => setAftercareAberto(false)}
      />

      <ReciboFiscalModal
        visivel={modalReciboAberto}
        recibo={reciboSelecionado}
        onClose={() => setModalReciboAberto(false)}
      />

      <DetalhesNotaModal
        visivel={modalNotaAberto}
        nota={notaSelecionada}
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
    gap: 8,
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    backgroundColor: '#101010',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  artistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  studioName: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
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
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeConcluido: {
    backgroundColor: '#1c1c1c',
  },
  badgeCancelado: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  statusTextConfirmado: { color: '#10b981' },
  statusTextPendente: { color: '#f3c21a' },
  statusTextAndamento: { color: '#60a5fa' },
  statusTextConcluido: { color: '#9ca3af' },
  statusTextCancelado: { color: '#ef4444' },
  gridInfo: {
    backgroundColor: '#141414',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  finCard: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 8,
    gap: 4,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  finLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sinalPaidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sinalPaidText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  finTotalVal: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnAftercare: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnAftercareText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  btnRecibo: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnReciboText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  btnCancelar: {
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  btnCancelarText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
});
