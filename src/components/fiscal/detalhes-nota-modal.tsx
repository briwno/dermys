import { FiscalService } from '@/services/fiscal/fiscal-service';
import type { NotaFiscalRegistro } from '@/types/fiscal';
import {
  AlertCircle,
  Ban,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileCode,
  FileText,
  Percent,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppModal } from '@/components/ui/app-modal';

interface PropsDetalhesNotaModal {
  visivel: boolean;
  nota: NotaFiscalRegistro | null;
  onNotaAtualizada?: (nota: NotaFiscalRegistro) => void;
  onClose: () => void;
}

export function DetalhesNotaModal({
  visivel,
  nota,
  onNotaAtualizada,
  onClose,
}: PropsDetalhesNotaModal) {
  const [copiado, setCopiado] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [exibirFormCancelamento, setExibirFormCancelamento] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState(
    'Cancelamento solicitado pelo prestador / alteração de valores'
  );

  if (!nota) return null;

  const isAutorizada = nota.status === 'AUTORIZADA';
  const isProcessando = nota.status === 'PROCESSANDO';
  const isRejeitada = nota.status === 'REJEITADA';
  const isCancelada = nota.status === 'CANCELADA';

  const copiarCodigo = () => {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const abrirWhatsApp = () => {
    const url = FiscalService.gerarLinkCompartilhamentoWhatsApp(nota);
    Linking.openURL(url).catch(() => {});
  };

  const abrirPdf = () => {
    if (nota.url_pdf) {
      Linking.openURL(nota.url_pdf).catch(() => {});
    }
  };

  const abrirXml = () => {
    if (nota.url_xml) {
      Linking.openURL(nota.url_xml).catch(() => {});
    }
  };

  const handleCancelar = async () => {
    setCancelando(true);
    try {
      const ok = await FiscalService.cancelarNotaFiscal(nota.id, motivoCancelamento);
      if (ok) {
        onNotaAtualizada?.({
          ...nota,
          status: 'CANCELADA',
          cancelada_em: new Date().toISOString(),
          mensagem_erro: `Cancelada: ${motivoCancelamento}`,
        });
        setExibirFormCancelamento(false);
      }
    } catch (err) {
      console.warn('Erro ao cancelar nota:', err);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <FileCheck2 size={20} color="#f3c21a" />
              </View>
              <View>
                <Text style={styles.title}>
                  {nota.tipo_documento === 'RECIBO_SIMPLES'
                    ? 'Recibo de Prestação'
                    : 'Nota Fiscal de Serviço (NFS-e)'}
                </Text>
                <Text style={styles.receiptNumber}>Nº {nota.numero_documento}</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Scroll */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Status Banner */}
            <View
              style={[
                styles.statusBanner,
                isAutorizada
                  ? styles.statusBannerAutorizada
                  : isProcessando
                  ? styles.statusBannerProcessando
                  : isRejeitada
                  ? styles.statusBannerRejeitada
                  : styles.statusBannerCancelada,
              ]}
            >
              {isAutorizada ? (
                <ShieldCheck size={18} color="#10b981" />
              ) : isProcessando ? (
                <Clock size={18} color="#f3c21a" />
              ) : isRejeitada ? (
                <AlertCircle size={18} color="#ef4444" />
              ) : (
                <XCircle size={18} color="#9ca3af" />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.statusBannerText,
                    isAutorizada
                      ? styles.textAutorizada
                      : isProcessando
                      ? styles.textProcessando
                      : isRejeitada
                      ? styles.textRejeitada
                      : styles.textCancelada,
                  ]}
                >
                  {isAutorizada
                    ? 'NFS-e Autorizada pela Prefeitura'
                    : isProcessando
                    ? 'Em Processamento / Fila da Prefeitura'
                    : isRejeitada
                    ? 'Emissão Rejeitada'
                    : 'NFS-e Cancelada'}
                </Text>
                {nota.mensagem_erro && (
                  <Text style={styles.statusBannerSub}>{nota.mensagem_erro}</Text>
                )}
              </View>
            </View>

            {/* Dados do Prestador e Tomador */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Prestador dos Serviços</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Razão Social / Artista:</Text>
                <Text style={styles.rowValue}>{nota.dados_prestador?.razaoSocial}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>CNPJ / CPF:</Text>
                <Text style={styles.rowValue}>{nota.dados_prestador?.cpfCnpj}</Text>
              </View>
              {nota.dados_prestador?.inscricaoMunicipal && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Inscrição Municipal:</Text>
                  <Text style={styles.rowValue}>{nota.dados_prestador.inscricaoMunicipal}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>CNAE & Código LC 116:</Text>
                <Text style={styles.rowValue}>
                  {nota.cnae} • {nota.codigo_tributacao_municipio}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Tomador do Serviço (Cliente)</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nome do Cliente:</Text>
                <Text style={styles.rowValue}>{nota.dados_tomador?.nome || 'Cliente'}</Text>
              </View>
              {nota.dados_tomador?.cpfCnpj && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>CPF:</Text>
                  <Text style={styles.rowValue}>{nota.dados_tomador.cpfCnpj}</Text>
                </View>
              )}
              {nota.dados_tomador?.email && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>E-mail:</Text>
                  <Text style={styles.rowValue}>{nota.dados_tomador.email}</Text>
                </View>
              )}
              {nota.dados_tomador?.telefone && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>WhatsApp:</Text>
                  <Text style={styles.rowValue}>{nota.dados_tomador.telefone}</Text>
                </View>
              )}
            </View>

            {/* Valores & Tributação */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Valores e Discriminação</Text>
              <Text style={styles.descServico}>{nota.descricao_servico}</Text>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Valor dos Serviços:</Text>
                <Text style={styles.rowValue}>R$ {nota.valor_servicos?.toFixed(2)}</Text>
              </View>

              {nota.aliquota_iss > 0 && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>ISS ({nota.aliquota_iss}%):</Text>
                  <Text style={styles.rowValue}>R$ {nota.valor_iss?.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.rowTotal}>
                <Text style={styles.totalLabel}>Valor Líquido da Nota:</Text>
                <Text style={styles.totalValue}>R$ {nota.valor_liquido?.toFixed(2)}</Text>
              </View>
            </View>

            {/* Split de Pagamento */}
            {nota.dados_split && (
              <View style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <Percent size={14} color="#f3c21a" />
                  <Text style={styles.splitTitle}>Split de Pagamento (Sem Bitributação)</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Valor Bruto da Arte:</Text>
                  <Text style={styles.rowValue}>
                    R$ {nota.dados_split.valorServicoTotal?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Taxa Intermediação Dermys (10%):</Text>
                  <Text style={[styles.rowValue, { color: '#ef4444' }]}>
                    - R$ {nota.dados_split.valorTaxaPlataforma?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.rowTotal}>
                  <Text style={styles.totalLabel}>Repasse Líquido Artista:</Text>
                  <Text style={[styles.totalValue, { color: '#10b981' }]}>
                    R$ {nota.dados_split.valorLiquidoArtista?.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Autenticação */}
            <View style={styles.authBox}>
              <View style={styles.row}>
                <Text style={styles.authLabel}>Código de Autenticação Digital:</Text>
                <Pressable style={styles.btnCopy} onPress={copiarCodigo}>
                  {copiado ? <Check size={12} color="#10b981" /> : <Copy size={12} color="#f3c21a" />}
                  <Text style={[styles.btnCopyText, copiado && { color: '#10b981' }]}>
                    {copiado ? 'Copiado' : 'Copiar'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.authCode}>{nota.codigo_verificacao}</Text>
            </View>

            {/* Formulário de Cancelamento */}
            {exibirFormCancelamento && (
              <View style={styles.cancelBox}>
                <Text style={styles.cancelBoxTitle}>Confirmar Cancelamento de NFS-e</Text>
                <Text style={styles.cancelBoxSub}>
                  O cancelamento será transmitido para a prefeitura e não poderá ser desfeito.
                </Text>
                <TextInput
                  value={motivoCancelamento}
                  onChangeText={setMotivoCancelamento}
                  placeholder="Justificativa do cancelamento"
                  placeholderTextColor="#666"
                  style={styles.cancelInput}
                />
                <View style={styles.cancelActionsRow}>
                  <Pressable
                    style={styles.btnCancelDismiss}
                    onPress={() => setExibirFormCancelamento(false)}
                  >
                    <Text style={styles.btnCancelDismissText}>Voltar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.btnCancelConfirm}
                    onPress={handleCancelar}
                    disabled={cancelando}
                  >
                    {cancelando ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnCancelConfirmText}>Confirmar Cancelamento</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Rodapé de Ações */}
          <View style={styles.footer}>
            <Pressable style={styles.btnZap} onPress={abrirWhatsApp}>
              <Send size={15} color="#111" />
              <Text style={styles.btnZapText}>WhatsApp</Text>
            </Pressable>

            {nota.url_pdf && (
              <Pressable style={styles.btnAction} onPress={abrirPdf}>
                <Download size={15} color="#f3c21a" />
                <Text style={styles.btnActionText}>PDF</Text>
              </Pressable>
            )}

            {nota.url_xml && (
              <Pressable style={styles.btnAction} onPress={abrirXml}>
                <FileCode size={15} color="#f3c21a" />
                <Text style={styles.btnActionText}>XML</Text>
              </Pressable>
            )}

            {isAutorizada && !exibirFormCancelamento && (
              <Pressable
                style={styles.btnCancelDoc}
                onPress={() => setExibirFormCancelamento(true)}
              >
                <Ban size={15} color="#ef4444" />
                <Text style={styles.btnCancelDocText}>Cancelar</Text>
              </Pressable>
            )}
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
  receiptNumber: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBannerAutorizada: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBannerProcessando: {
    backgroundColor: 'rgba(243, 194, 26, 0.12)',
    borderColor: 'rgba(243, 194, 26, 0.35)',
  },
  statusBannerRejeitada: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusBannerCancelada: {
    backgroundColor: '#161616',
    borderColor: '#262626',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  textAutorizada: { color: '#10b981' },
  textProcessando: { color: '#f3c21a' },
  textRejeitada: { color: '#ef4444' },
  textCancelada: { color: '#888' },
  statusBannerSub: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 14,
    gap: 6,
  },
  cardHeaderTitle: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: '#6b7280',
    fontSize: 11,
  },
  rowValue: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  descServico: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 4,
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  totalValue: {
    color: '#f3c21a',
    fontSize: 15,
    fontWeight: '900',
  },
  splitCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    gap: 6,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  splitTitle: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  authBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 12,
    gap: 6,
  },
  authLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
  },
  authCode: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  btnCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnCopyText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
  },
  cancelBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 12,
    gap: 8,
  },
  cancelBoxTitle: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBoxSub: {
    color: '#aaa',
    fontSize: 10,
  },
  cancelInput: {
    minHeight: 40,
    backgroundColor: '#161616',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 10,
    color: '#fff',
    fontSize: 12,
  },
  cancelActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnCancelDismiss: {
    flex: 0.8,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelDismissText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '800',
  },
  btnCancelConfirm: {
    flex: 1.2,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelConfirmText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  btnZap: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnZapText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  btnAction: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  btnActionText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '900',
  },
  btnCancelDoc: {
    flex: 0.9,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  btnCancelDocText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
