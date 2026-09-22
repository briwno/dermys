import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  ChevronDown,
  DollarSign,
  Home,
  LayoutGrid,
  Maximize2,
  MessageSquare,
  Smartphone,
  User,
  Users,
  Wrench,
  Zap,
} from 'lucide-react-native';
import { useDebug } from './debug-context';
import { MODELOS_DISPOSITIVOS, PERSONAS_TESTE, type ModeloDispositivo, type PersonaTeste } from './types';

export function DevTopBar() {
  const {
    modoMoldura,
    setModoMoldura,
    modelo,
    setModelo,
    escala,
    setEscala,
    alternarMenu,
    personaAtivaId,
    perfilAtual,
    activeTab,
    navegarParaAba,
    trocarPersona,
    deslogarParaAuth,
  } = useDebug();

  const [dropdownPersonasAberto, setDropdownPersonasAberto] = useState(false);

  const personaAtual = PERSONAS_TESTE.find((p) => p.id === personaAtivaId) || null;
  const isArtista = perfilAtual?.role === 'artista' || perfilAtual?.tipo_perfil === 'artista';

  const escalasDisponiveis = [
    { label: '75%', valor: 0.75 },
    { label: '85%', valor: 0.85 },
    { label: '92%', valor: 0.92 },
    { label: '100%', valor: 1.0 },
  ];

  const abasArtista = [
    { id: 'dashboard', label: 'Início', icon: LayoutGrid },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'financial', label: 'Fiscal', icon: DollarSign },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const abasCliente = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'bookings', label: 'Agendamentos', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <View style={styles.topBarContainer}>
      <View style={styles.leftSection}>
        {/* Logo / Tag Dev */}
        <View style={styles.brandWrap}>
          <Text style={styles.brandTitle}>DERMYS</Text>
          <Text style={styles.brandTag}>DEV TOOLS</Text>
        </View>

        {/* Seletor Rápido de Perfil Ativo */}
        <View style={styles.profileSelectorWrap}>
          <TouchableOpacity
            style={styles.profileActiveBtn}
            onPress={() => setDropdownPersonasAberto(!dropdownPersonasAberto)}
            activeOpacity={0.8}
          >
            {personaAtual?.avatarUrl ? (
              <Image source={{ uri: personaAtual.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <User size={12} color="#f3c21a" />
              </View>
            )}
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileNameText} numberOfLines={1}>
                {perfilAtual?.nomeExibicao || personaAtual?.nome || 'Tela de Login'}
              </Text>
              <Text style={styles.profileRoleText}>
                {perfilAtual ? (isArtista ? 'TATUADOR' : 'CLIENTE') : 'AUTH'}
              </Text>
            </View>
            <ChevronDown size={13} color="#888" />
          </TouchableOpacity>

          {/* Menu Dropdown de Personas */}
          {dropdownPersonasAberto && (
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownHeaderTitle}>Trocar Perfil Instantaneamente:</Text>
              <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                {PERSONAS_TESTE.map((p) => {
                  const isItemAtivo = personaAtivaId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.dropdownItem,
                        isItemAtivo && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        trocarPersona(p);
                        setDropdownPersonasAberto(false);
                      }}
                    >
                      {p.avatarUrl ? (
                        <Image source={{ uri: p.avatarUrl }} style={styles.dropdownAvatar} />
                      ) : (
                        <View style={styles.dropdownAvatarFallback}>
                          <User size={10} color="#f3c21a" />
                        </View>
                      )}
                      <View style={styles.dropdownItemInfo}>
                        <Text style={styles.dropdownItemName}>{p.nome}</Text>
                        <Text style={styles.dropdownItemSub}>
                          {p.tipo === 'artista' ? `Tatuador • ${p.cidade}` : 'Cliente'}
                        </Text>
                      </View>
                      {isItemAtivo && <Check size={13} color="#f3c21a" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.dropdownLogoutBtn}
                onPress={() => {
                  deslogarParaAuth();
                  setDropdownPersonasAberto(false);
                }}
              >
                <Text style={styles.dropdownLogoutText}>Ir para Tela de Login Inicial</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Atalhos Rápidos de Telas/Abas */}
        {perfilAtual && (
          <View style={styles.tabsShortcutsWrap}>
            {(isArtista ? abasArtista : abasCliente).map((tab) => {
              const isTabAtiva = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabShortcutPill,
                    isTabAtiva && styles.tabShortcutPillActive,
                  ]}
                  onPress={() => navegarParaAba(tab.id)}
                >
                  <IconComp size={11} color={isTabAtiva ? '#000' : '#888'} />
                  <Text
                    style={[
                      styles.tabShortcutText,
                      isTabAtiva && styles.tabShortcutTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Seção Direita: Controles de Exibição & Botão de Ferramentas */}
      <View style={styles.rightSection}>
        {/* Alternador Moldura / Tela Cheia */}
        <View style={styles.viewModeToggleWrap}>
          <TouchableOpacity
            style={[styles.viewModeBtn, modoMoldura && styles.viewModeBtnActive]}
            onPress={() => setModoMoldura(true)}
          >
            <Smartphone size={12} color={modoMoldura ? '#000' : '#888'} />
            <Text
              style={[
                styles.viewModeBtnText,
                modoMoldura && styles.viewModeBtnTextActive,
              ]}
            >
              Moldura
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeBtn, !modoMoldura && styles.viewModeBtnActive]}
            onPress={() => setModoMoldura(false)}
          >
            <Maximize2 size={12} color={!modoMoldura ? '#000' : '#888'} />
            <Text
              style={[
                styles.viewModeBtnText,
                !modoMoldura && styles.viewModeBtnTextActive,
              ]}
            >
              Tela Cheia
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seletor de Modelo e Zoom se estiver no modo moldura */}
        {modoMoldura && (
          <>
            <View style={styles.devicePillsWrap}>
              <TouchableOpacity
                style={[
                  styles.devicePill,
                  modelo === 'iphone_16_pro' && styles.devicePillActive,
                ]}
                onPress={() => setModelo('iphone_16_pro')}
              >
                <Text
                  style={[
                    styles.devicePillText,
                    modelo === 'iphone_16_pro' && styles.devicePillTextActive,
                  ]}
                >
                  iPhone 16
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.devicePill,
                  modelo === 'galaxy_s24' && styles.devicePillActive,
                ]}
                onPress={() => setModelo('galaxy_s24')}
              >
                <Text
                  style={[
                    styles.devicePillText,
                    modelo === 'galaxy_s24' && styles.devicePillTextActive,
                  ]}
                >
                  Galaxy S24
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.devicePill,
                  modelo === 'iphone_se' && styles.devicePillActive,
                ]}
                onPress={() => setModelo('iphone_se')}
              >
                <Text
                  style={[
                    styles.devicePillText,
                    modelo === 'iphone_se' && styles.devicePillTextActive,
                  ]}
                >
                  SE
                </Text>
              </TouchableOpacity>
            </View>

            {/* Escala */}
            <View style={styles.zoomControlWrap}>
              {escalasDisponiveis.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.zoomPill, escala === item.valor && styles.zoomPillActive]}
                  onPress={() => setEscala(item.valor)}
                >
                  <Text
                    style={[
                      styles.zoomPillText,
                      escala === item.valor && styles.zoomPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Botão de Abrir Painel Completo de Ferramentas */}
        <TouchableOpacity
          style={styles.moreToolsBtn}
          onPress={alternarMenu}
          activeOpacity={0.8}
        >
          <Wrench size={13} color="#000" />
          <Text style={styles.moreToolsBtnText}>Ferramentas de Teste</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    width: '100%',
    height: 48,
    backgroundColor: '#0e0e12',
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d26',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 9999,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandTag: {
    color: '#666677',
    fontSize: 9,
    fontWeight: '800',
  },
  profileSelectorWrap: {
    position: 'relative',
    zIndex: 10000,
  },
  profileActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16161c',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242430',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  avatarImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#222',
  },
  avatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextWrap: {
    gap: 1,
  },
  profileNameText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 110,
  },
  profileRoleText: {
    color: '#888899',
    fontSize: 8,
    fontWeight: '800',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    width: 260,
    backgroundColor: '#14141a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262634',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 10001,
  },
  dropdownHeaderTitle: {
    color: '#777788',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 6,
  },
  dropdownItemActive: {
    backgroundColor: '#1c1c26',
  },
  dropdownAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#222',
  },
  dropdownAvatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownItemSub: {
    color: '#777788',
    fontSize: 9,
  },
  dropdownLogoutBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#22222e',
    marginTop: 4,
  },
  dropdownLogoutText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  tabsShortcutsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14141a',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22222c',
  },
  tabShortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabShortcutPillActive: {
    backgroundColor: '#f3c21a',
  },
  tabShortcutText: {
    color: '#888899',
    fontSize: 10,
    fontWeight: '700',
  },
  tabShortcutTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16161c',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242430',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: '#f3c21a',
  },
  viewModeBtnText: {
    color: '#888899',
    fontSize: 10,
    fontWeight: '700',
  },
  viewModeBtnTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  devicePillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16161c',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242430',
  },
  devicePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devicePillActive: {
    backgroundColor: '#2b2b38',
  },
  devicePillText: {
    color: '#888899',
    fontSize: 10,
    fontWeight: '600',
  },
  devicePillTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  zoomControlWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16161c',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242430',
  },
  zoomPill: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomPillActive: {
    backgroundColor: '#2b2b38',
  },
  zoomPillText: {
    color: '#777788',
    fontSize: 9,
    fontWeight: '700',
  },
  zoomPillTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  moreToolsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moreToolsBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
});
