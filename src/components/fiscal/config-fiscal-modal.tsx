import { ds } from '@/theme/design-system';
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
import { createThemedStyles, tc } from '@/theme';

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
                <FileCheck2 size={20} color={tc(ds.cores.destaque)} />
              </View>
              <View>
                <Text style={styles.title}>Configurações Fiscais</Text>
                <Text style={styles.sub}>Perfil de Emissão de NFS-e & Tributos</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={tc(ds.cores.textoSuave)} />
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
                  placeholderTextColor={tc(ds.cores.textoSuave)}
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
                  placeholderTextColor={tc(ds.cores.textoSuave)}
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
                    placeholderTextColor={tc(ds.cores.textoSuave)}
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
                    placeholderTextColor={tc(ds.cores.textoSuave)}
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
                    placeholderTextColor={tc(ds.cores.textoSuave)}
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
                    placeholderTextColor={tc(ds.cores.textoSuave)}
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
                    placeholderTextColor={tc(ds.cores.textoSuave)}
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
                      placeholderTextColor={tc(ds.cores.textoSuave)}
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
                  <KeyRound size={16} color={tc(ds.cores.destaque)} />
                  <Text style={styles.certTitle}>Certificado Digital A1 (.pfx)</Text>
                </View>
                <Text style={styles.certDesc}>
                  Necessário para municípios que exigem assinatura criptográfica via certificado A1.
                </Text>

                {certificadoUrl ? (
                  <View style={styles.certSuccess}>
                    <ShieldCheck size={16} color={tc('#10b981')} />
                    <Text style={styles.certSuccessText}>Certificado A1 carregado e ativo</Text>
                  </View>
                ) : (
                  <Pressable style={styles.certUploadBtn} onPress={simularUploadCertificado}>
                    <Upload size={14} color={tc('#111')} />
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
                  trackColor={{ false: tc('#333'), true: tc(ds.cores.destaque) }}
                  thumbColor={emissaoAutomatica ? tc('#111') : tc(ds.cores.textoSuave)}
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
                <ActivityIndicator color={tc('#111')} size="small" />
              ) : sucesso ? (
                <>
                  <Check size={16} color={tc('#111')} />
                  <Text style={styles.saveBtnText}>Salvo com Sucesso!</Text>
                </>
              ) : (
                <>
                  <Save size={16} color={tc('#111')} />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: ds.espaco.padrao,
    gap: 10,
  },
  sectionTitle: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.secao,
    fontWeight: '700',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 26,
    flexShrink: 1,
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
    backgroundColor: ds.cores.elevada,
    alignItems: 'center',
  },
  radioActive: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderColor: ds.cores.destaque,
  },
  radioText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  radioTextActive: {
    color: ds.cores.destaque,
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
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  pillIdle: {
    backgroundColor: ds.cores.elevada,
    borderColor: ds.cores.borda,
  },
  pillText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '800',
    lineHeight: 16,
  },
  pillTextActive: {
    color: '#111',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  input: {
    minHeight: ds.alvo.controle,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    borderRadius: ds.raio.campo,
    paddingHorizontal: 12,
    color: ds.cores.texto,
    fontSize: ds.fonte.campo,
    lineHeight: 23,
    flexShrink: 1,
  },
  inputTip: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
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
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  provPillIdle: {
    backgroundColor: ds.cores.elevada,
    borderColor: ds.cores.borda,
  },
  provText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  provTextActive: {
    color: '#111',
  },
  certBox: {
    backgroundColor: ds.cores.elevada,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ds.cores.borda,
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
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  certDesc: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  certUploadBtn: {
    minHeight: ds.alvo.controle,
    backgroundColor: ds.cores.destaque,
    borderRadius: ds.raio.controle,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  certUploadBtnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  certSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  certSuccessText: {
    color: '#10b981',
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  switchTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  switchDesc: {
    color: ds.cores.textoSuave,
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
  cancelBtn: {
    flex: 0.8,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  saveBtn: {
    flex: 1.2,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    backgroundColor: ds.cores.destaque,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
});
