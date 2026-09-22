import { FiscalService } from '@/services/fiscal/fiscal-service';
import type {
  AmbienteFiscal,
  PerfilFiscal,
  ProvedorFiscalTipo,
  RegimeTributarioFiscal,
  TipoPessoa,
} from '@/types/fiscal';
import {
  Building2,
  Check,
  FileCheck2,
  KeyRound,
  Lock,
  Radio,
  Save,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppModal } from '@/components/ui/app-modal';

interface PropsConfigFiscalModal {
  visivel: boolean;
  perfilFiscal: PerfilFiscal;
  onSalvar: (atualizado: PerfilFiscal) => void;
  onClose: () => void;
}

export function ConfigFiscalModal({
  visivel,
  perfilFiscal,
  onSalvar,
  onClose,
}: PropsConfigFiscalModal) {
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(perfilFiscal.tipo_pessoa || 'PJ');
  const [regime, setRegime] = useState<RegimeTributarioFiscal>(
    perfilFiscal.regime_tributario || 'MEI'
  );
  const [cpfCnpj, setCpfCnpj] = useState(perfilFiscal.cpf_cnpj || '');
  const [razaoSocial, setRazaoSocial] = useState(perfilFiscal.razao_social || '');
  const [nomeFantasia, setNomeFantasia] = useState(perfilFiscal.nome_fantasia || '');
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState(
    perfilFiscal.inscricao_municipal || ''
  );
  const [cnae, setCnae] = useState(perfilFiscal.cnae_padrao || '9609-2/06');
  const [codigoTributacao, setCodigoTributacao] = useState(
    perfilFiscal.codigo_tributacao_municipio || '06.01'
  );
  const [aliquotaIss, setAliquotaIss] = useState(String(perfilFiscal.aliquota_iss ?? 0));
  const [provedor, setProvedor] = useState<ProvedorFiscalTipo>(
    perfilFiscal.provedor_emissao || 'simulado'
  );
  const [apiKey, setApiKey] = useState(perfilFiscal.provedor_api_key || '');
  const [ambiente, setAmbiente] = useState<AmbienteFiscal>(
    perfilFiscal.provedor_ambiente || 'homologacao'
  );
  const [emissaoAutomatica, setEmissaoAutomatica] = useState(
    perfilFiscal.emissao_automatica ?? true
  );
  const [certificadoUrl, setCertificadoUrl] = useState(
    perfilFiscal.certificado_a1_url || ''
  );
  const [emailFiscal, setEmailFiscal] = useState(
    perfilFiscal.email_notificacao_fiscal || ''
  );

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (visivel) {
      setTipoPessoa(perfilFiscal.tipo_pessoa || 'PJ');
      setRegime(perfilFiscal.regime_tributario || 'MEI');
      setCpfCnpj(perfilFiscal.cpf_cnpj || '');
      setRazaoSocial(perfilFiscal.razao_social || '');
      setNomeFantasia(perfilFiscal.nome_fantasia || '');
      setInscricaoMunicipal(perfilFiscal.inscricao_municipal || '');
      setCnae(perfilFiscal.cnae_padrao || '9609-2/06');
      setCodigoTributacao(perfilFiscal.codigo_tributacao_municipio || '06.01');
      setAliquotaIss(String(perfilFiscal.aliquota_iss ?? 0));
      setProvedor(perfilFiscal.provedor_emissao || 'simulado');
      setApiKey(perfilFiscal.provedor_api_key || '');
      setAmbiente(perfilFiscal.provedor_ambiente || 'homologacao');
      setEmissaoAutomatica(perfilFiscal.emissao_automatica ?? true);
      setCertificadoUrl(perfilFiscal.certificado_a1_url || '');
      setEmailFiscal(perfilFiscal.email_notificacao_fiscal || '');
    }
  }, [visivel, perfilFiscal]);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const atualizado: PerfilFiscal = {
        ...perfilFiscal,
        tipo_pessoa: tipoPessoa,
        regime_tributario: regime,
        cpf_cnpj: cpfCnpj,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        inscricao_municipal: inscricaoMunicipal,
        cnae_padrao: cnae,
        codigo_tributacao_municipio: codigoTributacao,
        aliquota_iss: Number(aliquotaIss) || 0,
        provedor_emissao: provedor,
        provedor_api_key: apiKey,
        provedor_ambiente: ambiente,
        emissao_automatica: emissaoAutomatica,
        certificado_a1_url: certificadoUrl,
        email_notificacao_fiscal: emailFiscal,
      };

      const salvo = await FiscalService.salvarPerfilFiscal(atualizado);
      onSalvar(salvo);
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.warn('Erro ao salvar perfil fiscal:', err);
    } finally {
      setSalvando(false);
    }
  };

  const simularUploadCertificado = () => {
    setCertificadoUrl('certificados/a1_tatuador_criptografado.pfx');
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
                <Text style={styles.title}>Configurações Fiscais</Text>
                <Text style={styles.sub}>Perfil de Emissão de NFS-e & Tributos</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Form Scroll */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Tipo de Pessoa & Regime */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>1. Enquadramento Tributário</Text>

              <View style={styles.radioRow}>
                <Pressable
                  style={[styles.radioOption, tipoPessoa === 'PJ' && styles.radioActive]}
                  onPress={() => {
                    setTipoPessoa('PJ');
                    setRegime('MEI');
                  }}
                >
                  <Text style={[styles.radioText, tipoPessoa === 'PJ' && styles.radioTextActive]}>
                    Pessoa Jurídica (MEI / ME)
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.radioOption, tipoPessoa === 'PF' && styles.radioActive]}
                  onPress={() => {
                    setTipoPessoa('PF');
                    setRegime('AUTONOMO_PF');
                  }}
                >
                  <Text style={[styles.radioText, tipoPessoa === 'PF' && styles.radioTextActive]}>
                    Pessoa Física (CPF)
                  </Text>
                </Pressable>
              </View>

              {tipoPessoa === 'PJ' && (
                <View style={styles.pillsRow}>
                  {[
                    { id: 'MEI', label: 'MEI (R$ 81k/ano)' },
                    { id: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
                    { id: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
                  ].map((r) => {
                    const ativo = regime === r.id;
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => setRegime(r.id as any)}
                        style={[styles.pill, ativo ? styles.pillActive : styles.pillIdle]}
                      >
                        <Text style={[styles.pillText, ativo && styles.pillTextActive]}>
                          {r.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Dados Cadastrais */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Dados Cadastrais & Prefeitura</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} *</Text>
                <TextInput
                  value={cpfCnpj}
                  onChangeText={setCpfCnpj}
                  placeholder={tipoPessoa === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {tipoPessoa === 'PJ' ? 'Razão Social' : 'Nome Completo'} *
                </Text>
                <TextInput
                  value={razaoSocial}
                  onChangeText={setRazaoSocial}
                  placeholder="Nome registrado na Receita Federal"
                  placeholderTextColor="#666"
                  style={styles.input}
                />
              </View>

              {tipoPessoa === 'PJ' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome Fantasia</Text>
                  <TextInput
                    value={nomeFantasia}
                    onChangeText={setNomeFantasia}
                    placeholder="Nome do estúdio / marca"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
              )}

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1.2 }]}>
                  <Text style={styles.inputLabel}>Inscrição Municipal (IM) *</Text>
                  <TextInput
                    value={inscricaoMunicipal}
                    onChangeText={setInscricaoMunicipal}
                    placeholder="Ex: 12345678"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={styles.inputLabel}>Alíquota ISS (%)</Text>
                  <TextInput
                    value={aliquotaIss}
                    onChangeText={setAliquotaIss}
                    keyboardType="numeric"
                    placeholder="0.0"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CNAE Principal</Text>
                  <TextInput
                    value={cnae}
                    onChangeText={setCnae}
                    placeholder="9609-2/06"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                  <Text style={styles.inputTip}>9609-2/06: Tatuagem e Piercing</Text>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Cód. Tributação (LC 116)</Text>
                  <TextInput
                    value={codigoTributacao}
                    onChangeText={setCodigoTributacao}
                    placeholder="06.01"
                    placeholderTextColor="#666"
                    style={styles.input}
                  />
                  <Text style={styles.inputTip}>Item 06.01 da Lei Comp. 116</Text>
                </View>
              </View>
            </View>

            {/* Provedor de API & Certificado A1 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>3. Provedor de Emissão & Integração</Text>

              <Text style={styles.inputLabel}>Selecione o Motor de NFS-e</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providersRow}>
                {[
                  { id: 'simulado', label: 'Simulador Dermys' },
                  { id: 'focus_nfe', label: 'Focus NFe' },
                  { id: 'plugnotas', label: 'PlugNotas' },
                  { id: 'nuvemfiscal', label: 'Nuvem Fiscal' },
                  { id: 'asaas', label: 'Asaas' },
                ].map((p) => {
                  const ativo = provedor === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setProvedor(p.id as any)}
                      style={[styles.provPill, ativo ? styles.provPillActive : styles.provPillIdle]}
                    >
                      <Text style={[styles.provText, ativo && styles.provTextActive]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {provedor !== 'simulado' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>API Key / Token de Acesso ({provedor})</Text>
                    <TextInput
                      value={apiKey}
                      onChangeText={setApiKey}
                      secureTextEntry
                      placeholder="Insira sua chave de API secreta"
                      placeholderTextColor="#666"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.radioRow}>
                    <Pressable
                      style={[styles.radioOption, ambiente === 'homologacao' && styles.radioActive]}
                      onPress={() => setAmbiente('homologacao')}
                    >
                      <Text style={[styles.radioText, ambiente === 'homologacao' && styles.radioTextActive]}>
                        Homologação (Testes)
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.radioOption, ambiente === 'producao' && styles.radioActive]}
                      onPress={() => setAmbiente('producao')}
                    >
                      <Text style={[styles.radioText, ambiente === 'producao' && styles.radioTextActive]}>
                        Produção (Oficial)
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Certificado Digital A1 */}
              <View style={styles.certBox}>
                <View style={styles.certHeader}>
                  <KeyRound size={16} color="#f3c21a" />
                  <Text style={styles.certTitle}>Certificado Digital A1 (.pfx)</Text>
                </View>
                <Text style={styles.certDesc}>
                  Necessário para municípios que exigem assinatura criptográfica via certificado A1.
                </Text>

                {certificadoUrl ? (
                  <View style={styles.certSuccess}>
                    <ShieldCheck size={16} color="#10b981" />
                    <Text style={styles.certSuccessText}>Certificado A1 carregado e ativo</Text>
                  </View>
                ) : (
                  <Pressable style={styles.certUploadBtn} onPress={simularUploadCertificado}>
                    <Upload size={14} color="#111" />
                    <Text style={styles.certUploadBtnText}>Fazer Upload do Certificado (.pfx)</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Automação & Notificações */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>4. Automação de Emissão</Text>

              <View style={styles.switchRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.switchTitle}>Emissão Automática ao Liquidar</Text>
                  <Text style={styles.switchDesc}>
                    Disparar a NFS-e automaticamente assim que o agendamento for concluído no app.
                  </Text>
                </View>
                <Switch
                  value={emissaoAutomatica}
                  onValueChange={setEmissaoAutomatica}
                  trackColor={{ false: '#333', true: '#f3c21a' }}
                  thumbColor={emissaoAutomatica ? '#111' : '#888'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>

            <Pressable style={styles.saveBtn} onPress={handleSalvar} disabled={salvando}>
              {salvando ? (
                <ActivityIndicator color="#111" size="small" />
              ) : sucesso ? (
                <>
                  <Check size={16} color="#111" />
                  <Text style={styles.saveBtnText}>Salvo com Sucesso!</Text>
                </>
              ) : (
                <>
                  <Save size={16} color="#111" />
                  <Text style={styles.saveBtnText}>Salvar Dados Fiscais</Text>
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
    gap: 14,
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
  radioRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#252525',
    backgroundColor: '#161616',
    alignItems: 'center',
  },
  radioActive: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderColor: '#f3c21a',
  },
  radioText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
  },
  radioTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  pillIdle: {
    backgroundColor: '#181818',
    borderColor: '#282828',
  },
  pillText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#111',
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
  inputTip: {
    color: '#666',
    fontSize: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  providersRow: {
    gap: 8,
    paddingVertical: 4,
  },
  provPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  provPillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  provPillIdle: {
    backgroundColor: '#181818',
    borderColor: '#282828',
  },
  provText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '800',
  },
  provTextActive: {
    color: '#111',
  },
  certBox: {
    backgroundColor: '#161616',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  certDesc: {
    color: '#888',
    fontSize: 10,
    lineHeight: 14,
  },
  certUploadBtn: {
    minHeight: 38,
    backgroundColor: '#f3c21a',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  certUploadBtnText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
  },
  certSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  certSuccessText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  switchTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  switchDesc: {
    color: '#888',
    fontSize: 10,
    lineHeight: 14,
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
  saveBtn: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
