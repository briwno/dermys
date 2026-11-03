import type { BottomNavTab } from '@/components/bottom-nav';
import { AnimatedScreenTransition } from '@/components/ui/animated-screen-transition';
import { CabecalhoTela } from '@/components/ui/cabecalho-tela';
import { ClienteAgendamentosTab } from '@/telas/cliente/agendamentos-tab';
import { ClienteInicioTab } from '@/telas/cliente/inicio-tab';
import { ClienteMensagensTab } from '@/telas/cliente/mensagens-tab';
import { ClientePerfilTab } from '@/telas/cliente/perfil-tab';
import { createThemedStyles, tc } from '@/theme';
import { ds } from '@/theme/design-system';
import type { PerfilUsuario } from '@/types/auth';
import { LogOut } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
        return 'Seus agendamentos';
      case 'chat':
        return 'Mensagens & Chat';
      case 'profile':
        return 'Seu perfil';
      case 'home':
      default:
        return 'Descubra artistas';
    }
  };

  if (activeTab === 'chat') {
    return (
      <View style={styles.safeArea}>
        <AnimatedScreenTransition screenKey="chat" style={styles.chatWrapper}>
          <ClienteMensagensTab perfil={perfil} contatoInicialId={chatContatoId} />
        </AnimatedScreenTransition>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.hiText, activeTab === 'home' && styles.marca]}>{activeTab === 'home' ? 'DERMYS / EXPLORE' : `Olá, ${perfil.nomeExibicao || 'Cliente'}`}</Text>
        {activeTab === 'home' ? <Text style={styles.manifesto}>Descobrir.</Text> : <Text style={styles.title}>{getTabTitle()}</Text>}
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} accessibilityRole="button" accessibilityLabel="Sair da conta">
        <LogOut size={17} color={tc(ds.cores.textoSuave)} />
      </Pressable>
    </View>
  );

  // Aba Início: feed paginado estilo Reels precisa de altura fixa (sem ScrollView externo)
  if (activeTab === 'home') {
    return (
      <View style={styles.safeArea}>
        <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
          <View style={styles.homeContent}>
            <ClienteInicioTab cabecalho={header} onNavegarAba={onNavegarAba} perfil={perfil} />
          </View>
        </AnimatedScreenTransition>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <CabecalhoTela contexto="DERMYS / SUA CONTA" titulo={getTabTitle()} subtitulo={perfil.nomeExibicao || 'Cliente'} onSair={onLogout} />

          {/* Conteúdo Dinâmico por Aba */}
          {activeTab === 'bookings' && <ClienteAgendamentosTab perfil={perfil} />}
          {activeTab === 'profile' && (
            <ClientePerfilTab perfil={perfil} onAtualizarPerfil={onAtualizarPerfil} />
          )}
        </ScrollView>
      </AnimatedScreenTransition>
    </View>
  );
}

const styles = createThemedStyles({
  marca: { color: ds.cores.destaque, fontSize: ds.fonte.marca, fontWeight: '700', letterSpacing: 2.4, marginBottom: 8,
    lineHeight: 15, },
  manifesto: { color: ds.cores.texto, fontSize: 25, lineHeight: 27, fontWeight: '900', letterSpacing: -0.9 },
  manifestoDestaque: { color: ds.cores.destaque, fontStyle: 'italic' },
  safeArea: {
    flex: 1,
    backgroundColor: ds.cores.fundo,
  },
  screenWrapper: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: ds.espaco.padrao,
    paddingVertical: ds.espaco.padrao,
    gap: ds.espaco.secao,
    paddingBottom: 28,
  },
  homeContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    fontSize: ds.fonte.marca,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
    lineHeight: 15,
  },
  title: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 26,
    flexShrink: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    backgroundColor: '#101012',
  },
  logoutText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    textTransform: 'none',
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 20,
    flexShrink: 1,
  },
});
