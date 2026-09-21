import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  LogOut,
  Maximize2,
  Palette,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import { useDebug } from './debug-context';
import { MODELOS_DISPOSITIVOS, PERSONAS_TESTE, type ModeloDispositivo, type PersonaTeste } from './types';

export function DebugMenuModal() {
  const {
    modoMoldura,
    setModoMoldura,
    modelo,
    setModelo,
    escala,
    setEscala,
    menuAberto,
    setMenuAberto,
    personaAtivaId,
    carregandoPersona,
    trocarPersona,
    deslogarParaAuth,
  } = useDebug();

  const [abaAtiva, setAbaAtiva] = useState<'dispositivo' | 'personas' | 'eventos'>('personas');
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  if (!menuAberto) return null;

  const handleSimularAlertaMei = (tipo: 'normal' | 'alerta' | 'estourado') => {
    let msg = '';
    if (tipo === 'normal') {
      msg = '✅ Termômetro MEI resetado para faixa segura (R$ 42.500,00 - 52%).';
    } else if (tipo === 'alerta') {
      msg = '⚠️ Alerta disparado: Faturamento atingiu 83% do teto MEI (R$ 67.500,00)!';
    } else {
      msg = '🚨 Alerta Crítico: Limite de R$ 81.000,00 do MEI ultrapassado! Desenquadramento sugerido.';
    }
    setMensagemStatus(msg);
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  const handleEmitirNfseRapida = () => {
    setMensagemStatus('⚡ Simulação: NFS-e nº 2026/0048 emitida com sucesso via Provedor Fiscal!');
    setTimeout(() => setMensagemStatus(null), 4000);
  };

  return (
    <Modal
      visible={menuAberto}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuAberto(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header do Menu de Debug */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconTag}>
                <Sparkles size={16} color="#f3c21a" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Painel de Controle & Testes</Text>
                <Text style={styles.modalSubtitle}>Dermys Developer & Preview Tools</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuAberto(false)}
              activeOpacity={0.7}
            >
              <X size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Abas Superiores */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'personas' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('personas')}
            >
              <Users size={15} color={abaAtiva === 'personas' ? '#f3c21a' : '#888'} />
              <Text
                style={[
                  styles.tabButtonText,
                  abaAtiva === 'personas' && styles.tabButtonTextActive,
                ]}
              >
                Trocar Perfil ({PERSONAS_TESTE.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'dispositivo' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('dispositivo')}
            >
              <Smartphone size={15} color={abaAtiva === 'dispositivo' ? '#f3c21a' : '#888'} />
              <Text
                style={[
                  styles.tabButtonText,
                  abaAtiva === 'dispositivo' && styles.tabButtonTextActive,
                ]}
              >
                Moldura Celular
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'eventos' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('eventos')}
            >
              <Zap size={15} color={abaAtiva === 'eventos' ? '#f3c21a' : '#888'} />
              <Text
                style={[
                  styles.tabButtonText,
                  abaAtiva === 'eventos' && styles.tabButtonTextActive,
                ]}
              >
                Simulações Fiscais
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mensagem de Feedback Rápido */}
          {mensagemStatus && (
            <View style={styles.feedbackBanner}>
              <CheckCircle2 size={16} color="#f3c21a" />
              <Text style={styles.feedbackBannerText}>{mensagemStatus}</Text>
            </View>
          )}

          {/* Conteúdo da Aba */}
          <ScrollView style={styles.modalContentScroll} showsVerticalScrollIndicator={false}>
            {/* ABA 1: PERSONAS (TROCA RÁPIDA DE PERFIL) */}
            {abaAtiva === 'personas' && (
              <View style={styles.tabContentStack}>
                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionTitle}>Perfis Populados no Banco</Text>
                  <Text style={styles.sectionSubtitle}>
                    Clique para alternar instantaneamente e testar o app na visão de cada estúdio ou cliente
                  </Text>
                </View>

                {carregandoPersona ? (
                  <View style={styles.loadingPersonaWrap}>
                    <ActivityIndicator size="large" color="#f3c21a" />
                    <Text style={styles.loadingPersonaText}>Carregando dados do perfil...</Text>
                  </View>
                ) : (
                  <View style={styles.personasListWrap}>
                    {PERSONAS_TESTE.map((persona) => {
                      const isAtivo = personaAtivaId === persona.id;

                      return (
                        <TouchableOpacity
                          key={persona.id}
                          style={[
                            styles.personaCard,
                            isAtivo ? styles.personaCardActive : styles.personaCardIdle,
                          ]}
                          onPress={() => trocarPersona(persona)}
                          activeOpacity={0.85}
                        >
                          <View style={styles.personaAvatarWrap}>
                            {persona.avatarUrl ? (
                              <Image
                                source={{ uri: persona.avatarUrl }}
                                style={styles.personaAvatarImg}
                              />
                            ) : (
                              <View style={styles.personaAvatarFallback}>
                                <User size={18} color="#f3c21a" />
                              </View>
                            )}
                            {isAtivo && <View style={styles.personaActiveDot} />}
                          </View>

                          <View style={styles.personaDetailsWrap}>
                            <View style={styles.personaNameRow}>
                              <Text style={styles.personaNameText}>{persona.nome}</Text>
                              <View
                                style={[
                                  styles.personaTypeTag,
                                  persona.tipo === 'artista'
                                    ? styles.personaTypeTagArtist
                                    : styles.personaTypeTagClient,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.personaTypeTagText,
                                    persona.tipo === 'artista'
                                      ? styles.personaTypeTagTextArtist
                                      : styles.personaTypeTagTextClient,
                                  ]}
                                >
                                  {persona.tipo === 'artista' ? 'TATUADOR' : 'CLIENTE'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.personaSubText}>
                              {persona.estudio ? `${persona.estudio} • ` : ''}
                              {persona.estilo ? `${persona.estilo} • ` : ''}
                              {persona.cidade}
                            </Text>
                          </View>

                          <View style={styles.personaActionWrap}>
                            {isAtivo ? (
                              <View style={styles.activeBadgePill}>
                                <Check size={14} color="#000" />
                                <Text style={styles.activeBadgeText}>Ativo</Text>
                              </View>
                            ) : (
                              <View style={styles.switchButtonPill}>
                                <Text style={styles.switchButtonText}>Trocar</Text>
                                <ArrowRight size={13} color="#f3c21a" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Opção de Desconectar / Ir para Tela de Auth */}
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={deslogarParaAuth}
                  activeOpacity={0.85}
                >
                  <LogOut size={16} color="#ef4444" />
                  <Text style={styles.logoutButtonText}>Ir para Tela de Login / Cadastro Inicial</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ABA 2: MOLDURA DO DISPOSITIVO */}
            {abaAtiva === 'dispositivo' && (
              <View style={styles.tabContentStack}>
                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionTitle}>Configurações de Exibição</Text>
                  <Text style={styles.sectionSubtitle}>
                    Visualize a aplicação exatamente como num smartphone real com bordas e notch
                  </Text>
                </View>

                {/* Chave de Ativar / Desativar Moldura */}
                <View style={styles.settingCard}>
                  <View style={styles.settingTextWrap}>
                    <Text style={styles.settingTitle}>Modo Moldura de Smartphone</Text>
                    <Text style={styles.settingDescription}>
                      Exibe o chassi de celular estilizado no desktop para teste de responsividade
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      modoMoldura ? styles.toggleSwitchOn : styles.toggleSwitchOff,
                    ]}
                    onPress={() => setModoMoldura(!modoMoldura)}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        modoMoldura ? styles.toggleKnobOn : styles.toggleKnobOff,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Seletor de Modelo */}
                <View style={styles.settingGroup}>
                  <Text style={styles.groupLabel}>Modelo do Smartphone</Text>
                  <View style={styles.modelGrid}>
                    {(Object.keys(MODELOS_DISPOSITIVOS) as ModeloDispositivo[]).map((key) => {
                      const item = MODELOS_DISPOSITIVOS[key];
                      const isSelected = modelo === key;

                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.modelCard,
                            isSelected ? styles.modelCardSelected : styles.modelCardIdle,
                          ]}
                          onPress={() => setModelo(key)}
                          activeOpacity={0.85}
                        >
                          <Smartphone
                            size={20}
                            color={isSelected ? '#f3c21a' : '#888899'}
                          />
                          <View style={styles.modelInfoWrap}>
                            <Text
                              style={[
                                styles.modelName,
                                isSelected && styles.modelNameSelected,
                              ]}
                            >
                              {item.nome}
                            </Text>
                            <Text style={styles.modelMeta}>
                              {item.largura > 0
                                ? `${item.largura} × ${item.altura} px`
                                : 'Responsivo'}
                            </Text>
                          </View>
                          {isSelected && <Check size={16} color="#f3c21a" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Seletor de Escala */}
                <View style={styles.settingGroup}>
                  <Text style={styles.groupLabel}>Escala / Zoom da Moldura</Text>
                  <View style={styles.scaleButtonsRow}>
                    {[
                      { label: '75%', val: 0.75 },
                      { label: '85%', val: 0.85 },
                      { label: '92% (Padrão)', val: 0.92 },
                      { label: '100%', val: 1.0 },
                    ].map((s) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[
                          styles.scaleBtn,
                          escala === s.val && styles.scaleBtnActive,
                        ]}
                        onPress={() => setEscala(s.val)}
                      >
                        <Text
                          style={[
                            styles.scaleBtnText,
                            escala === s.val && styles.scaleBtnTextActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ABA 3: SIMULAÇÕES FISCAIS & EVENTOS */}
            {abaAtiva === 'eventos' && (
              <View style={styles.tabContentStack}>
                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionTitle}>Ferramentas & Ações Rápidas</Text>
                  <Text style={styles.sectionSubtitle}>
                    Simule cenários fiscais, alertas e emissões sem impactar dados de produção
                  </Text>
                </View>

                {/* Termômetro MEI */}
                <View style={styles.simCard}>
                  <View style={styles.simCardHeader}>
                    <AlertTriangle size={18} color="#f3c21a" />
                    <Text style={styles.simCardTitle}>Termômetro Fiscal MEI (R$ 81.000)</Text>
                  </View>
                  <Text style={styles.simCardDesc}>
                    Dispare alertas visuais de teto de faturamento para testar a reação do painel do artista:
                  </Text>
                  <View style={styles.simActionsRow}>
                    <TouchableOpacity
                      style={[styles.simActionBtn, styles.simActionBtnGreen]}
                      onPress={() => handleSimularAlertaMei('normal')}
                    >
                      <Text style={styles.simActionBtnTextGreen}>Faixa Segura (52%)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.simActionBtn, styles.simActionBtnYellow]}
                      onPress={() => handleSimularAlertaMei('alerta')}
                    >
                      <Text style={styles.simActionBtnTextYellow}>Alerta 80%</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.simActionBtn, styles.simActionBtnRed]}
                      onPress={() => handleSimularAlertaMei('estourado')}
                    >
                      <Text style={styles.simActionBtnTextRed}>Limite Estourado</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Emissão Instantânea */}
                <View style={styles.simCard}>
                  <View style={styles.simCardHeader}>
                    <FileCheck size={18} color="#22c55e" />
                    <Text style={styles.simCardTitle}>Emissão de NFS-e de Teste</Text>
                  </View>
                  <Text style={styles.simCardDesc}>
                    Testa a comunicação com o provedor de emissão fiscal integrado (Focus NFe / Simulado).
                  </Text>
                  <TouchableOpacity
                    style={styles.simPrimaryBtn}
                    onPress={handleEmitirNfseRapida}
                    activeOpacity={0.85}
                  >
                    <Zap size={16} color="#000" />
                    <Text style={styles.simPrimaryBtnText}>Simular Emissão de NFS-e</Text>
                  </TouchableOpacity>
                </View>

                {/* Informações Técnicas */}
                <View style={styles.techInfoCard}>
                  <ShieldCheck size={16} color="#888" />
                  <Text style={styles.techInfoText}>
                    Ambiente de Testes Dermys • Expo 54 • Supabase PostgreSQL • Dark Mode Native
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#121217',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#262633',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
    backgroundColor: '#16161e',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconTag: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(243, 194, 26, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#888899',
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e1e28',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0d0d12',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c24',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#f3c21a',
  },
  tabButtonText: {
    color: '#888899',
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(243, 194, 26, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243, 194, 26, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feedbackBannerText: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalContentScroll: {
    padding: 20,
    maxHeight: 520,
  },
  tabContentStack: {
    gap: 16,
    paddingBottom: 16,
  },
  sectionHeaderWrap: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#777788',
    fontSize: 11,
    marginTop: 2,
  },
  personasListWrap: {
    gap: 8,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  personaCardIdle: {
    backgroundColor: '#16161f',
    borderColor: '#242430',
  },
  personaCardActive: {
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderColor: 'rgba(243, 194, 26, 0.4)',
  },
  personaAvatarWrap: {
    position: 'relative',
  },
  personaAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
  },
  personaAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaActiveDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#121217',
  },
  personaDetailsWrap: {
    flex: 1,
  },
  personaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personaNameText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  personaTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  personaTypeTagArtist: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
  },
  personaTypeTagClient: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  personaTypeTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personaTypeTagTextArtist: {
    color: '#f3c21a',
  },
  personaTypeTagTextClient: {
    color: '#60a5fa',
  },
  personaSubText: {
    color: '#888899',
    fontSize: 11,
    marginTop: 2,
  },
  personaActionWrap: {
    justifyContent: 'center',
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  switchButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#20202c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e2e3e',
  },
  switchButtonText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingPersonaWrap: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingPersonaText: {
    color: '#888899',
    fontSize: 12,
  },
  // Configs de Dispositivo
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161f',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242430',
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  settingDescription: {
    color: '#777788',
    fontSize: 11,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: '#f3c21a',
  },
  toggleSwitchOff: {
    backgroundColor: '#2b2b38',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  settingGroup: {
    gap: 8,
  },
  groupLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  modelGrid: {
    gap: 8,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  modelCardIdle: {
    backgroundColor: '#16161f',
    borderColor: '#242430',
  },
  modelCardSelected: {
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderColor: '#f3c21a',
  },
  modelInfoWrap: {
    flex: 1,
  },
  modelName: {
    color: '#cccccc',
    fontSize: 13,
    fontWeight: '600',
  },
  modelNameSelected: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  modelMeta: {
    color: '#777788',
    fontSize: 10,
    marginTop: 1,
  },
  scaleButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#16161f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242430',
  },
  scaleBtnActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  scaleBtnText: {
    color: '#888899',
    fontSize: 11,
    fontWeight: '600',
  },
  scaleBtnTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  // Simulações
  simCard: {
    backgroundColor: '#16161f',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242430',
    gap: 10,
  },
  simCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simCardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  simCardDesc: {
    color: '#888899',
    fontSize: 11,
    lineHeight: 16,
  },
  simActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  simActionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  simActionBtnGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  simActionBtnTextGreen: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  simActionBtnYellow: {
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderColor: 'rgba(243, 194, 26, 0.3)',
  },
  simActionBtnTextYellow: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '700',
  },
  simActionBtnRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  simActionBtnTextRed: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  simPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 10,
    borderRadius: 8,
  },
  simPrimaryBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
  },
  techInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f0f14',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f1f2a',
  },
  techInfoText: {
    color: '#666677',
    fontSize: 10,
    flex: 1,
  },
});
