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
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  DollarSign,
  FileCheck,
  FileText,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  Maximize2,
  MessageSquare,
  Palette,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react-native';
import { DebugService } from '@/services/debug-service';
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
    perfilAtual,
    activeTab,
    navegarParaAba,
    carregandoPersona,
    trocarPersona,
    deslogarParaAuth,
  } = useDebug();

  const [abaAtiva, setAbaAtiva] = useState<'personas' | 'navegacao' | 'dispositivo' | 'simulador'>('personas');
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [executandoAcao, setExecutandoAcao] = useState(false);

  if (!menuAberto) return null;

  const isArtista = perfilAtual?.role === 'artista' || perfilAtual?.tipo_perfil === 'artista';

  const exibirFeedback = (msg: string) => {
    setMensagemStatus(msg);
    setTimeout(() => setMensagemStatus(null), 3500);
  };

  const handleCriarAgendamentoTeste = async () => {
    setExecutandoAcao(true);
    try {
      const clienteId = '99999999-9999-9999-9999-999999999999'; // Mariana Costa
      const artistaId = isArtista ? (perfilAtual?.id || '11111111-1111-1111-1111-111111111111') : '11111111-1111-1111-1111-111111111111';
      const ag = await DebugService.criarAgendamentoTeste(clienteId, artistaId, 'Fine Line Botânica');
      if (ag) {
        exibirFeedback('Novo agendamento de teste criado no Supabase com sucesso!');
      } else {
        exibirFeedback('Aviso: Não foi possível criar agendamento de teste.');
      }
    } catch {
      exibirFeedback('Erro ao criar agendamento.');
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleCriarTransacaoTeste = async () => {
    setExecutandoAcao(true);
    try {
      const clienteId = '99999999-9999-9999-9999-999999999999';
      const artistaId = isArtista ? (perfilAtual?.id || '11111111-1111-1111-1111-111111111111') : '11111111-1111-1111-1111-111111111111';
      const tr = await DebugService.criarTransacaoTeste(clienteId, artistaId, 'SINAL');
      if (tr) {
        exibirFeedback('Nova transação de sinal (R$ 150) criada no extrato financeiro!');
      } else {
        exibirFeedback('Aviso: Não foi possível criar transação.');
      }
    } catch {
      exibirFeedback('Erro ao criar transação.');
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleEnviarMensagemTeste = async () => {
    setExecutandoAcao(true);
    try {
      const clienteId = '99999999-9999-9999-9999-999999999999';
      const artistaId = '11111111-1111-1111-1111-111111111111';
      const msg = await DebugService.enviarMensagemTeste(
        clienteId,
        artistaId,
        `Olá! Mensagem de teste enviada em tempo real às ${new Date().toLocaleTimeString('pt-BR')}`
      );
      if (msg) {
        exibirFeedback('Mensagem em tempo real enviada via Supabase Realtime!');
      }
    } catch {
      exibirFeedback('Erro ao enviar mensagem.');
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleLimparCache = async () => {
    setExecutandoAcao(true);
    try {
      await DebugService.limparCacheLocal();
      exibirFeedback('Cache local do AsyncStorage limpo com sucesso.');
    } catch {
      exibirFeedback('Erro ao limpar cache.');
    } finally {
      setExecutandoAcao(false);
    }
  };

  const handleSimularAlertaMei = (tipo: 'normal' | 'alerta' | 'estourado') => {
    let msg = '';
    if (tipo === 'normal') {
      msg = 'Termômetro MEI em faixa segura (52%).';
    } else if (tipo === 'alerta') {
      msg = 'Alerta disparado: Faturamento atingiu 83% do teto MEI!';
    } else {
      msg = 'Alerta Crítico: Limite de R$ 81.000,00 do MEI ultrapassado!';
    }
    exibirFeedback(msg);
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Central de Testes & Desenvolvimento</Text>
              <Text style={styles.modalSubtitle}>Dermys Developer Tools • Ações, Personas e Simuladores</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuAberto(false)}
              activeOpacity={0.7}
            >
              <X size={18} color="#aaa" />
            </TouchableOpacity>
          </View>

          {/* Abas Superiores */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'personas' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('personas')}
            >
              <Users size={14} color={abaAtiva === 'personas' ? '#f3c21a' : '#777'} />
              <Text style={[styles.tabButtonText, abaAtiva === 'personas' && styles.tabButtonTextActive]}>
                Perfis ({PERSONAS_TESTE.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'navegacao' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('navegacao')}
            >
              <Compass size={14} color={abaAtiva === 'navegacao' ? '#f3c21a' : '#777'} />
              <Text style={[styles.tabButtonText, abaAtiva === 'navegacao' && styles.tabButtonTextActive]}>
                Navegação Rápida
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'dispositivo' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('dispositivo')}
            >
              <Smartphone size={14} color={abaAtiva === 'dispositivo' ? '#f3c21a' : '#777'} />
              <Text style={[styles.tabButtonText, abaAtiva === 'dispositivo' && styles.tabButtonTextActive]}>
                Moldura & Zoom
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, abaAtiva === 'simulador' && styles.tabButtonActive]}
              onPress={() => setAbaAtiva('simulador')}
            >
              <Zap size={14} color={abaAtiva === 'simulador' ? '#f3c21a' : '#777'} />
              <Text style={[styles.tabButtonText, abaAtiva === 'simulador' && styles.tabButtonTextActive]}>
                Simuladores & Dados
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Banner */}
          {mensagemStatus && (
            <View style={styles.feedbackBanner}>
              <CheckCircle2 size={15} color="#f3c21a" />
              <Text style={styles.feedbackBannerText}>{mensagemStatus}</Text>
            </View>
          )}

          {/* Conteúdo da Aba */}
          <ScrollView style={styles.modalContentScroll} showsVerticalScrollIndicator={false}>
            {/* ABA 1: PERSONAS */}
            {abaAtiva === 'personas' && (
              <View style={styles.tabContentStack}>
                <Text style={styles.sectionTitle}>Perfis Populados no Banco Supabase</Text>

                {carregandoPersona ? (
                  <View style={styles.loadingPersonaWrap}>
                    <ActivityIndicator size="small" color="#f3c21a" />
                    <Text style={styles.loadingPersonaText}>Carregando perfil...</Text>
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
                          activeOpacity={0.8}
                        >
                          <View style={styles.personaAvatarWrap}>
                            {persona.avatarUrl ? (
                              <Image
                                source={{ uri: persona.avatarUrl }}
                                style={styles.personaAvatarImg}
                              />
                            ) : (
                              <View style={styles.personaAvatarFallback}>
                                <User size={16} color="#f3c21a" />
                              </View>
                            )}
                          </View>

                          <View style={styles.personaDetailsWrap}>
                            <View style={styles.personaNameRow}>
                              <Text style={styles.personaNameText}>{persona.nome}</Text>
                              <Text style={styles.personaTypeBadge}>
                                {persona.tipo === 'artista' ? 'TATUADOR' : 'CLIENTE'}
                              </Text>
                            </View>

                            <Text style={styles.personaSubText} numberOfLines={1}>
                              {persona.estudio ? `${persona.estudio} • ` : ''}
                              {persona.estilo ? `${persona.estilo} • ` : ''}
                              {persona.cidade}
                            </Text>
                          </View>

                          <View style={styles.personaActionWrap}>
                            {isAtivo ? (
                              <View style={styles.activeBadgePill}>
                                <Check size={12} color="#000" />
                                <Text style={styles.activeBadgeText}>Ativo</Text>
                              </View>
                            ) : (
                              <View style={styles.switchButtonPill}>
                                <Text style={styles.switchButtonText}>Entrar</Text>
                                <ArrowRight size={12} color="#f3c21a" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={deslogarParaAuth}
                  activeOpacity={0.8}
                >
                  <LogOut size={14} color="#ef4444" />
                  <Text style={styles.logoutButtonText}>Ir para Tela de Login / Cadastro Inicial</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ABA 2: NAVEGAÇÃO RÁPIDA */}
            {abaAtiva === 'navegacao' && (
              <View style={styles.tabContentStack}>
                <Text style={styles.sectionTitle}>Atalhos de Telas do Aplicativo</Text>
                <Text style={styles.sectionSubtitle}>
                  Alterne diretamente para qualquer aba ou fluxo da aplicação:
                </Text>

                <View style={styles.navGrid}>
                  <TouchableOpacity
                    style={[styles.navCard, activeTab === 'home' && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba('home');
                      setMenuAberto(false);
                    }}
                  >
                    <Home size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Feed / Início (Cliente)</Text>
                      <Text style={styles.navCardSub}>Vitrine de flashes, busca e filtros regionais</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navCard, activeTab === 'dashboard' && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba('dashboard');
                      setMenuAberto(false);
                    }}
                  >
                    <LayoutGrid size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Dashboard do Tatuador</Text>
                      <Text style={styles.navCardSub}>Visão geral do estúdio, métricas e flashes</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navCard, (activeTab === 'schedule' || activeTab === 'bookings') && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba(isArtista ? 'schedule' : 'bookings');
                      setMenuAberto(false);
                    }}
                  >
                    <Calendar size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Agenda / Agendamentos</Text>
                      <Text style={styles.navCardSub}>Controle de sessões, reservas e status</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navCard, activeTab === 'financial' && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba('financial');
                      setMenuAberto(false);
                    }}
                  >
                    <DollarSign size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Painel Fiscal & Financeiro</Text>
                      <Text style={styles.navCardSub}>NFS-e, Termômetro MEI e Relatório PDF</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navCard, activeTab === 'chat' && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba('chat');
                      setMenuAberto(false);
                    }}
                  >
                    <MessageSquare size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Chat em Tempo Real</Text>
                      <Text style={styles.navCardSub}>Mensagens instantâneas com clientes e artistas</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navCard, activeTab === 'profile' && styles.navCardActive]}
                    onPress={() => {
                      navegarParaAba('profile');
                      setMenuAberto(false);
                    }}
                  >
                    <User size={18} color="#f3c21a" />
                    <View style={styles.navCardInfo}>
                      <Text style={styles.navCardTitle}>Perfil do Usuário</Text>
                      <Text style={styles.navCardSub}>Dados cadastrais, bio, estilos e fotos</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ABA 3: MOLDURA & DISPOSITIVOS */}
            {abaAtiva === 'dispositivo' && (
              <View style={styles.tabContentStack}>
                <View style={styles.settingCard}>
                  <View style={styles.settingTextWrap}>
                    <Text style={styles.settingTitle}>Moldura de Smartphone</Text>
                    <Text style={styles.settingDescription}>
                      Exibe o chassi de celular para teste de responsividade no desktop
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

                <View style={styles.settingGroup}>
                  <Text style={styles.groupLabel}>Modelo do Dispositivo</Text>
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
                          activeOpacity={0.8}
                        >
                          <Smartphone
                            size={16}
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
                          </View>
                          {isSelected && <Check size={14} color="#f3c21a" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <Text style={styles.groupLabel}>Escala de Exibição (Zoom)</Text>
                  <View style={styles.scaleButtonsRow}>
                    {[
                      { label: '75%', val: 0.75 },
                      { label: '85%', val: 0.85 },
                      { label: '92%', val: 0.92 },
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

            {/* ABA 4: SIMULADORES & DADOS */}
            {abaAtiva === 'simulador' && (
              <View style={styles.tabContentStack}>
                <Text style={styles.sectionTitle}>Ações Rápidas de Teste no Banco de Dados</Text>

                {/* Criação de Agendamento */}
                <View style={styles.simCard}>
                  <Text style={styles.simCardTitle}>1. Criar Agendamento de Teste Instantâneo</Text>
                  <Text style={styles.simCardDesc}>
                    Insere uma solicitação de reserva pendente no Supabase entre cliente e artista.
                  </Text>
                  <TouchableOpacity
                    style={styles.simActionPrimaryBtn}
                    onPress={handleCriarAgendamentoTeste}
                    disabled={executandoAcao}
                  >
                    <Calendar size={13} color="#000" />
                    <Text style={styles.simActionPrimaryBtnText}>Inserir Agendamento</Text>
                  </TouchableOpacity>
                </View>

                {/* Criação de Transação Financeira */}
                <View style={styles.simCard}>
                  <Text style={styles.simCardTitle}>2. Criar Transação de Sinal (PIX)</Text>
                  <Text style={styles.simCardDesc}>
                    Insere uma transação de R$ 150 em custódia no extrato financeiro.
                  </Text>
                  <TouchableOpacity
                    style={styles.simActionPrimaryBtn}
                    onPress={handleCriarTransacaoTeste}
                    disabled={executandoAcao}
                  >
                    <DollarSign size={13} color="#000" />
                    <Text style={styles.simActionPrimaryBtnText}>Inserir Transação Financeira</Text>
                  </TouchableOpacity>
                </View>

                {/* Enviar Mensagem Realtime */}
                <View style={styles.simCard}>
                  <Text style={styles.simCardTitle}>3. Enviar Mensagem de Teste no Chat</Text>
                  <Text style={styles.simCardDesc}>
                    Dispara uma mensagem em tempo real para verificar a sincronização do WebSocket.
                  </Text>
                  <TouchableOpacity
                    style={styles.simActionPrimaryBtn}
                    onPress={handleEnviarMensagemTeste}
                    disabled={executandoAcao}
                  >
                    <Send size={13} color="#000" />
                    <Text style={styles.simActionPrimaryBtnText}>Disparar Mensagem Realtime</Text>
                  </TouchableOpacity>
                </View>

                {/* Termômetro Fiscal */}
                <View style={styles.simCard}>
                  <Text style={styles.simCardTitle}>4. Testar Alertas do Termômetro MEI</Text>
                  <View style={styles.simActionsRow}>
                    <TouchableOpacity
                      style={[styles.simActionBtn, styles.simActionBtnGreen]}
                      onPress={() => handleSimularAlertaMei('normal')}
                    >
                      <Text style={styles.simActionBtnTextGreen}>Normal (52%)</Text>
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
                      <Text style={styles.simActionBtnTextRed}>Excedido 100%</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Limpeza de Cache */}
                <View style={styles.simCard}>
                  <Text style={styles.simCardTitle}>5. Limpeza de Cache Local</Text>
                  <TouchableOpacity
                    style={styles.simActionDangerBtn}
                    onPress={handleLimparCache}
                    disabled={executandoAcao}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={styles.simActionDangerBtnText}>Limpar AsyncStorage Local</Text>
                  </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#121214',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222228',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c22',
    backgroundColor: '#151518',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#777788',
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0c0c0e',
    paddingHorizontal: 14,
    paddingTop: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a20',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#f3c21a',
  },
  tabButtonText: {
    color: '#777788',
    fontSize: 11,
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
    backgroundColor: '#1c1c16',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c20',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  feedbackBannerText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  modalContentScroll: {
    padding: 16,
    maxHeight: 520,
  },
  tabContentStack: {
    gap: 12,
    paddingBottom: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#777788',
    fontSize: 11,
    marginTop: -4,
  },
  personasListWrap: {
    gap: 6,
  },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  personaCardIdle: {
    backgroundColor: '#16161a',
    borderColor: '#22222a',
  },
  personaCardActive: {
    backgroundColor: '#1c1c20',
    borderColor: '#f3c21a',
  },
  personaAvatarWrap: {
    position: 'relative',
  },
  personaAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222',
  },
  personaAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaDetailsWrap: {
    flex: 1,
    gap: 2,
  },
  personaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  personaNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  personaTypeBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: '#888',
  },
  personaSubText: {
    color: '#777788',
    fontSize: 10,
  },
  personaActionWrap: {
    justifyContent: 'center',
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activeBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
  },
  switchButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#202026',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  switchButtonText: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
    marginTop: 6,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingPersonaWrap: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingPersonaText: {
    color: '#777788',
    fontSize: 11,
  },
  navGrid: {
    gap: 8,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 12,
    gap: 12,
  },
  navCardActive: {
    borderColor: '#f3c21a',
    backgroundColor: '#1c1c24',
  },
  navCardInfo: {
    flex: 1,
    gap: 2,
  },
  navCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  navCardSub: {
    color: '#777788',
    fontSize: 10,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22222a',
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  settingDescription: {
    color: '#777788',
    fontSize: 10,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: '#f3c21a',
  },
  toggleSwitchOff: {
    backgroundColor: '#282832',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  toggleKnobOff: {
    alignSelf: 'flex-start',
  },
  settingGroup: {
    gap: 6,
  },
  groupLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  modelGrid: {
    gap: 6,
  },
  modelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  modelCardIdle: {
    backgroundColor: '#16161a',
    borderColor: '#22222a',
  },
  modelCardSelected: {
    backgroundColor: '#1c1c22',
    borderColor: '#f3c21a',
  },
  modelInfoWrap: {
    flex: 1,
  },
  modelName: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  modelNameSelected: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  scaleButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#16161a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22222a',
  },
  scaleBtnActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  scaleBtnText: {
    color: '#777788',
    fontSize: 10,
    fontWeight: '600',
  },
  scaleBtnTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  simCard: {
    backgroundColor: '#16161a',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22222a',
    gap: 8,
  },
  simCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  simCardDesc: {
    color: '#777788',
    fontSize: 10,
    lineHeight: 14,
  },
  simActionPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  simActionPrimaryBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  simActionDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  simActionDangerBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  simActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  simActionBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  simActionBtnGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  simActionBtnTextGreen: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '700',
  },
  simActionBtnYellow: {
    backgroundColor: 'rgba(243, 194, 26, 0.08)',
    borderColor: 'rgba(243, 194, 26, 0.25)',
  },
  simActionBtnTextYellow: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '700',
  },
  simActionBtnRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  simActionBtnTextRed: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
});
