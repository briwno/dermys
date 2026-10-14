import type { BottomNavTab } from '@/components/bottom-nav';
import { AnimatedScreenTransition } from '@/components/ui/animated-screen-transition';
import { ArtistaAgendaTab } from '@/telas/artista/agenda-tab';
import { ArtistaDashboardTab } from '@/telas/artista/dashboard-tab';
import { ArtistaFinanceiroTab } from '@/telas/artista/financeiro-tab';
import { ArtistaMensagensTab } from '@/telas/artista/mensagens-tab';
import { ArtistaPerfilTab } from '@/telas/artista/perfil-tab';
import type { PerfilUsuario } from '@/types/auth';
import { LogOut } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, tc } from '@/theme';

interface PropsDashboardArtista {
  perfil: PerfilUsuario;
  onLogout: () => void;
  activeTab?: BottomNavTab;
  chatContatoId?: string;
  onNavegarAba?: (tab: BottomNavTab, contatoId?: string) => void;
  onAtualizarPerfil?: (novoPerfil: PerfilUsuario) => void;
}

export function DashboardArtista({
  perfil,
  onLogout,
  activeTab = 'dashboard',
  chatContatoId,
  onNavegarAba,
  onAtualizarPerfil,
}: PropsDashboardArtista) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'schedule':
        return 'Agenda de Atendimentos';
      case 'financial':
        return 'Painel Fiscal & Financeiro';
      case 'chat':
        return 'Mensagens com Clientes';
      case 'profile':
        return 'Dados do Estúdio';
      case 'dashboard':
      default:
        return 'Dashboard do tatuador';
    }
  };

  if (activeTab === 'chat') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AnimatedScreenTransition screenKey="chat" style={styles.chatWrapper}>
          <ArtistaMensagensTab perfil={perfil} contatoInicialId={chatContatoId} />
        </AnimatedScreenTransition>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.hiText}>Studio mode</Text>
              <Text style={styles.title}>{getTabTitle()}</Text>
              <Text style={styles.subtitle}>{perfil.nomeExibicao || 'Tatuador'}</Text>
            </View>
            <Pressable style={styles.logoutButton} onPress={onLogout}>
              <LogOut size={14} color={tc('#fff')} />
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </View>

          {/* Conteúdo Dinâmico por Aba */}
          {activeTab === 'dashboard' && <ArtistaDashboardTab perfil={perfil} />}
          {activeTab === 'schedule' && <ArtistaAgendaTab />}
          {activeTab === 'financial' && <ArtistaFinanceiroTab perfil={perfil} />}
          {activeTab === 'profile' && (
            <ArtistaPerfilTab perfil={perfil} onAtualizarPerfil={onAtualizarPerfil} />
          )}
        </ScrollView>
      </AnimatedScreenTransition>
    </SafeAreaView>
  );
}

const styles = createThemedStyles({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  screenWrapper: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  hiText: {
    color: '#8a8a8a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    color: '#f3c21a',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#121212',
  },
  logoutText: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.1,
  },
});
