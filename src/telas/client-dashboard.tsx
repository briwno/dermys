import type { BottomNavTab } from '@/components/bottom-nav';
import { AnimatedScreenTransition } from '@/components/ui/animated-screen-transition';
import { ClienteAgendamentosTab } from '@/telas/cliente/agendamentos-tab';
import { ClienteInicioTab } from '@/telas/cliente/inicio-tab';
import { ClienteMensagensTab } from '@/telas/cliente/mensagens-tab';
import { ClientePerfilTab } from '@/telas/cliente/perfil-tab';
import type { PerfilUsuario } from '@/types/auth';
import { LogOut } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, tc } from '@/theme';

interface PropsDashboardCliente {
  perfil: PerfilUsuario;
  onLogout: () => void;
  activeTab?: BottomNavTab;
  chatContatoId?: string;
  onNavegarAba?: (tab: BottomNavTab, contatoId?: string) => void;
  onAtualizarPerfil?: (novoPerfil: PerfilUsuario) => void;
}

export function DashboardCliente({
  perfil,
  onLogout,
  activeTab = 'home',
  chatContatoId,
  onNavegarAba,
  onAtualizarPerfil,
}: PropsDashboardCliente) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'bookings':
        return 'Seus Agendamentos';
      case 'chat':
        return 'Mensagens & Chat';
      case 'profile':
        return 'Seu Perfil';
      case 'home':
      default:
        return 'Descubra artistas';
    }
  };

  if (activeTab === 'chat') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AnimatedScreenTransition screenKey="chat" style={styles.chatWrapper}>
          <ClienteMensagensTab perfil={perfil} contatoInicialId={chatContatoId} />
        </AnimatedScreenTransition>
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.header}>
      <View>
        <Text style={styles.hiText}>Olá, {perfil.nomeExibicao || 'Cliente'}</Text>
        <Text style={styles.title}>{getTabTitle()}</Text>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <LogOut size={14} color={tc('#fff')} />
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </View>
  );

  // Aba Início: feed paginado estilo Reels precisa de altura fixa (sem ScrollView externo)
  if (activeTab === 'home') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
          <View style={styles.homeContent}>
            {header}
            <ClienteInicioTab onNavegarAba={onNavegarAba} perfil={perfil} />
          </View>
        </AnimatedScreenTransition>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          {header}

          {/* Conteúdo Dinâmico por Aba */}
          {activeTab === 'bookings' && <ClienteAgendamentosTab perfil={perfil} />}
          {activeTab === 'profile' && (
            <ClientePerfilTab perfil={perfil} onAtualizarPerfil={onAtualizarPerfil} />
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
  homeContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.8,
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
