import { ds } from '@/theme/design-system';
import type { BottomNavTab } from '@/components/bottom-nav';
import { AnimatedScreenTransition } from '@/components/ui/animated-screen-transition';
import { CabecalhoTela } from '@/components/ui/cabecalho-tela';
import { ArtistaAgendaTab } from '@/telas/artista/agenda-tab';
import { ArtistaDashboardTab } from '@/telas/artista/dashboard-tab';
import { ArtistaFinanceiroTab } from '@/telas/artista/financeiro-tab';
import { ArtistaMensagensTab } from '@/telas/artista/mensagens-tab';
import { ArtistaPerfilTab } from '@/telas/artista/perfil-tab';
import type { PerfilUsuario } from '@/types/auth';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { createThemedStyles } from '@/theme';

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
        return 'Sua agenda';
      case 'financial':
        return 'Financeiro & fiscal';
      case 'chat':
        return 'Mensagens com Clientes';
      case 'profile':
        return 'Perfil do estúdio';
      case 'dashboard':
      default:
        return 'Seu estúdio';
    }
  };

  if (activeTab === 'chat') {
    return (
      <View style={styles.safeArea}>
        <AnimatedScreenTransition screenKey="chat" style={styles.chatWrapper}>
          <ArtistaMensagensTab perfil={perfil} contatoInicialId={chatContatoId} />
        </AnimatedScreenTransition>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <AnimatedScreenTransition screenKey={activeTab} style={styles.screenWrapper}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <CabecalhoTela contexto="DERMYS / ESTÚDIO" titulo={getTabTitle()} subtitulo={perfil.nomeExibicao || 'Tatuador'} onSair={onLogout} />

          {/* Conteúdo Dinâmico por Aba */}
          {activeTab === 'dashboard' && <ArtistaDashboardTab perfil={perfil} />}
          {activeTab === 'schedule' && <ArtistaAgendaTab perfil={perfil} />}
          {activeTab === 'financial' && <ArtistaFinanceiroTab perfil={perfil} />}
          {activeTab === 'profile' && (
            <ArtistaPerfilTab perfil={perfil} onAtualizarPerfil={onAtualizarPerfil} />
          )}
        </ScrollView>
      </AnimatedScreenTransition>
    </View>
  );
}

const styles = createThemedStyles({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  hiText: {
    color: '#8a8a8a',
    fontSize: ds.fonte.marca,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    lineHeight: 15,
  },
  title: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.modal,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: -0.7,
    lineHeight: 26,
    flexShrink: 1,
  },
  subtitle: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.subtitulo,
    marginTop: 2,
    lineHeight: 23,
    flexShrink: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: ds.cores.superficie,
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
