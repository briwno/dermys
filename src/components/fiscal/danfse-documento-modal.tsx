import { AppModal } from '@/components/ui/app-modal';
import {
  DadosDanfseCompleto,
  imprimirOuBaixarPdfDanfse,
  montarDadosDanfse,
} from '@/services/fiscal/danfse-generator';
import {
  Check,
  Copy,
  Download,
  FileCheck2,
  Printer,
  QrCode,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface DanfseDocumentoModalProps {
  visivel: boolean;
  dadosNotaOuRecibo: any;
  perfilTatuador?: any;
  perfilCliente?: any;
  onClose: () => void;
}

export function DanfseDocumentoModal({
  visivel,
  dadosNotaOuRecibo,
  perfilTatuador,
  perfilCliente,
  onClose,
}: DanfseDocumentoModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);

  const danfse: DadosDanfseCompleto | null = useMemo(() => {
    if (!dadosNotaOuRecibo) return null;
    return montarDadosDanfse(dadosNotaOuRecibo, perfilTatuador, perfilCliente);
  }, [dadosNotaOuRecibo, perfilTatuador, perfilCliente]);

  if (!visivel || !danfse) return null;

  const copiarChaveAcesso = () => {
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const handleBaixarOuImprimirPdf = () => {
    setBaixando(true);
    try {
      imprimirOuBaixarPdfDanfse(danfse);
    } finally {
      setTimeout(() => setBaixando(false), 1200);
    }
  };

  const abrirWhatsApp = () => {
    const texto =
      `📄 *DANFSe - Documento Auxiliar da NFS-e*\n` +
      `Nº: ${danfse.numeroNfse}\n` +
      `Prestador: ${danfse.prestadorNome}\n` +
      `Cliente: ${danfse.tomadorNome}\n` +
      `Valor: R$ ${danfse.valorLiquido.toFixed(2)}\n` +
      `Chave de Acesso: ${danfse.chaveAcesso}\n\n` +
      `Emitido via Dermys Tattoo Hub.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Superior com Ações Rápidas */}
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              <View style={styles.badgeOficial}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={styles.badgeOficialText}>PADRÃO NACIONAL NFS-E</Text>
              </View>
              <Text style={styles.topBarTitle}>NFS-e Nº {danfse.numeroNfse}</Text>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#aaa" />
            </Pressable>
          </View>

          {/* Área com Scroll contendo o Documento DANFSe Estilo Folha Oficial */}
          <ScrollView
            contentContainerStyle={styles.scrollDocument}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.danfsePaper}>
              {/* 1. Header do Documento */}
              <View style={styles.docHeader}>
                <View style={styles.docHeaderLeft}>
                  <Text style={styles.logoNfse}>
                    NFS<Text style={{ color: '#d97706' }}>e</Text>
                  </Text>
                  <Text style={styles.logoNfseSub}>Nota Fiscal de Serviço eletrônica</Text>
                </View>

                <View style={styles.docHeaderCenter}>
                  <Text style={styles.docTitleMain}>DANFSe v1.0</Text>
                  <Text style={styles.docTitleSub}>Documento Auxiliar da NFS-e</Text>
                </View>

                <View style={styles.docQrBox}>
                  <QrCode size={40} color="#000" />
                  <Text style={styles.docQrText}>Autenticidade via QR Code</Text>
                </View>
              </View>

              {/* 2. Chave de Acesso e Metadados */}
              <View style={styles.tableBlock}>
                <View style={styles.cellFullRow}>
                  <Text style={styles.fieldLabel}>Chave de Acesso da NFS-e</Text>
                  <Text style={styles.fieldValueChave}>{danfse.chaveAcesso}</Text>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Número da NFS-e</Text>
                    <Text style={styles.fieldValueBold}>{danfse.numeroNfse}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Competência da NFS-e</Text>
                    <Text style={styles.fieldValueBold}>{danfse.competencia}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Data e Hora da emissão da NFS-e</Text>
                    <Text style={styles.fieldValueBold}>{danfse.dataHoraEmissao}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Número do DPS</Text>
                    <Text style={styles.fieldValue}>{danfse.numeroDps}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Série da DPS</Text>
                    <Text style={styles.fieldValue}>{danfse.serieDps}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Data e Hora da emissão da DPS</Text>
                    <Text style={styles.fieldValue}>{danfse.dataHoraDps}</Text>
                  </View>
                </View>
              </View>

              {/* 3. Emitente da NFS-e (Tatuador) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>EMITENTE DA NFS-e (Prestador do Serviço)</Text>
              </View>

              <View style={styles.tableBlock}>
                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>CNPJ / CPF / NIF</Text>
                    <Text style={styles.fieldValueBold}>{danfse.prestadorCpfCnpj}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Inscrição Municipal</Text>
                    <Text style={styles.fieldValue}>{danfse.prestadorInscricaoMunicipal || '-'}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Telefone</Text>
                    <Text style={styles.fieldValue}>{danfse.prestadorTelefone || '-'}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Nome / Nome empresarial</Text>
                    <Text style={styles.fieldValueBold}>
                      {danfse.prestadorNome}
                      {danfse.prestadorNomeFantasia ? ` (${danfse.prestadorNomeFantasia})` : ''}
                    </Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <Text style={styles.fieldValue}>{danfse.prestadorEmail || '-'}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>Endereço</Text>
                    <Text style={styles.fieldValue}>{danfse.prestadorEndereco}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Município</Text>
                    <Text style={styles.fieldValueBold}>{danfse.prestadorMunicipioUf}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 0.8 }]}>
                    <Text style={styles.fieldLabel}>CEP</Text>
                    <Text style={styles.fieldValue}>{danfse.prestadorCep || '-'}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Simples Nacional na Data da Competência</Text>
                    <Text style={styles.fieldValueBold}>{danfse.prestadorSimplesNacional}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>Regime de Apuração</Text>
                    <Text style={styles.fieldValueBold}>{danfse.prestadorRegimeEspecial}</Text>
                  </View>
                </View>
              </View>

              {/* 4. Tomador do Serviço (Cliente) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>TOMADOR DO SERVIÇO (Cliente)</Text>
              </View>

              <View style={styles.tableBlock}>
                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>CNPJ / CPF / NIF</Text>
                    <Text style={styles.fieldValueBold}>{danfse.tomadorCpfCnpj || '***.***.***-**'}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Inscrição Municipal</Text>
                    <Text style={styles.fieldValue}>{danfse.tomadorInscricaoMunicipal || '-'}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Telefone</Text>
                    <Text style={styles.fieldValue}>{danfse.tomadorTelefone || '-'}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Nome / Nome empresarial</Text>
                    <Text style={styles.fieldValueBold}>{danfse.tomadorNome}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <Text style={styles.fieldValue}>{danfse.tomadorEmail || '-'}</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1.5 }]}>
                    <Text style={styles.fieldLabel}>Endereço</Text>
                    <Text style={styles.fieldValue}>{danfse.tomadorEndereco}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Município</Text>
                    <Text style={styles.fieldValueBold}>{danfse.tomadorMunicipioUf}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 0.8 }]}>
                    <Text style={styles.fieldLabel}>CEP</Text>
                    <Text style={styles.fieldValue}>{danfse.tomadorCep || '-'}</Text>
                  </View>
                </View>
              </View>

              {/* 5. Intermediário */}
              <View style={styles.intermediarioBar}>
                <Text style={styles.intermediarioText}>
                  {danfse.intermediarioTexto || 'INTERMEDIÁRIO DO SERVIÇO NÃO IDENTIFICADO NA NFS-e'}
                </Text>
              </View>

              {/* 6. Serviço Prestado */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>SERVIÇO PRESTADO</Text>
              </View>

              <View style={styles.tableBlock}>
                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>Código de Tributação Nacional</Text>
                    <Text style={styles.fieldValueBold}>{danfse.codigoTributacaoNacional}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Local da Prestação</Text>
                    <Text style={styles.fieldValueBold}>{danfse.localPrestacao}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 0.8 }]}>
                    <Text style={styles.fieldLabel}>País da Prestação</Text>
                    <Text style={styles.fieldValue}>{danfse.paisPrestacao}</Text>
                  </View>
                </View>

                <View style={styles.cellFullRow}>
                  <Text style={styles.fieldLabel}>Descrição do Serviço</Text>
                  <Text style={styles.fieldValueDesc}>{danfse.descricaoServico}</Text>
                </View>
              </View>

              {/* 7. Tributação Municipal */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>TRIBUTAÇÃO MUNICIPAL</Text>
              </View>

              <View style={styles.tableBlock}>
                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Tributação do ISSQN</Text>
                    <Text style={styles.fieldValue}>Operação Tributável</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>País Resultado</Text>
                    <Text style={styles.fieldValue}>Brasil</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Incidência do ISSQN</Text>
                    <Text style={styles.fieldValue}>{danfse.localPrestacao}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Regime Especial</Text>
                    <Text style={styles.fieldValue}>MEI</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Valor do Serviço</Text>
                    <Text style={styles.fieldValueBold}>R$ {danfse.valorServico.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Desconto Incondicionado</Text>
                    <Text style={styles.fieldValue}>R$ 0,00</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Total Deduções</Text>
                    <Text style={styles.fieldValue}>R$ 0,00</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Cálculo BM</Text>
                    <Text style={styles.fieldValue}>-</Text>
                  </View>
                </View>

                <View style={styles.rowDivided}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>BC ISSQN</Text>
                    <Text style={styles.fieldValueBold}>R$ {danfse.baseCalculoIssqn.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Alíquota Aplicada</Text>
                    <Text style={styles.fieldValue}>0,00% (MEI - DAS Fixo)</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Retenção do ISSQN</Text>
                    <Text style={styles.fieldValue}>Não retido</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>ISSQN Apurado</Text>
                    <Text style={styles.fieldValue}>R$ 0,00</Text>
                  </View>
                </View>
              </View>

              {/* 8. Total da NFS-e */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>VALOR TOTAL DA NFS-E</Text>
              </View>

              <View style={styles.tableBlock}>
                <View style={[styles.rowDivided, { backgroundColor: '#f0fdf4' }]}>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Valor do Serviço</Text>
                    <Text style={styles.fieldValueBold}>R$ {danfse.valorServico.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Descontos / Retenções</Text>
                    <Text style={styles.fieldValue}>R$ 0,00</Text>
                  </View>
                  <View style={[styles.cell, { flex: 1.5, backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.fieldLabel, { color: '#15803d' }]}>VALOR LÍQUIDO DA NFS-E</Text>
                    <Text style={styles.fieldValueTotalLiquido}>R$ {danfse.valorLiquido.toFixed(2)}</Text>
                  </View>
                </View>
              </View>

              {/* 9. Informações Complementares */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>INFORMAÇÕES COMPLEMENTARES</Text>
              </View>

              <View style={styles.infoComplementarBox}>
                <Text style={styles.infoComplementarText}>{danfse.informacoesComplementares}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Barra de Ações Inferior: Baixar PDF, Copiar Chave, WhatsApp */}
          <View style={styles.actionFooter}>
            <Pressable
              style={styles.btnBaixarPdf}
              onPress={handleBaixarOuImprimirPdf}
              disabled={baixando}
            >
              <Printer size={16} color="#000" />
              <Text style={styles.btnBaixarPdfText}>
                {baixando ? 'Gerando Documento...' : 'Baixar / Imprimir PDF da NFS-e'}
              </Text>
            </Pressable>

            <View style={styles.actionBtnRow}>
              <Pressable style={styles.btnSecondary} onPress={copiarChaveAcesso}>
                {copiado ? <Check size={14} color="#10b981" /> : <Copy size={14} color="#fff" />}
                <Text style={[styles.btnSecondaryText, copiado && { color: '#10b981' }]}>
                  {copiado ? 'Chave Copiada!' : 'Copiar Chave'}
                </Text>
              </Pressable>

              <Pressable style={styles.btnZap} onPress={abrirWhatsApp}>
                <Send size={14} color="#111" />
                <Text style={styles.btnZapText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  container: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '94%',
    backgroundColor: '#0c0c0e',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#24242c',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
    backgroundColor: '#121216',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeOficial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#062816',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOficialText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  scrollDocument: {
    padding: 10,
    paddingBottom: 16,
  },
  danfsePaper: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 8,
    gap: 4,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 6,
  },
  docHeaderLeft: {
    flex: 1,
  },
  logoNfse: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00703c',
    letterSpacing: -1,
  },
  logoNfseSub: {
    fontSize: 7,
    color: '#333',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  docHeaderCenter: {
    flex: 1.8,
    alignItems: 'center',
  },
  docTitleMain: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
  },
  docTitleSub: {
    fontSize: 9,
    color: '#444',
  },
  docQrBox: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: '#000',
    padding: 3,
  },
  docQrText: {
    fontSize: 5.5,
    textAlign: 'center',
    color: '#222',
    marginTop: 1,
  },
  sectionHeader: {
    backgroundColor: '#e5e5e5',
    borderWidth: 0.8,
    borderColor: '#000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  sectionHeaderText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  tableBlock: {
    borderWidth: 0.8,
    borderColor: '#000',
    marginTop: -1,
  },
  rowDivided: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
  },
  cell: {
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: '#000',
  },
  cellFullRow: {
    padding: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
  },
  fieldLabel: {
    fontSize: 6,
    color: '#333',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 7.5,
    color: '#000',
  },
  fieldValueBold: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#000',
  },
  fieldValueChave: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.4,
  },
  fieldValueDesc: {
    fontSize: 7.5,
    color: '#111',
    lineHeight: 11,
  },
  fieldValueTotalLiquido: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803d',
  },
  intermediarioBar: {
    borderWidth: 0.8,
    borderColor: '#000',
    padding: 2,
    backgroundColor: '#fafafa',
    marginTop: 2,
  },
  intermediarioText: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#444',
    textAlign: 'center',
  },
  infoComplementarBox: {
    borderWidth: 0.8,
    borderColor: '#000',
    padding: 4,
    backgroundColor: '#fafafa',
    marginTop: -1,
  },
  infoComplementarText: {
    fontSize: 7,
    color: '#222',
    lineHeight: 10,
  },
  actionFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121216',
    borderTopWidth: 1,
    borderTopColor: '#1c1c24',
    gap: 8,
  },
  btnBaixarPdf: {
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnBaixarPdfText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#1e1e26',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#323240',
  },
  btnSecondaryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  btnZap: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnZapText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
  },
});
