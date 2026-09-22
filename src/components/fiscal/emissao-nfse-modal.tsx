import { FiscalService } from '@/services/fiscal/fiscal-service';
import { calcularSplitFiscal } from '@/services/split/split-service';
import type {
  DadosTomador,
  NotaFiscalRegistro,
  PerfilFiscal,
  TipoDocumentoFiscal,
} from '@/types/fiscal';
import {
  Check,
  FileCheck2,
  FileText,
  Percent,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppModal } from '@/components/ui/app-modal';

interface PropsEmissaoNfseModal {
  visivel: boolean;
  artistaId: string;
  perfilFiscal?: PerfilFiscal;
  dadosIniciais?: {
    clienteId?: string;
    clienteNome?: string;
    clienteCpf?: string;
    clienteEmail?: string;
    clienteTelefone?: string;
    agendamentoId?: string;
    transacaoId?: string;
    descricao?: string;
    valor?: number;
    estilo?: string;
  };
  onSucesso: (nota: NotaFiscalRegistro) => void;
  onClose: () => void;
}

export function EmissaoNfseModal({
  visivel,
  artistaId,
  perfilFiscal,
  dadosIniciais,
  onSucesso,
  onClose,
}: PropsEmissaoNfseModal) {
  const [tipoDoc, setTipoDoc] = useState<TipoDocumentoFiscal>('NFSE');
  const [nomeCliente, setNomeCliente] = useState(dadosIniciais?.clienteNome || '');
  const [cpfCliente, setCpfCliente] = useState(dadosIniciais?.clienteCpf || '');
  const [emailCliente, setEmailCliente] = useState(dadosIniciais?.clienteEmail || '');
  const [telefoneCliente, setTelefoneCliente] = useState(dadosIniciais?.clienteTelefone || '');
  const [descricao, setDescricao] = useState(
    dadosIniciais?.descricao || 'Procedimento de Tatuagem Artística Autoral'
  );
  const [valor, setValor] = useState(String(dadosIniciais?.valor || 350));
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (visivel) {
      setNomeCliente(dadosIniciais?.clienteNome || '');
      setCpfCliente(dadosIniciais?.clienteCpf || '');
      setEmailCliente(dadosIniciais?.clienteEmail || '');
      setTelefoneCliente(dadosIniciais?.clienteTelefone || '');
      setDescricao(dadosIniciais?.descricao || 'Procedimento de Tatuagem Artística Autoral');
      setValor(String(dadosIniciais?.valor || 350));
      setErro(null);
    }
  }, [visivel, dadosIniciais]);

  const valorNum = Number(valor) || 0;
  const splitInfo = calcularSplitFiscal({
    valorTotal: valorNum,
    taxaPlataformaPercent: 10,
  });

  const handleEmitir = async () => {
    if (!nomeCliente.trim()) {
      setErro('Informe o nome do cliente/tomador.');
      return;
    }
    if (valorNum <= 0) {
      setErro('Informe um valor válido para o serviço.');
      return;
    }

    setEmitindo(true);
    setErro(null);

    try {
      const tomador: DadosTomador = {
        nome: nomeCliente,
        cpfCnpj: cpfCliente,
        email: emailCliente,
        telefone: telefoneCliente,
      };

      const nota = await FiscalService.emitirNotaFiscal({
        artistaId,
        clienteId: dadosIniciais?.clienteId,
        agendamentoId: dadosIniciais?.agendamentoId,
        transacaoId: dadosIniciais?.transacaoId,
        tipoDocumento: tipoDoc,
        valorServico: valorNum,
        descricaoServico: descricao,
        tomador,
        split: splitInfo.dadosSplit,
      });

      onSucesso(nota);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao emitir documento fiscal.');
    } finally {
      setEmitindo(false);
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
                <Text style={styles.title}>Emissão de Documento Fiscal</Text>
                <Text style={styles.sub}>NFS-e Oficial ou Recibo de Prestação</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Escolha do Tipo */}
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[styles.typeBtn, tipoDoc === 'NFSE' && styles.typeBtnActive]}
                onPress={() => setTipoDoc('NFSE')}
              >
                <FileCheck2 size={16} color={tipoDoc === 'NFSE' ? '#111' : '#888'} />
                <Text style={[styles.typeBtnText, tipoDoc === 'NFSE' && styles.typeBtnTextActive]}>
                  NFS-e (Nota Fiscal)
                </Text>
              </Pressable>

              <Pressable
                style={[styles.typeBtn, tipoDoc === 'RECIBO_SIMPLES' && styles.typeBtnActive]}
                onPress={() => setTipoDoc('RECIBO_SIMPLES')}
              >
                <FileText size={16} color={tipoDoc === 'RECIBO_SIMPLES' ? '#111' : '#888'} />
                <Text
                  style={[
                    styles.typeBtnText,
                    tipoDoc === 'RECIBO_SIMPLES' && styles.typeBtnTextActive,
                  ]}
                >
                  Recibo Simples
                </Text>
              </Pressable>
            </View>

            {/* Dados do Tomador / Cliente */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>1. Tomador dos Serviços (Cliente)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do Cliente *</Text>
                <TextInput
                  value={nomeCliente}
                  onChangeText={setNomeCliente}
                  placeholder="Nome completo do cliente"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CPF do Cliente</Text>
                  <TextInput
                    value={cpfCliente}
                    onChangeText={setCpfCliente}
                    placeholder="000.000.000-00"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>WhatsApp (Envio)</Text>
                  <TextInput
                    value={telefoneCliente}
                    onChangeText={setTelefoneCliente}
                    placeholder="(11) 98888-8888"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-mail para Envio da Nota</Text>
                <TextInput
                  value={emailCliente}
                  onChangeText={setEmailCliente}
                  placeholder="cliente@email.com"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Discriminação do Procedimento */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Discriminação dos Serviços</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descrição da Tatuagem / Procedimento</Text>
                <TextInput
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Ex: Tatuagem Artística Fine Line no antebraço"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { minHeight: 64, textAlignVertical: 'top', paddingTop: 8 }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valor Total dos Serviços (R$) *</Text>
                <TextInput
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="numeric"
                  placeholder="350.00"
                  placeholderTextColor="#666"
                  style={[styles.input, { fontSize: 16, fontWeight: '900', color: '#f3c21a' }]}
                />
              </View>
            </View>

            {/* Resumo de Split e Não-Bitributação */}
            <View style={styles.splitCard}>
              <View style={styles.splitHeader}>
                <Percent size={14} color="#f3c21a" />
                <Text style={styles.splitTitle}>Estrutura de Split & Tributação</Text>
              </View>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>NFS-e do Artista (Serviço Total):</Text>
                <Text style={styles.splitValBold}>R$ {valorNum.toFixed(2)}</Text>
              </View>

              <View style={styles.splitRow}>
                <Text style={styles.splitLabel}>Taxa Plataforma Dermys (10%):</Text>
                <Text style={styles.splitValMuted}>
                  - R$ {splitInfo.dadosSplit.valorTaxaPlataforma.toFixed(2)}
                </Text>
              </View>

              <View style={styles.splitDivider} />

              <View style={styles.splitRow}>
                <Text style={styles.splitLabelTotal}>Líquido a Receber pelo Artista:</Text>
                <Text style={styles.splitValTotal}>
                  R$ {splitInfo.dadosSplit.valorLiquidoArtista.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.splitNotice}>
                ✓ O Dermys emitirá nota de intermediação separada referente à taxa, evitando
                bitributação sobre a sua receita.
              </Text>
            </View>

            {erro && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{erro}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={emitindo}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>

            <Pressable style={styles.emitBtn} onPress={handleEmitir} disabled={emitindo}>
              {emitindo ? (
                <ActivityIndicator color="#111" size="small" />
              ) : (
                <>
                  <Send size={16} color="#111" />
                  <Text style={styles.emitBtnText}>
                    {tipoDoc === 'NFSE' ? 'Emitir NFS-e Oficial' : 'Gerar Recibo Digital'}
                  </Text>
                </>
              )}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#262626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  typeBtnActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  typeBtnText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '800',
  },
  typeBtnTextActive: {
    color: '#111',
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 44,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#282828',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 13,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLabel: {
    color: '#888',
    fontSize: 11,
  },
  splitValBold: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  splitValMuted: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  splitDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 4,
  },
  splitLabelTotal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  splitValTotal: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '900',
  },
  splitNotice: {
    color: '#6b7280',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: '#2d2d2d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
  },
  emitBtn: {
    flex: 1.3,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emitBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
