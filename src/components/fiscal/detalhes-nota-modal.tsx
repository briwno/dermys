import { ds } from '@/theme/design-system';
import {
  imprimirOuBaixarPdfDanfse,
  montarDadosDanfse,
} from '@/services/fiscal/danfse-generator';
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
import { createThemedStyles, tc } from '@/theme';

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
    if (nota.url_pdf && nota.url_pdf.startsWith('http')) {
      Linking.openURL(nota.url_pdf).catch(() => {});
    } else {
      const danfse = montarDadosDanfse(nota);
      imprimirOuBaixarPdfDanfse(danfse);
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
                <FileCheck2 size={20} color={tc(ds.cores.destaque)} />
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
              <X size={18} color={tc(ds.cores.textoSuave)} />
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
                <ShieldCheck size={18} color={tc('#10b981')} />
              ) : isProcessando ? (
                <Clock size={18} color={tc(ds.cores.destaque)} />
              ) : isRejeitada ? (
                <AlertCircle size={18} color={tc('#ef4444')} />
              ) : (
                <XCircle size={18} color={tc(ds.cores.textoSuave)} />
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
                  <Percent size={14} color={tc(ds.cores.destaque)} />
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
                  <Text style={[styles.rowValue, { color: tc('#ef4444') }]}>
                    - R$ {nota.dados_split.valorTaxaPlataforma?.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.rowTotal}>
                  <Text style={styles.totalLabel}>Repasse Líquido Artista:</Text>
                  <Text style={[styles.totalValue, { color: tc('#10b981') }]}>
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
                  {copiado ? <Check size={12} color={tc('#10b981')} /> : <Copy size={12} color={tc(ds.cores.destaque)} />}
                  <Text style={[styles.btnCopyText, copiado && { color: tc('#10b981') }]}>
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
                  placeholderTextColor={tc(ds.cores.textoSuave)}
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
                      <ActivityIndicator color={tc(ds.cores.texto)} size="small" />
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
              <Send size={15} color={tc('#111')} />
              <Text style={styles.btnZapText}>WhatsApp</Text>
            </Pressable>

            <Pressable style={styles.btnAction} onPress={abrirPdf}>
              <Download size={15} color={tc(ds.cores.destaque)} />
              <Text style={styles.btnActionText}>PDF</Text>
            </Pressable>

            {nota.url_xml && (
              <Pressable style={styles.btnAction} onPress={abrirXml}>
                <FileCode size={15} color={tc(ds.cores.destaque)} />
                <Text style={styles.btnActionText}>XML</Text>
              </Pressable>
            )}

            {isAutorizada && !exibirFormCancelamento && (
              <Pressable
                style={styles.btnCancelDoc}
                onPress={() => setExibirFormCancelamento(true)}
              >
                <Ban size={15} color={tc('#ef4444')} />
                <Text style={styles.btnCancelDocText}>Cancelar</Text>
              </Pressable>
            )}
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
  receiptNumber: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    letterSpacing: 1,
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
    backgroundColor: ds.cores.elevada,
    borderColor: ds.cores.borda,
  },
  statusBannerText: {
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  textAutorizada: { color: '#10b981' },
  textProcessando: { color: ds.cores.destaque },
  textRejeitada: { color: '#ef4444' },
  textCancelada: { color: ds.cores.textoSuave },
  statusBannerSub: {
    color: '#aaa',
    fontSize: ds.fonte.corpo,
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  sectionCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 6,
  },
  cardHeaderTitle: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0,
    marginBottom: 4,
    lineHeight: 23,
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  rowValue: {
    color: '#e5e7eb',
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
    lineHeight: 20,
    flexShrink: 1,
  },
  descServico: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: ds.cores.borda,
    marginVertical: 4,
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    color: ds.cores.texto,
    fontSize: ds.fonte.legenda,
    fontWeight: '800',
    lineHeight: 17,
  },
  totalValue: {
    color: ds.cores.destaque,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    flexShrink: 1,
  },
  splitCard: {
    backgroundColor: '#0d0d0d',
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 6,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  splitTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    textTransform: 'none',
    lineHeight: 23,
    flexShrink: 1,
  },
  authBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 12,
    gap: 6,
  },
  authLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    lineHeight: 17,
  },
  authCode: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    letterSpacing: 1,
    lineHeight: 20,
    flexShrink: 1,
  },
  btnCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnCopyText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
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
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  cancelBoxSub: {
    color: '#aaa',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  cancelInput: {
    minHeight: 40,
    backgroundColor: ds.cores.elevada,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingHorizontal: 10,
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  cancelActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnCancelDismiss: {
    flex: 0.8,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelDismissText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnCancelConfirm: {
    flex: 1.2,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelConfirmText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  btnZap: {
    flex: 1.2,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnZapText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnAction: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  btnActionText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnCancelDoc: {
    flex: 0.9,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
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
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
});
