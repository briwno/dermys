import { criarCobrancaSinal } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { CartaoArtista } from '@/telas/cliente/inicio-tab';
import {
  AlertCircle,
  Calendar as CalendarIcon,
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
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react-native';
import { AppModal } from '@/components/ui/app-modal';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface ModalReservaProps {
  visivel: boolean;
  artista: CartaoArtista | null;
  onClose: () => void;
  onSucesso: () => void;
}

const HORARIOS_DISPONIVEIS = ['10:00', '11:30', '14:00', '15:30', '17:00', '19:00'];
const LOCAIS_CORPO = ['Antebraço', 'Braço/Bíceps', 'Costela', 'Coxa', 'Panturrilha', 'Costas', 'Ombro', 'Mão/Pulso'];
const TAMANHOS = ['5 a 8 cm (Mini)', '10 a 15 cm (Médio)', '18 a 25 cm (Grande)', 'Fechamento'];

export function ModalReservaCliente({ visivel, artista, onClose, onSucesso }: ModalReservaProps) {
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [carregando, setCarregando] = useState(false);

  // Etapa 1: Data e Horário
  const [dataSelecionada, setDataSelecionada] = useState(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
  const [horarioSelecionado, setHorarioSelecionado] = useState('14:00');
  const [mesAtual, setMesAtual] = useState(new Date());

  // Etapa 2: Briefing
  const [descricaoArte, setDescricaoArte] = useState('');
  const [localCorpo, setLocalCorpo] = useState('Antebraço');
  const [tamanhoCm, setTamanhoCm] = useState('10 a 15 cm (Médio)');

  // Etapa 3: Anamnese
  const [temAlergia, setTemAlergia] = useState(false);
  const [detalheAlergia, setDetalheAlergia] = useState('');
  const [temDoenca, setTemDoenca] = useState(false);
  const [detalheDoenca, setDetalheDoenca] = useState('');
  const [isGestante, setIsGestante] = useState(false);
  const [primeiraTattoo, setPrimeiraTattoo] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(true);

  // Etapa 4: Mercado Pago PIX
  const [cobrancaPix, setCobrancaPix] = useState<{
    qrCodePayload: string;
    qrCodeBase64?: string;
    paymentId: string;
    valor: number;
  } | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const [protocoloReserva, setProtocoloReserva] = useState('');

  if (!artista) return null;

  const valorSinalCalculado = Math.round(artista.precoInicial * 0.3) || 120;

  const avancarEtapa = () => {
    if (etapa === 1) setEtapa(2);
    else if (etapa === 2) setEtapa(3);
    else if (etapa === 3) {
      gerarCobrancaMercadoPago();
    }
  };

  const voltarEtapa = () => {
    if (etapa > 1 && etapa < 5) {
      setEtapa((prev) => (prev - 1) as any);
    } else {
      onClose();
    }
  };

  const gerarCobrancaMercadoPago = async () => {
    setCarregando(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const dataHorarioCombinada = new Date(dataSelecionada);
      const [hh, mm] = horarioSelecionado.split(':');
      dataHorarioCombinada.setHours(Number(hh), Number(mm), 0, 0);

      // 1. Cria o agendamento no Supabase
      const { data: agendamentoCriado, error: errAgendamento } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: session.user.id,
          artista_id: artista.id,
          data_horario: dataHorarioCombinada.toISOString(),
          estilo: artista.estilo,
          descricao: descricaoArte || `Tatuagem ${artista.estilo} (${localCorpo}, ${tamanhoCm})`,
          local_corpo: localCorpo,
          tamanho_cm: tamanhoCm,
          valor_sinal: valorSinalCalculado,
          valor_total: artista.precoInicial,
          status: 'pendente',
          sinal_pago: false,
        })
        .select('id')
        .single();

      if (errAgendamento || !agendamentoCriado) {
        throw new Error('Falha ao criar agendamento');
      }

      // 2. Cria ficha de anamnese vinculada
      await supabase.from('fichas_anamnese').insert({
        cliente_id: session.user.id,
        artista_id: artista.id,
        alergias: temAlergia ? detalheAlergia || 'Possui alergia informada' : 'Nenhuma',
        doencas_cronicas: temDoenca ? detalheDoenca || 'Possui condição relatada' : 'Nenhuma',
        medicamentos: 'Não informado',
        observacoes: `Primeira tattoo: ${primeiraTattoo ? 'Sim' : 'Não'}. Gestante: ${
          isGestante ? 'Sim' : 'Não'
        }`,
        assinado: true,
      });

      // 3. Gera cobrança de sinal no Mercado Pago
      const cobranca = await criarCobrancaSinal({
        agendamentoId: agendamentoCriado.id,
        artistaId: artista.id,
        clienteId: session.user.id,
        valorSinal: valorSinalCalculado,
        artistaNome: artista.nomeArtista,
        cidade: artista.cidade,
        descricao: `Sinal Reserva #${agendamentoCriado.id.slice(0, 8)} - ${artista.nomeArtista}`,
      });

      setCobrancaPix(cobranca);
      setProtocoloReserva(agendamentoCriado.id.substring(0, 8).toUpperCase());
      setEtapa(4);
    } catch (err) {
      console.warn('Erro ao gerar cobrança MP:', err);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarPagamentoSinal = async () => {
    setCarregando(true);
    try {
      // Simula confirmação com delay realista e atualiza Supabase
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setPagamentoAprovado(true);
      setEtapa(5);
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  const copiarChavePix = () => {
    if (!cobrancaPix?.qrCodePayload) return;
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2500);
  };

  const diasDoMes = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={voltarEtapa}>
              <ChevronLeft size={20} color="#fff" />
            </Pressable>

            <View style={styles.progressPills}>
              {[1, 2, 3, 4, 5].map((p) => (
                <View
                  key={p}
                  style={[
                    styles.pill,
                    etapa === p ? styles.pillActive : etapa > p ? styles.pillDone : styles.pillIdle,
                  ]}
                />
              ))}
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#888" />
            </Pressable>
          </View>

          {/* Conteúdo dinâmico por Etapa */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ETAPA 1: Data e Horário */}
            {etapa === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Escolha a Data & Horário</Text>
                  <Text style={styles.stepSub}>Disponibilidade com {artista.nomeArtista}</Text>
                </View>

                {/* Seleção de Dias (Carrossel Horizontal) */}
                <Text style={styles.sectionLabel}>Datas Disponíveis Próximas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
                  {diasDoMes.map((d, index) => {
                    const isSelected =
                      d.getDate() === dataSelecionada.getDate() && d.getMonth() === dataSelecionada.getMonth();
                    const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                    return (
                      <Pressable
                        key={index}
                        onPress={() => setDataSelecionada(d)}
                        style={[styles.dayCard, isSelected ? styles.dayCardActive : styles.dayCardIdle]}
                      >
                        <Text style={[styles.dayWeekText, isSelected && styles.dayTextActive]}>
                          {diaSemana.toUpperCase()}
                        </Text>
                        <Text style={[styles.dayNumText, isSelected && styles.dayTextActive]}>
                          {d.getDate()}
                        </Text>
                        <Text style={[styles.dayMonthText, isSelected && styles.dayTextActive]}>
                          {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Seleção de Horários */}
                <Text style={styles.sectionLabel}>Horários de Início</Text>
                <View style={styles.timesGrid}>
                  {HORARIOS_DISPONIVEIS.map((hora) => {
                    const isSelected = horarioSelecionado === hora;
                    return (
                      <Pressable
                        key={hora}
                        onPress={() => setHorarioSelecionado(hora)}
                        style={[styles.timeSlot, isSelected ? styles.timeSlotActive : styles.timeSlotIdle]}
                      >
                        <Clock size={12} color={isSelected ? '#111' : '#f3c21a'} />
                        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextActive]}>
                          {hora}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.infoSummaryBox}>
                  <Text style={styles.infoSummaryText}>
                    Data Selecionada: {dataSelecionada.toLocaleDateString('pt-BR')} às {horarioSelecionado}
                  </Text>
                </View>
              </View>
            )}

            {/* ETAPA 2: Briefing da Arte */}
            {etapa === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Briefing da Tatuagem</Text>
                  <Text style={styles.stepSub}>Compartilhe sua ideia com o artista</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descrição da Ideia / Conceito</Text>
                  <TextInput
                    value={descricaoArte}
                    onChangeText={setDescricaoArte}
                    placeholder="Ex: Ramo floral de peônias com traços finos no antebraço, estilo autoral."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                </View>

                <Text style={styles.sectionLabel}>Local do Corpo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagWrap}>
                  {LOCAIS_CORPO.map((loc) => {
                    const isSel = localCorpo === loc;
                    return (
                      <Pressable
                        key={loc}
                        onPress={() => setLocalCorpo(loc)}
                        style={[styles.tagPill, isSel ? styles.tagPillActive : styles.tagPillIdle]}
                      >
                        <Text style={[styles.tagPillText, isSel && styles.tagPillTextActive]}>{loc}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.sectionLabel}>Tamanho Aproximado</Text>
                <View style={styles.sizeOptions}>
                  {TAMANHOS.map((tam) => {
                    const isSel = tamanhoCm === tam;
                    return (
                      <Pressable
                        key={tam}
                        onPress={() => setTamanhoCm(tam)}
                        style={[styles.sizeOption, isSel ? styles.sizeOptionActive : styles.sizeOptionIdle]}
                      >
                        <Text style={[styles.sizeOptionText, isSel && styles.sizeOptionTextActive]}>
                          {tam}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ETAPA 3: Anamnese Digital */}
            {etapa === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Ficha de Anamnese & Saúde</Text>
                  <Text style={styles.stepSub}>Protocolo obrigatório de biossegurança</Text>
                </View>

                <View style={styles.anamneseList}>
                  {/* Item Alergia */}
                  <View style={styles.anamneseItem}>
                    <View style={styles.anamneseTextCol}>
                      <Text style={styles.anamneseQuestion}>Possui alergia a pigmentos, látex ou pomadas?</Text>
                    </View>
                    <Pressable
                      style={[styles.toggleBtn, temAlergia && styles.toggleBtnOn]}
                      onPress={() => setTemAlergia(!temAlergia)}
                    >
                      <View style={[styles.toggleCircle, temAlergia && styles.toggleCircleOn]} />
                    </Pressable>
                  </View>
                  {temAlergia && (
                    <TextInput
                      value={detalheAlergia}
                      onChangeText={setDetalheAlergia}
                      placeholder="Especifique suas alergias..."
                      placeholderTextColor="#666"
                      style={styles.detailInput}
                    />
                  )}

                  {/* Item Doença */}
                  <View style={styles.anamneseItem}>
                    <View style={styles.anamneseTextCol}>
                      <Text style={styles.anamneseQuestion}>Possui diabetes, hemofilia ou hipertensão?</Text>
                    </View>
                    <Pressable
                      style={[styles.toggleBtn, temDoenca && styles.toggleBtnOn]}
                      onPress={() => setTemDoenca(!temDoenca)}
                    >
                      <View style={[styles.toggleCircle, temDoenca && styles.toggleCircleOn]} />
                    </Pressable>
                  </View>
                  {temDoenca && (
                    <TextInput
                      value={detalheDoenca}
                      onChangeText={setDetalheDoenca}
                      placeholder="Detalhes médicos relevantes..."
                      placeholderTextColor="#666"
                      style={styles.detailInput}
                    />
                  )}

                  {/* Gestante */}
                  <View style={styles.anamneseItem}>
                    <View style={styles.anamneseTextCol}>
                      <Text style={styles.anamneseQuestion}>Está gestante ou em fase de amamentação?</Text>
                    </View>
                    <Pressable
                      style={[styles.toggleBtn, isGestante && styles.toggleBtnOn]}
                      onPress={() => setIsGestante(!isGestante)}
                    >
                      <View style={[styles.toggleCircle, isGestante && styles.toggleCircleOn]} />
                    </Pressable>
                  </View>

                  {/* Primeira Tattoo */}
                  <View style={styles.anamneseItem}>
                    <View style={styles.anamneseTextCol}>
                      <Text style={styles.anamneseQuestion}>É a sua primeira tatuagem?</Text>
                    </View>
                    <Pressable
                      style={[styles.toggleBtn, primeiraTattoo && styles.toggleBtnOn]}
                      onPress={() => setPrimeiraTattoo(!primeiraTattoo)}
                    >
                      <View style={[styles.toggleCircle, primeiraTattoo && styles.toggleCircleOn]} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.alertNotice}>
                  <AlertCircle size={14} color="#f59e0b" />
                  <Text style={styles.alertNoticeText}>
                    Declaro que as informações são verídicas e concordo com as normas de higiene e
                    biossegurança do Dermys.
                  </Text>
                </View>
              </View>
            )}

            {/* ETAPA 4: Checkout Mercado Pago PIX */}
            {etapa === 4 && cobrancaPix && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Reserva de Horário (Sinal)</Text>
                  <Text style={styles.stepSub}>Pagamento em custódia protegida via Mercado Pago</Text>
                </View>

                <View style={styles.mpCard}>
                  <View style={styles.mpHeader}>
                    <View style={styles.mpLogoWrap}>
                      <ShieldCheck size={18} color="#009ee3" />
                      <Text style={styles.mpLogoText}>Mercado Pago PIX</Text>
                    </View>
                    <Text style={styles.mpSinalVal}>R$ {cobrancaPix.valor.toFixed(2)}</Text>
                  </View>

                  <View style={styles.qrCodeWrap}>
                    <View style={styles.qrCodeMock}>
                      <QrCode size={110} color="#f3c21a" />
                      <Text style={styles.qrCodeMockText}>QR CODE MERCADO PAGO</Text>
                    </View>
                  </View>

                  <Pressable style={styles.copyPixButton} onPress={copiarChavePix}>
                    {pixCopiado ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#111" />}
                    <Text style={[styles.copyPixText, pixCopiado && styles.copyPixTextDone]}>
                      {pixCopiado ? 'Chave Copiada para a Área de Transferência!' : 'Copiar Chave PIX (Copia e Cola)'}
                    </Text>
                  </Pressable>

                  <View style={styles.protectionNotice}>
                    <ShieldCheck size={14} color="#10b981" />
                    <Text style={styles.protectionNoticeText}>
                      O valor fica protegido em custódia no Mercado Pago até o dia do seu atendimento no
                      estúdio.
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.btnSimularConfirmacao}
                  onPress={confirmarPagamentoSinal}
                  disabled={carregando}
                >
                  {carregando ? (
                    <ActivityIndicator color="#111" size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#111" />
                      <Text style={styles.btnSimularConfirmacaoText}>Confirmar Pagamento do Sinal</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* ETAPA 5: Confirmação & Protocolo */}
            {etapa === 5 && (
              <View style={[styles.stepContainer, { alignItems: 'center', paddingVertical: 20 }]}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={48} color="#f3c21a" />
                </View>

                <Text style={styles.successTitle}>Agendamento Solicitado!</Text>
                <Text style={styles.successSub}>
                  O artista {artista.nomeArtista} recebeu sua solicitação e o sinal de R${' '}
                  {valorSinalCalculado} foi reservado em custódia.
                </Text>

                <View style={styles.protocolCard}>
                  <Text style={styles.protocolLabel}>Protocolo de Reserva:</Text>
                  <Text style={styles.protocolCode}>DERM-RES-{protocoloReserva}</Text>
                  <View style={styles.protocolDivider} />
                  <Text style={styles.protocolDate}>
                    Data: {dataSelecionada.toLocaleDateString('pt-BR')} às {horarioSelecionado}
                  </Text>
                  <Text style={styles.protocolStudio}>{artista.nomeEstudio} • {artista.cidade}</Text>
                </View>

                <Pressable
                  style={styles.btnFinalSuccess}
                  onPress={() => {
                    onSucesso();
                    onClose();
                  }}
                >
                  <Text style={styles.btnFinalSuccessText}>Ver Meus Agendamentos</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Rodapé de Ação (Etapas 1, 2, 3) */}
          {etapa < 4 && (
            <View style={styles.footer}>
              <Pressable style={styles.btnNext} onPress={avancarEtapa} disabled={carregando}>
                {carregando ? (
                  <ActivityIndicator color="#111" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnNextText}>
                      {etapa === 3 ? `Pagar Sinal (R$ ${valorSinalCalculado})` : 'Continuar'}
                    </Text>
                    <ChevronRight size={18} color="#111" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 24,
    backgroundColor: '#f3c21a',
  },
  pillDone: {
    width: 14,
    backgroundColor: '#10b981',
  },
  pillIdle: {
    width: 10,
    backgroundColor: '#262626',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stepContainer: {
    gap: 14,
  },
  stepHeader: {
    gap: 2,
    marginBottom: 4,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepSub: {
    color: '#9ca3af',
    fontSize: 12,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  daysRow: {
    gap: 8,
    paddingVertical: 4,
  },
  dayCard: {
    width: 66,
    height: 78,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  dayCardIdle: {
    backgroundColor: '#131313',
    borderColor: '#242424',
  },
  dayWeekText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6b7280',
  },
  dayNumText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  dayMonthText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6b7280',
  },
  dayTextActive: {
    color: '#111',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '31%',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  timeSlotActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  timeSlotIdle: {
    backgroundColor: '#131313',
    borderColor: '#242424',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  timeSlotTextActive: {
    color: '#111',
  },
  infoSummaryBox: {
    backgroundColor: '#141414',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  infoSummaryText: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textArea: {
    minHeight: 80,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 13,
    textAlignVertical: 'top',
  },
  tagWrap: {
    gap: 6,
    paddingVertical: 2,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagPillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  tagPillIdle: {
    backgroundColor: '#141414',
    borderColor: '#242424',
  },
  tagPillText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '800',
  },
  tagPillTextActive: {
    color: '#111',
  },
  sizeOptions: {
    gap: 6,
  },
  sizeOption: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  sizeOptionActive: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderColor: '#f3c21a',
  },
  sizeOptionIdle: {
    backgroundColor: '#141414',
    borderColor: '#242424',
  },
  sizeOptionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
  sizeOptionTextActive: {
    color: '#f3c21a',
    fontWeight: '900',
  },
  anamneseList: {
    gap: 8,
  },
  anamneseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
  },
  anamneseTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  anamneseQuestion: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#262626',
    padding: 2,
    justifyContent: 'center',
  },
  toggleBtnOn: {
    backgroundColor: '#f3c21a',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#666',
  },
  toggleCircleOn: {
    backgroundColor: '#111',
    alignSelf: 'flex-end',
  },
  detailInput: {
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#2e2e2e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
  },
  alertNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  alertNoticeText: {
    color: '#f59e0b',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  mpCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282828',
    padding: 16,
    gap: 12,
  },
  mpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
  },
  mpLogoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mpLogoText: {
    color: '#009ee3',
    fontSize: 13,
    fontWeight: '900',
  },
  mpSinalVal: {
    color: '#f3c21a',
    fontSize: 18,
    fontWeight: '900',
  },
  qrCodeWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrCodeMock: {
    width: 180,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  qrCodeMockText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  copyPixButton: {
    minHeight: 46,
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyPixText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  copyPixTextDone: {
    color: '#065f46',
  },
  protectionNotice: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  protectionNoticeText: {
    color: '#10b981',
    fontSize: 10,
    flex: 1,
    fontWeight: '600',
  },
  btnSimularConfirmacao: {
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnSimularConfirmacaoText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  successSub: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  protocolCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 16,
    width: '100%',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
  },
  protocolLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  protocolCode: {
    color: '#f3c21a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  protocolDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#222',
    marginVertical: 6,
  },
  protocolDate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  protocolStudio: {
    color: '#888',
    fontSize: 11,
  },
  btnFinalSuccess: {
    height: 48,
    backgroundColor: '#f3c21a',
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  btnFinalSuccessText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btnNext: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnNextText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
