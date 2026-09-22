import type { ReciboFiscal } from '@/types/financeiro';
import { Check, Copy, FileText, ShieldCheck, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppModal } from '@/components/ui/app-modal';

interface ReciboFiscalModalProps {
  visivel: boolean;
  recibo: ReciboFiscal | null;
  onClose: () => void;
}

export function ReciboFiscalModal({ visivel, recibo, onClose }: ReciboFiscalModalProps) {
  const [copiado, setCopiado] = useState(false);

  if (!recibo) return null;

  const copiarDadosRecibo = () => {
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
                <FileText size={20} color="#f3c21a" />
              </View>
              <View>
                <Text style={styles.title}>Recibo Fiscal & Quitação</Text>
                <Text style={styles.receiptNumber}>{recibo.numeroRecibo}</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Conteúdo com Scroll */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={styles.statusBox}>
              <ShieldCheck size={16} color="#10b981" />
              <Text style={styles.statusText}>Pagamento Liquidado via Mercado Pago</Text>
            </View>

            {/* Informações do Prestador e Tomador */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Prestador dos Serviços</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Artista / Tatuador:</Text>
                <Text style={styles.rowValue}>{recibo.artistaNome}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Estúdio:</Text>
                <Text style={styles.rowValue}>{recibo.artistaEstudio}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Documento / Regime:</Text>
                <Text style={styles.rowValue}>
                  {recibo.regimeTributario} • {recibo.artistaDocumento}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Tomador do Serviço (Cliente)</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Nome do Cliente:</Text>
                <Text style={styles.rowValue}>{recibo.clienteNome}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Procedimento:</Text>
                <Text style={styles.rowValue}>{recibo.descricaoServico}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Estilo Artístico:</Text>
                <Text style={styles.rowValue}>{recibo.estilo}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Data de Emissão:</Text>
                <Text style={styles.rowValue}>{recibo.dataEmissao}</Text>
              </View>
            </View>

            {/* Discriminação dos Valores */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardHeaderTitle}>Discriminação Financeira</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Sinal de Reserva (MP PIX):</Text>
                <Text style={styles.rowValue}>R$ {recibo.valorSinal?.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Liquidação Final:</Text>
                <Text style={styles.rowValue}>
                  R$ {(recibo.valorFinal > 0 ? recibo.valorFinal - recibo.valorSinal : 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowTotal}>
                <Text style={styles.totalLabel}>Valor Total dos Serviços:</Text>
                <Text style={styles.totalValue}>R$ {recibo.valorTotal?.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Forma de Liquidação:</Text>
                <Text style={styles.rowValue}>{recibo.formaPagamento}</Text>
              </View>
            </View>

            {/* Dados Fiscais / Autenticação */}
            <View style={styles.fiscalBox}>
              <Text style={styles.fiscalNotice}>
                Documento de controle e comprovação financeira emitido nos termos da Lei Complementar nº
                128/2008 (MEI) e normas de prestação de serviços artísticos.
              </Text>
              <View style={styles.authRow}>
                <Text style={styles.authLabel}>Autenticação Digital:</Text>
                <Text style={styles.authCode}>{recibo.codigoAutenticacao}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Rodapé de Ações */}
          <View style={styles.footer}>
            <Pressable style={styles.copyBtn} onPress={copiarDadosRecibo}>
              {copiado ? <Check size={16} color="#10b981" /> : <Copy size={16} color="#fff" />}
              <Text style={[styles.copyBtnText, copiado && styles.copyBtnTextCopied]}>
                {copiado ? 'Dados Copiados!' : 'Copiar Dados do Recibo'}
              </Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Fechar</Text>
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
    maxHeight: '90%',
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
    letterSpacing: -0.3,
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
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  statusText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
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
    fontSize: 12,
  },
  rowValue: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 6,
  },
  rowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  totalValue: {
    color: '#f3c21a',
    fontSize: 16,
    fontWeight: '900',
  },
  fiscalBox: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 12,
    gap: 8,
  },
  fiscalNotice: {
    color: '#6b7280',
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  authRow: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
  },
  authCode: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  copyBtn: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  copyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  copyBtnTextCopied: {
    color: '#10b981',
  },
  doneBtn: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
