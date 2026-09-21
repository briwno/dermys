import type { BottomNavTab } from '@/components/bottom-nav';
import { ClienteAgendamentosTab } from '@/telas/cliente/agendamentos-tab';
import { ClienteInicioTab } from '@/telas/cliente/inicio-tab';
import { ClienteMensagensTab } from '@/telas/cliente/mensagens-tab';
import { ClientePerfilTab } from '@/telas/cliente/perfil-tab';
import type { PerfilUsuario } from '@/types/auth';
import { LogOut } from 'lucide-react-native';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

interface PropsDashboardCliente {
  perfil: PerfilUsuario;
  onLogout: () => void;
  activeTab?: BottomNavTab;
}

export function DashboardCliente({ perfil, onLogout, activeTab = 'home' }: PropsDashboardCliente) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hiText}>Olá, {perfil.nomeExibicao || 'Cliente'}</Text>
            <Text style={styles.title}>{getTabTitle()}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <LogOut size={14} color="#fff" />
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        {/* Conteúdo Dinâmico por Aba */}
        {activeTab === 'home' && <ClienteInicioTab />}
        {activeTab === 'bookings' && <ClienteAgendamentosTab />}
        {activeTab === 'chat' && <ClienteMensagensTab perfil={perfil} />}
        {activeTab === 'profile' && <ClientePerfilTab perfil={perfil} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
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
