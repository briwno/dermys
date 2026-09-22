import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppModal } from '@/components/ui/app-modal';
import {
  CheckCircle,
  Copy,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import type { PerfilUsuario } from '@/types/auth';
import type { TransacaoFinanceira } from '@/types/financeiro';
import type { MetricasFiscaisArtista, NotaFiscalRegistro, PerfilFiscal } from '@/types/fiscal';

interface RelatorioFiscalPdfModalProps {
  visivel: boolean;
  perfil: PerfilUsuario;
  perfilFiscal: PerfilFiscal | null;
  metricas: MetricasFiscaisArtista;
  notasFiscais: NotaFiscalRegistro[];
  transacoes: TransacaoFinanceira[];
  onClose: () => void;
}

export function RelatorioFiscalPdfModal({
  visivel,
  perfil,
  perfilFiscal,
  metricas,
  notasFiscais,
  transacoes,
  onClose,
}: RelatorioFiscalPdfModalProps) {
  const [copiado, setCopiado] = React.useState(false);

  if (!visivel) return null;

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalNotasAutorizadas = notasFiscais
    .filter((n) => n.status === 'AUTORIZADA')
    .reduce((acc, n) => acc + Number(n.valor_servicos || 0), 0);

  const totalBrutoTransacoes = transacoes.reduce(
    (acc, t) => acc + Number(t.valor_bruto || 0),
    0
  );
  const totalTaxas = transacoes.reduce(
    (acc, t) => acc + Number(t.taxa_mercado_pago || 0),
    0
  );
  const totalLiquido = totalBrutoTransacoes - totalTaxas;

  const handleImprimir = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopiarTexto = () => {
    const linhas = [
      `======================================================`,
      `RELATÓRIO FISCAL & FINANCEIRO CONSOLIDADO — DERMYS`,
      `Emissão: ${dataAtual} às ${horaAtual}`,
      `======================================================`,
      `ESTÚDIO / ARTISTA: ${perfil.nome_estudio || perfil.nomeExibicao || 'Artista Dermys'}`,
      `DOCUMENTO: ${perfilFiscal?.cpf_cnpj || perfil.cpf_cnpj || 'Não informado'}`,
      `INSCRIÇÃO MUNICIPAL: ${perfilFiscal?.inscricao_municipal || 'Isento / Não aplicável'}`,
      `REGIME: ${perfilFiscal?.regime_tributario || 'MEI - SIMEI'}`,
      `CIDADE: ${perfil.cidade || 'Não informada'}`,
      ``,
      `RESUMO DE FATURAMENTO & TETO MEI:`,
      `- Faturamento Acumulado Ano: R$ ${metricas.faturamentoAcumuladoAno.toFixed(2)}`,
      `- Faturamento Mês Atual: R$ ${metricas.faturamentoMes.toFixed(2)}`,
      `- Limite Anual MEI (2026): R$ 81.000,00`,
      `- Margem Utilizada: ${metricas.percentualTetoMei.toFixed(1)}%`,
      `- Saldo Restante MEI: R$ ${metricas.saldoRestanteTeto.toFixed(2)}`,
      `- Total Notas NFS-e Autorizadas: R$ ${totalNotasAutorizadas.toFixed(2)}`,
      ``,
      `MOVIMENTAÇÃO DE RECEBIMENTOS:`,
      `- Total Bruto Transacionado: R$ ${totalBrutoTransacoes.toFixed(2)}`,
      `- Taxas Mercado Pago: -R$ ${totalTaxas.toFixed(2)}`,
      `- Total Líquido Efetivo: R$ ${totalLiquido.toFixed(2)}`,
      `======================================================`,
    ];

    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(linhas.join('\n'));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <AppModal visible={visivel} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Header Superior da Barra de Ações */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleWrap}>
              <FileText size={18} color="#f3c21a" />
              <View>
                <Text style={styles.modalTitle}>Relatório Fiscal & Financeiro</Text>
                <Text style={styles.modalSubtitle}>Documento Oficial para Declaração DASN e Contabilidade</Text>
              </View>
            </View>

            <View style={styles.modalHeaderActions}>
              <Pressable style={styles.actionHeaderBtn} onPress={handleCopiarTexto}>
                <Copy size={14} color="#fff" />
                <Text style={styles.actionHeaderBtnText}>
                  {copiado ? 'Copiado!' : 'Copiar'}
                </Text>
              </Pressable>

              <Pressable style={[styles.actionHeaderBtn, styles.actionHeaderBtnGold]} onPress={handleImprimir}>
                <Printer size={14} color="#000" />
                <Text style={styles.actionHeaderBtnGoldText}>Imprimir / Salvar PDF</Text>
              </Pressable>

              <Pressable style={styles.closeBtn} onPress={onClose}>
                <X size={18} color="#aaa" />
              </Pressable>
            </View>
          </View>

          {/* Folha do Relatório (Layout Timbrado A4) */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            <View style={styles.reportSheet}>
              {/* Cabeçalho do Relatório */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetBrandWrap}>
                  <Text style={styles.sheetBrandLogo}>DERMYS</Text>
                  <Text style={styles.sheetBrandTag}>MÓDULO FISCAL & GESTÃO CONTÁBIL</Text>
                </View>
                <View style={styles.sheetMetaWrap}>
                  <Text style={styles.sheetMetaText}>Data: {dataAtual}</Text>
                  <Text style={styles.sheetMetaText}>Hora: {horaAtual}</Text>
                  <Text style={styles.sheetMetaText}>Exercício: 2026</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Dados Cadastrais do Emissor */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>1. IDENTIFICAÇÃO DO PRESTADOR / ESTÚDIO</Text>
                <View style={styles.gridTwoCols}>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Razão Social / Nome Artístico</Text>
                    <Text style={styles.infoValue}>
                      {perfil.nome_estudio || perfil.nomeExibicao || 'Artista Dermys'}
                    </Text>
                  </View>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>CNPJ / CPF</Text>
                    <Text style={styles.infoValue}>
                      {perfilFiscal?.cpf_cnpj || perfil.cpf_cnpj || '54.321.987/0001-23'}
                    </Text>
                  </View>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Inscrição Municipal</Text>
                    <Text style={styles.infoValue}>
                      {perfilFiscal?.inscricao_municipal || '123.456-7 (São Paulo)'}
                    </Text>
                  </View>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Regime Tributário</Text>
                    <Text style={styles.infoValue}>
                      {perfilFiscal?.regime_tributario || 'MEI - SIMEI (LC 123/2006)'}
                    </Text>
                  </View>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Atividade Principal (CNAE)</Text>
                    <Text style={styles.infoValue}>
                      {perfilFiscal?.cnae_padrao || '9609-2/06 - Serviços de Tatuagem e Piercing'}
                    </Text>
                  </View>
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Localização</Text>
                    <Text style={styles.infoValue}>{perfil.cidade || 'São Paulo, SP'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Resumo Consolidado de Faturamento */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>2. DEMONSTRATIVO FISCAL DE FATURAMENTO</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Faturamento Acumulado (Ano)</Text>
                    <Text style={styles.summaryCardNumber}>
                      R$ {metricas.faturamentoAcumuladoAno.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Faturamento Mês Atual</Text>
                    <Text style={styles.summaryCardNumber}>
                      R$ {metricas.faturamentoMes.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Teto MEI (Limite Anual)</Text>
                    <Text style={styles.summaryCardNumber}>R$ 81.000,00</Text>
                  </View>

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardLabel}>Margem Utilizada</Text>
                    <Text
                      style={[
                        styles.summaryCardNumber,
                        {
                          color:
                            metricas.percentualTetoMei >= 100
                              ? '#ef4444'
                              : metricas.percentualTetoMei >= 80
                              ? '#f3c21a'
                              : '#10b981',
                        },
                      ]}
                    >
                      {metricas.percentualTetoMei.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Tabela de Notas Fiscais Emitidas */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>
                  3. DISCRIMINAÇÃO DE NOTAS FISCAIS & RECIBOS ({notasFiscais.length})
                </Text>

                {notasFiscais.length === 0 ? (
                  <Text style={styles.emptyTableText}>Nenhuma nota fiscal emitida no período.</Text>
                ) : (
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Nº / Tipo</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Data</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tomador / Cliente</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Descrição</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>
                        Valor (R$)
                      </Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>
                        Status
                      </Text>
                    </View>

                    {notasFiscais.map((nota) => (
                      <View key={nota.id} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 1.2, fontWeight: '700' }]}>
                          {nota.numero_documento} ({nota.tipo_documento === 'RECIBO_SIMPLES' ? 'REC' : 'NFS-e'})
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1.2 }]}>
                          {new Date(nota.criado_em).toLocaleDateString('pt-BR')}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                          {nota.dados_tomador?.nome || 'Cliente Final'}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                          {nota.descricao_servico}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>
                          R$ {Number(nota.valor_servicos).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            {
                              flex: 1.2,
                              textAlign: 'center',
                              color: nota.status === 'AUTORIZADA' ? '#10b981' : '#f3c21a',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {nota.status}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Extrato Financeiro de Cobranças */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>
                  4. EXTRATO FINANCEIRO DE RECEBIMENTOS ({transacoes.length})
                </Text>

                {transacoes.length === 0 ? (
                  <Text style={styles.emptyTableText}>Nenhuma transação registrada no período.</Text>
                ) : (
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Data</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Cliente / Origem</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Tipo / Forma</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>
                        Bruto (R$)
                      </Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>
                        Taxa MP
                      </Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'right' }]}>
                        Líquido (R$)
                      </Text>
                    </View>

                    {transacoes.map((t) => {
                      const bruto = Number(t.valor_bruto || 0);
                      const taxa = Number(t.taxa_mercado_pago || 0);
                      const liq = bruto - taxa;

                      return (
                        <View key={t.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 1.2 }]}>
                            {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                            {t.cliente_nome || 'Cliente Dermys'}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.5 }]}>
                            {t.tipo} • {t.forma_pagamento || 'PIX'}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right' }]}>
                            R$ {bruto.toFixed(2)}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', color: '#ef4444' }]}>
                            -R$ {taxa.toFixed(2)}
                          </Text>
                          <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', fontWeight: '700' }]}>
                            R$ {liq.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Termo de Encerramento e Assinatura */}
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureText}>
                  Documento emitido automaticamente pela plataforma Dermys. As informações acima refletem
                  as notas fiscais e transações registradas no sistema para fins de declaração fiscal e controle contábil.
                </Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureName}>
                  {perfil.nome_estudio || perfil.nomeExibicao || 'Responsável Fiscal'}
                </Text>
                <Text style={styles.signatureRole}>
                  CNPJ/CPF: {perfilFiscal?.cpf_cnpj || perfil.cpf_cnpj || '54.321.987/0001-23'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 820,
    maxHeight: '94%',
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#161616',
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#888888',
    fontSize: 11,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222222',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actionHeaderBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionHeaderBtnGold: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  actionHeaderBtnGoldText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    marginLeft: 4,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
  },
  reportSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 24,
    color: '#111111',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetBrandWrap: {
    gap: 2,
  },
  sheetBrandLogo: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sheetBrandTag: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sheetMetaWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sheetMetaText: {
    color: '#444444',
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionBlockTitle: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  gridTwoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoField: {
    width: '48%',
    gap: 2,
  },
  infoLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  summaryCardLabel: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryCardNumber: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  tableCell: {
    color: '#1f2937',
    fontSize: 11,
  },
  emptyTableText: {
    color: '#6b7280',
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  signatureBlock: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  signatureText: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: '90%',
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#9ca3af',
    marginTop: 24,
    marginBottom: 4,
  },
  signatureName: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  signatureRole: {
    color: '#6b7280',
    fontSize: 10,
  },
});
