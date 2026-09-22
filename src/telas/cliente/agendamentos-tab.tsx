import { AftercareModal } from '@/components/aftercare-modal';
import { DetalhesNotaModal } from '@/components/fiscal/detalhes-nota-modal';
import { ReciboFiscalModal } from '@/components/recibo-fiscal-modal';
import { AppModal } from '@/components/ui/app-modal';
import { gerarReciboFiscal } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { ReciboFiscal } from '@/types/financeiro';
import type { NotaFiscalRegistro } from '@/types/fiscal';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  FileHeart,
  FileText,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunset,
  X,
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
  turno?: string;
  tipoSessao?: string;
  referenciasUrls?: string[];
  status: 'confirmado' | 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  valorTotal: number;
  valorSinal: number;
  valorFinal?: number;
  sinalPago: boolean;
  anamneseAssinada?: boolean;
  temAlertaSaude?: boolean;
}

export function ClienteAgendamentosTab() {
  const [agendamentos, setAgendamentos] = useState<ItemAgendamentoCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'concluidos'>('todos');

  // Modais de Apoio
  const [aftercareAberto, setAftercareAberto] = useState(false);
  const [artistaAftercareNome, setArtistaAftercareNome] = useState('');
  const [reciboSelecionado, setReciboSelecionado] = useState<ReciboFiscal | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscalRegistro | null>(null);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);

  // Modal de Ficha de Anamnese & Saúde
  const [agendamentoParaAnamnese, setAgendamentoParaAnamnese] =
    useState<ItemAgendamentoCliente | null>(null);
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false);
  const [temAlergia, setTemAlergia] = useState(false);
  const [detalheAlergia, setDetalheAlergia] = useState('');
  const [temQueloide, setTemQueloide] = useState(false);
  const [temCondicaoSaude, setTemCondicaoSaude] = useState(false);
  const [detalheCondicao, setDetalheCondicao] = useState('');
  const [isGestanteLactante, setIsGestanteLactante] = useState(false);
  const [usaAnticoagulante, setUsaAnticoagulante] = useState(false);
  const [primeiraTattoo, setPrimeiraTattoo] = useState(false);
  const [concordouTermos, setConcordouTermos] = useState(true);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      // 1. Busca agendamentos do cliente
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
          turno,
          tipo_sessao,
          referencias_urls,
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
        // 2. Busca fichas de anamnese existentes
        const { data: fichasData } = await supabase
          .from('fichas_anamnese')
          .select('id, agendamento_id, artista_id, assinado, tem_alerta_saude')
          .eq('cliente_id', session.user.id);

        const fichasPorAgendamento = new Map<string, any>();
        if (fichasData) {
          fichasData.forEach((f: any) => {
            if (f.agendamento_id) {
              fichasPorAgendamento.set(f.agendamento_id, f);
            }
          });
        }

        const formatados: ItemAgendamentoCliente[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
          const ficha = fichasPorAgendamento.get(item.id);

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
            localCorpo: item.local_corpo || 'Antebraço',
            tamanhoCm: item.tamanho_cm || '10 a 15 cm',
            turno: item.turno || 'tarde',
            tipoSessao: item.tipo_sessao || 'exclusivo',
            referenciasUrls: item.referencias_urls || [],
            status: item.status || 'confirmado',
            valorTotal: Number(item.valor_total || 350),
            valorSinal: Number(item.valor_sinal || 100),
            valorFinal: item.valor_final ? Number(item.valor_final) : undefined,
            sinalPago: item.sinal_pago ?? true,
            anamneseAssinada: ficha?.assinado ?? false,
            temAlertaSaude: ficha?.tem_alerta_saude ?? false,
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

  const abrirModalAnamnese = (item: ItemAgendamentoCliente) => {
    setAgendamentoParaAnamnese(item);
    setTemAlergia(false);
    setDetalheAlergia('');
    setTemQueloide(false);
    setTemCondicaoSaude(false);
    setDetalheCondicao('');
    setIsGestanteLactante(false);
    setUsaAnticoagulante(false);
    setPrimeiraTattoo(false);
    setConcordouTermos(true);
  };

  const salvarFichaAnamnese = async () => {
    if (!agendamentoParaAnamnese) return;
    setSalvandoAnamnese(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const temAlerta =
        temAlergia || temQueloide || temCondicaoSaude || isGestanteLactante || usaAnticoagulante;

      const alergiasTexto = temAlergia
        ? detalheAlergia || 'Alergia relatada a pigmentos/látex'
        : 'Nenhuma';
      const condicoesTexto = temCondicaoSaude
        ? detalheCondicao || 'Condição de saúde relatada'
        : temQueloide
        ? 'Histórico de queloide/cicatrização hipertrófica'
        : 'Nenhuma';

      const observacoes = `Queloide: ${temQueloide ? 'Sim' : 'Não'} | Gestante: ${
        isGestanteLactante ? 'Sim' : 'Não'
      } | Anticoagulante: ${usaAnticoagulante ? 'Sim' : 'Não'} | Primeira tattoo: ${
        primeiraTattoo ? 'Sim' : 'Não'
      }`;

      // Salva ou atualiza a ficha vinculada ao agendamento
      await supabase.from('fichas_anamnese').insert({
        agendamento_id: agendamentoParaAnamnese.id,
        cliente_id: session.user.id,
        artista_id: agendamentoParaAnamnese.artistaId,
        alergias: alergiasTexto,
        doencas_cronicas: condicoesTexto,
        medicamentos: usaAnticoagulante ? 'Anticoagulante relatado' : 'Nenhum',
        observacoes,
        assinado: true,
        tem_alerta_saude: temAlerta,
        data_assinatura: new Date().toISOString(),
      });

      // Atualiza o estado local imediatamente
      setAgendamentos((prev) =>
        prev.map((item) =>
          item.id === agendamentoParaAnamnese.id
            ? { ...item, anamneseAssinada: true, temAlertaSaude: temAlerta }
            : item
        )
      );

      setAgendamentoParaAnamnese(null);
    } catch (err) {
      console.warn('Erro ao salvar anamnese:', err);
    } finally {
      setSalvandoAnamnese(false);
    }
  };

  const cancelarAgendamento = async (id: string) => {
    try {
      await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);

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
    if (filtro === 'ativos')
      return (
        item.status === 'pendente' ||
        item.status === 'confirmado' ||
        item.status === 'em_andamento'
      );
    if (filtro === 'concluidos') return item.status === 'concluido' || item.status === 'cancelado';
    return true;
  });

  // Agendamento ativo prioritário com ficha pendente
  const agendamentoPendenteAnamnese = agendamentos.find(
    (a) => (a.status === 'confirmado' || a.status === 'em_andamento') && !a.anamneseAssinada
  );

  return (
    <View style={styles.container}>
      {/* Banner de Destaque para Ficha de Saúde Pendente */}
      {agendamentoPendenteAnamnese && (
        <View style={styles.anamneseAlertBanner}>
          <View style={styles.anamneseAlertHeader}>
            <View style={styles.anamneseIconWrap}>
              <HeartPulse size={18} color="#f3c21a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.anamneseAlertTitle}>Ficha de Saúde Pré-Sessão</Text>
              <Text style={styles.anamneseAlertSub}>
                Sua sessão de {agendamentoPendenteAnamnese.data} está confirmada com sinal! Por
                exigência sanitária, complete sua ficha antes de ir ao estúdio.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.btnCompletarAnamneseBanner}
            onPress={() => abrirModalAnamnese(agendamentoPendenteAnamnese)}
          >
            <FileHeart size={14} color="#111" />
            <Text style={styles.btnCompletarAnamneseBannerText}>Preencher Ficha Agora</Text>
          </Pressable>
        </View>
      )}

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
              <Text style={[styles.filterBtnText, ativo && styles.filterBtnTextActive]}>
                {f.label}
              </Text>
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
          <Text style={styles.emptySub}>
            Explore os artistas no feed para agendar sua próxima tatuagem com sinal protegido e
            turnos de bancada.
          </Text>
        </View>
      ) : (
        agendamentosFiltrados.map((item) => {
          const isConfirmado = item.status === 'confirmado';
          const isPendente = item.status === 'pendente';
          const isAndamento = item.status === 'em_andamento';
          const isConcluido = item.status === 'concluido';
          const isCancelado = item.status === 'cancelado';

          const saldoRestante = Math.max(0, item.valorTotal - item.valorSinal);
          const turnoTexto =
            item.turno === 'manha'
              ? 'Turno Manhã (10h)'
              : item.turno === 'diaria'
              ? 'Diária Completa'
              : 'Turno Tarde (14h)';

          return (
            <View key={item.id} style={styles.card}>
              {/* Header do Card */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.artistName}>{item.artistaNome}</Text>
                  <Text style={styles.studioName}>
                    {item.estudioNome} • {item.cidade}
                  </Text>
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

              {/* Badges de Turno e Tipo */}
              <View style={styles.pillsRow}>
                <View style={styles.turnoPill}>
                  {item.turno === 'manha' ? (
                    <Sun size={11} color="#f3c21a" />
                  ) : item.turno === 'diaria' ? (
                    <Zap size={11} color="#f3c21a" />
                  ) : (
                    <Sunset size={11} color="#f3c21a" />
                  )}
                  <Text style={styles.turnoPillText}>{turnoTexto}</Text>
                </View>

                <View style={styles.typePill}>
                  <Sparkles size={11} color="#9ca3af" />
                  <Text style={styles.typePillText}>
                    {item.tipoSessao === 'flash' ? 'Flash Autoral' : 'Projeto Exclusivo'}
                  </Text>
                </View>
              </View>

              {/* Data, Horário e Detalhes do Briefing */}
              <View style={styles.gridInfo}>
                <View style={styles.infoLine}>
                  <Calendar size={13} color="#f3c21a" />
                  <Text style={styles.infoText}>
                    {item.data} às {item.horario}
                  </Text>
                </View>
                <View style={styles.infoLine}>
                  <Sparkles size={13} color="#f3c21a" />
                  <Text style={styles.infoText}>
                    {item.estilo} • {item.localCorpo || 'Corpo'} ({item.tamanhoCm || 'Médio'})
                  </Text>
                </View>
                {item.descricao && (
                  <Text style={styles.descText} numberOfLines={2}>
                    "{item.descricao}"
                  </Text>
                )}
                {item.referenciasUrls && item.referenciasUrls.length > 0 && (
                  <View style={styles.cardReferencesRow}>
                    {item.referenciasUrls.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={styles.cardReferenceThumb} />
                    ))}
                  </View>
                )}
              </View>

              {/* Bloco de Anamnese Sanitária */}
              <View
                style={[
                  styles.anamneseStatusCard,
                  item.anamneseAssinada
                    ? styles.anamneseCardDone
                    : styles.anamneseCardPending,
                ]}
              >
                <View style={styles.anamneseStatusLeft}>
                  {item.anamneseAssinada ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : (
                    <AlertCircle size={16} color="#f3c21a" />
                  )}
                  <View>
                    <Text
                      style={[
                        styles.anamneseStatusTitle,
                        item.anamneseAssinada && { color: '#10b981' },
                      ]}
                    >
                      {item.anamneseAssinada
                        ? 'Ficha de Saúde Assinada & Pronta ✅'
                        : 'Ficha de Saúde Pendente ⚠️'}
                    </Text>
                    <Text style={styles.anamneseStatusSub}>
                      {item.anamneseAssinada
                        ? 'Protocolo de biossegurança validado digitalmente'
                        : 'Preencha antes de ir ao estúdio'}
                    </Text>
                  </View>
                </View>

                {!item.anamneseAssinada && (
                  <Pressable
                    style={styles.btnPreencherAnamneseMini}
                    onPress={() => abrirModalAnamnese(item)}
                  >
                    <Text style={styles.btnPreencherAnamneseMiniText}>Preencher</Text>
                  </Pressable>
                )}
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
                    R$ {isConcluido ? item.valorFinal || item.valorTotal : saldoRestante}
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

      {/* ========================================================================= */}
      {/* MODAL DE FICHA DE ANAMNESE & CONSENTIMENTO DO CLIENTE                     */}
      {/* ========================================================================= */}
      <AppModal
        visible={!!agendamentoParaAnamnese}
        transparent
        animationType="slide"
        onRequestClose={() => setAgendamentoParaAnamnese(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <HeartPulse size={20} color="#f3c21a" />
                <View>
                  <Text style={styles.modalTitle}>Ficha de Saúde & Biossegurança</Text>
                  <Text style={styles.modalSub}>
                    Procedimento com {agendamentoParaAnamnese?.artistaNome}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setAgendamentoParaAnamnese(null)}
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.anamneseInfoBox}>
                <Info size={14} color="#f3c21a" />
                <Text style={styles.anamneseInfoText}>
                  Exigência da Vigilância Sanitária para proteção da sua saúde e preparo da bancada pelo tatuador.
                </Text>
              </View>

              <View style={styles.formGroup}>
                {/* 1. Alergias */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>Possui alergia a pigmentos, látex ou pomadas?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, temAlergia && styles.toggleBtnActive]}
                    onPress={() => setTemAlergia(!temAlergia)}
                  >
                    <View style={[styles.toggleCircle, temAlergia && styles.toggleCircleActive]} />
                  </Pressable>
                </View>
                {temAlergia && (
                  <TextInput
                    value={detalheAlergia}
                    onChangeText={setDetalheAlergia}
                    placeholder="Especifique a substância ou pomada..."
                    placeholderTextColor="#666"
                    style={styles.detailInput}
                  />
                )}

                {/* 2. Queloides */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>Histórico de queloides ou cicatrização hipertrófica?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, temQueloide && styles.toggleBtnActive]}
                    onPress={() => setTemQueloide(!temQueloide)}
                  >
                    <View style={[styles.toggleCircle, temQueloide && styles.toggleCircleActive]} />
                  </Pressable>
                </View>

                {/* 3. Condições de Saúde / Doenças Crônicas */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>Diabetes, hemofilia, hepatite ou hipertensão?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, temCondicaoSaude && styles.toggleBtnActive]}
                    onPress={() => setTemCondicaoSaude(!temCondicaoSaude)}
                  >
                    <View style={[styles.toggleCircle, temCondicaoSaude && styles.toggleCircleActive]} />
                  </Pressable>
                </View>
                {temCondicaoSaude && (
                  <TextInput
                    value={detalheCondicao}
                    onChangeText={setDetalheCondicao}
                    placeholder="Detalhes médicos para conhecimento do artista..."
                    placeholderTextColor="#666"
                    style={styles.detailInput}
                  />
                )}

                {/* 4. Anticoagulantes */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>Faz uso contínuo de anticoagulantes ou ácido acetilsalicílico?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, usaAnticoagulante && styles.toggleBtnActive]}
                    onPress={() => setUsaAnticoagulante(!usaAnticoagulante)}
                  >
                    <View style={[styles.toggleCircle, usaAnticoagulante && styles.toggleCircleActive]} />
                  </Pressable>
                </View>

                {/* 5. Gestante / Lactante */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>Está gestante ou em fase de amamentação?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, isGestanteLactante && styles.toggleBtnActive]}
                    onPress={() => setIsGestanteLactante(!isGestanteLactante)}
                  >
                    <View style={[styles.toggleCircle, isGestanteLactante && styles.toggleCircleActive]} />
                  </Pressable>
                </View>

                {/* 6. Primeira Tattoo */}
                <View style={styles.formItem}>
                  <View style={styles.formItemText}>
                    <Text style={styles.formQuestion}>É sua primeira tatuagem?</Text>
                  </View>
                  <Pressable
                    style={[styles.toggleBtn, primeiraTattoo && styles.toggleBtnActive]}
                    onPress={() => setPrimeiraTattoo(!primeiraTattoo)}
                  >
                    <View style={[styles.toggleCircle, primeiraTattoo && styles.toggleCircleActive]} />
                  </Pressable>
                </View>
              </View>

              {/* Termo de Consentimento Legal */}
              <View style={styles.legalBox}>
                <Pressable
                  style={styles.checkRow}
                  onPress={() => setConcordouTermos(!concordouTermos)}
                >
                  <View style={[styles.checkSquare, concordouTermos && styles.checkSquareActive]}>
                    {concordouTermos && <Check size={12} color="#111" />}
                  </View>
                  <Text style={styles.legalText}>
                    Declaro sob as penas da lei que todas as informações prestadas são verídicas e autorizo o procedimento estético com agulhas descartáveis.
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.btnAssinarFicha, !concordouTermos && styles.btnDisabled]}
                onPress={salvarFichaAnamnese}
                disabled={salvandoAnamnese || !concordouTermos}
              >
                {salvandoAnamnese ? (
                  <ActivityIndicator color="#111" size="small" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#111" />
                    <Text style={styles.btnAssinarFichaText}>Assinar Ficha Digitalmente</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

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
  anamneseAlertBanner: {
    backgroundColor: '#1c170c',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#543f07',
    padding: 14,
    gap: 10,
  },
  anamneseAlertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  anamneseIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262010',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anamneseAlertTitle: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '800',
  },
  anamneseAlertSub: {
    color: '#ccc',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  btnCompletarAnamneseBanner: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnCompletarAnamneseBannerText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  turnoPill: {
    backgroundColor: '#181710',
    borderWidth: 1,
    borderColor: '#383018',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  turnoPillText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
  },
  typePill: {
    backgroundColor: '#15151a',
    borderWidth: 1,
    borderColor: '#252530',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  typePillText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: '700',
  },
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
  descText: {
    color: '#888',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  anamneseStatusCard: {
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  anamneseCardDone: {
    backgroundColor: '#0d1a14',
    borderColor: '#13402c',
  },
  anamneseCardPending: {
    backgroundColor: '#1a160c',
    borderColor: '#42330a',
  },
  anamneseStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  anamneseStatusTitle: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  anamneseStatusSub: {
    color: '#888',
    fontSize: 9,
  },
  btnPreencherAnamneseMini: {
    backgroundColor: '#f3c21a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnPreencherAnamneseMiniText: {
    color: '#111',
    fontSize: 10,
    fontWeight: '800',
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
  cardReferencesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  cardReferenceThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333344',
    backgroundColor: '#16161e',
  },
  btnCancelarText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    backgroundColor: '#0e0e12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#22222b',
    paddingTop: 14,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSub: {
    color: '#888',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#181820',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  anamneseInfoBox: {
    backgroundColor: '#1b170c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4d390a',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  anamneseInfoText: {
    color: '#ccc',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  formGroup: {
    gap: 10,
  },
  formItem: {
    backgroundColor: '#131318',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22222b',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formItemText: {
    flex: 1,
    paddingRight: 10,
  },
  formQuestion: {
    color: '#eee',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#262633',
    padding: 2,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#f3c21a',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#888',
  },
  toggleCircleActive: {
    backgroundColor: '#111',
    alignSelf: 'flex-end',
  },
  detailInput: {
    backgroundColor: '#16161f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e2e3d',
    padding: 10,
    color: '#fff',
    fontSize: 11,
    marginTop: -4,
  },
  legalBox: {
    backgroundColor: '#121217',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 12,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  checkSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#1a1a24',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkSquareActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  legalText: {
    color: '#aaa',
    fontSize: 10,
    lineHeight: 15,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1c1c24',
  },
  btnAssinarFicha: {
    backgroundColor: '#f3c21a',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnAssinarFichaText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
