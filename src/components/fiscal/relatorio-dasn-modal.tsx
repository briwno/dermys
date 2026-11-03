import { ds } from '@/theme/design-system';
import { FiscalService } from '@/services/fiscal/fiscal-service';
import type { RelatorioDASN } from '@/types/fiscal';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  HelpCircle,
  ShieldCheck,
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
import { AppModal } from '@/components/ui/app-modal';
import { createThemedStyles, tc } from '@/theme';

interface PropsRelatorioDasnModal {
  visivel: boolean;
  artistaId: string;
  onClose: () => void;
}

export function RelatorioDasnModal({
  visivel,
  artistaId,
  onClose,
}: PropsRelatorioDasnModal) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [relatorio, setRelatorio] = useState<RelatorioDASN | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (visivel && artistaId) {
      carregarRelatorio(ano);
    }
  }, [visivel, artistaId, ano]);

  const carregarRelatorio = async (anoRef: number) => {
    setCarregando(true);
    try {
      const data = await FiscalService.gerarRelatorioDASN(artistaId, anoRef);
      setRelatorio(data);
    } catch (err) {
      console.warn('Erro ao gerar relatório DASN:', err);
    } finally {
      setCarregando(false);
    }
  };

  const copiarRelatorioTexto = () => {
    if (!relatorio) return;
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <FileSpreadsheet size={20} color={tc(ds.cores.destaque)} />
              </View>
              <View>
                <Text style={styles.title}>Relatório DASN-SIMEI</Text>
                <Text style={styles.sub}>Declaração Anual de Faturamento MEI</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={tc(ds.cores.textoSuave)} />
            </Pressable>
          </View>

          {/* Seletor de Ano */}
          <View style={styles.yearSelector}>
            <Pressable style={styles.yearNavBtn} onPress={() => setAno((a) => a - 1)}>
              <ChevronLeft size={18} color={tc(ds.cores.destaque)} />
            </Pressable>
            <Text style={styles.yearTitle}>Ano-Calendário {ano}</Text>
            <Pressable
              style={styles.yearNavBtn}
              onPress={() => setAno((a) => a + 1)}
              disabled={ano >= new Date().getFullYear()}
            >
              <ChevronRight
                size={18}
                color={ano >= new Date().getFullYear() ? tc('#444') : tc(ds.cores.destaque)}
              />
            </Pressable>
          </View>

          {/* Conteúdo */}
          {carregando ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={tc(ds.cores.destaque)} size="large" />
              <Text style={styles.loadingText}>Consolidando dados fiscais de {ano}...</Text>
            </View>
          ) : !relatorio ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>Nenhum dado fiscal registrado para {ano}.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Card Resumo Oficial da Declaração */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <ShieldCheck size={16} color={tc('#10b981')} />
                  <Text style={styles.summaryTitle}>Resumo para preenchimento da DASN</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Razão Social / CNPJ:</Text>
                  <Text style={styles.summaryVal}>
                    {relatorio.razaoSocial} • {relatorio.cnpj}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Receita Bruta Total de Prestação de Serviços:
                  </Text>
                  <Text style={styles.summaryValHighlight}>
                    R$ {relatorio.faturamentoTotalAno.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Utilização do Limite Anual (R$ 81.000):</Text>
                  <Text
                    style={[
                      styles.summaryValBold,
                      { color: relatorio.percentualUtilizado > 85 ? tc('#ef4444') : tc('#10b981') },
                    ]}
                  >
                    {relatorio.percentualUtilizado}% do teto utilizado
                  </Text>
                </View>
              </View>

              {/* Tabela Mensal */}
              <View style={styles.tableCard}>
                <Text style={styles.tableTitle}>Discriminação Mensal de Receitas</Text>

                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { flex: 1.2 }]}>Mês</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Nº Notas</Text>
                  <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Receita Bruta</Text>
                </View>

                {relatorio.meses.map((m) => (
                  <View key={m.mesNumero} style={styles.tableRow}>
                    <Text style={[styles.tdMonth, { flex: 1.2 }]}>{m.mesNome}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>
                      {m.totalNotas > 0 ? `${m.totalNotas} notas` : '-'}
                    </Text>
                    <Text
                      style={[
                        styles.tdValue,
                        { flex: 1.4, textAlign: 'right' },
                        m.receitaBrutaServicos > 0 && styles.tdValuePositive,
                      ]}
                    >
                      R$ {m.receitaBrutaServicos.toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.tableTotalRow}>
                  <Text style={[styles.totalLabel, { flex: 1.2 }]}>Total Anual</Text>
                  <Text style={[styles.totalNotas, { flex: 1, textAlign: 'right' }]}>
                    {relatorio.meses.reduce((a, b) => a + b.totalNotas, 0)} notas
                  </Text>
                  <Text style={[styles.totalVal, { flex: 1.4, textAlign: 'right' }]}>
                    R$ {relatorio.faturamentoTotalAno.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Dica da Declaração */}
              <View style={styles.tipBox}>
                <HelpCircle size={14} color={tc(ds.cores.destaque)} />
                <Text style={styles.tipText}>
                  Na declaração anual da Receita Federal (Portal do Empreendedor / Simples Nacional),
                  insira o campo "Receita Bruta de Prestação de Serviços" com o valor total acima.
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Rodapé */}
          <View style={styles.footer}>
            <Pressable style={styles.copyBtn} onPress={copiarRelatorioTexto}>
              {copiado ? <Check size={16} color={tc('#10b981')} /> : <Copy size={16} color={tc(ds.cores.texto)} />}
              <Text style={[styles.copyBtnText, copiado && { color: tc('#10b981') }]}>
                {copiado ? 'Dados Copiados!' : 'Copiar Resumo da Declaração'}
              </Text>
            </Pressable>

            <Pressable style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionBtnText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

const styles = createThemedStyles({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    backgroundColor: ds.cores.fundo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: ds.cores.borda,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    minWidth: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
  },
  sub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  closeBtn: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 16,
    backgroundColor: ds.cores.elevada,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161616',
  },
  yearNavBtn: {
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 8,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  yearTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 23,
    flexShrink: 1,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  summaryTitle: {
    color: '#10b981',
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    textTransform: 'none',
    lineHeight: 23,
    flexShrink: 1,
  },
  summaryRow: {
    gap: 2,
  },
  summaryLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  summaryVal: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  summaryValHighlight: {
    color: ds.cores.destaque,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
  },
  summaryValBold: {
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  tableCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 8,
  },
  tableTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 23,
    flexShrink: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ds.cores.borda,
    paddingBottom: 6,
  },
  th: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    textTransform: 'uppercase',
    lineHeight: 20,
    flexShrink: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
    alignItems: 'center',
  },
  tdMonth: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  td: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  tdValue: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  tdValuePositive: {
    color: ds.cores.texto,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ds.cores.borda,
    alignItems: 'center',
  },
  totalLabel: {
    color: ds.cores.texto,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  totalNotas: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  totalVal: {
    color: ds.cores.destaque,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.25)',
    borderRadius: 10,
    padding: 10,
  },
  tipText: {
    flex: 1,
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  copyBtn: {
    flex: 1.3,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyBtnText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  closeActionBtn: {
    flex: 0.7,
    minHeight: ds.alvo.compacto,
    borderRadius: 12,
    backgroundColor: ds.cores.destaque,
    justifyContent: 'center',
    alignItems: 'center',
    width: ds.alvo.compacto,
  },
  closeActionBtnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
});
