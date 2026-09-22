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
                <FileSpreadsheet size={20} color="#f3c21a" />
              </View>
              <View>
                <Text style={styles.title}>Relatório DASN-SIMEI</Text>
                <Text style={styles.sub}>Declaração Anual de Faturamento MEI</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Seletor de Ano */}
          <View style={styles.yearSelector}>
            <Pressable style={styles.yearNavBtn} onPress={() => setAno((a) => a - 1)}>
              <ChevronLeft size={18} color="#f3c21a" />
            </Pressable>
            <Text style={styles.yearTitle}>Ano-Calendário {ano}</Text>
            <Pressable
              style={styles.yearNavBtn}
              onPress={() => setAno((a) => a + 1)}
              disabled={ano >= new Date().getFullYear()}
            >
              <ChevronRight
                size={18}
                color={ano >= new Date().getFullYear() ? '#444' : '#f3c21a'}
              />
            </Pressable>
          </View>

          {/* Conteúdo */}
          {carregando ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#f3c21a" size="large" />
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
                  <ShieldCheck size={16} color="#10b981" />
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
                      { color: relatorio.percentualUtilizado > 85 ? '#ef4444' : '#10b981' },
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
                <HelpCircle size={14} color="#f3c21a" />
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
              {copiado ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#fff" />}
              <Text style={[styles.copyBtnText, copiado && { color: '#10b981' }]}>
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
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
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  sub: {
    color: '#888',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearTitle: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 14,
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryRow: {
    gap: 2,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryVal: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValHighlight: {
    color: '#f3c21a',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryValBold: {
    fontSize: 12,
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 14,
    gap: 8,
  },
  tableTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
  },
  th: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
    alignItems: 'center',
  },
  tdMonth: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '700',
  },
  td: {
    color: '#666',
    fontSize: 11,
  },
  tdValue: {
    color: '#666',
    fontSize: 11,
    fontWeight: '700',
  },
  tdValuePositive: {
    color: '#fff',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  totalNotas: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
  },
  totalVal: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
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
    color: '#d1d5db',
    fontSize: 10,
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  copyBtn: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  closeActionBtn: {
    flex: 0.7,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeActionBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
