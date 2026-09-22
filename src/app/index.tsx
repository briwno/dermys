import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';

import { BottomNav, type BottomNavTab } from '@/components/bottom-nav';
import {
  DebugFloatingButton,
  DebugMenuModal,
  DebugProvider,
  DeviceFrameWrapper,
} from '@/components/debug';
import { USAR_MOCK_AUTH } from '@/constants/feature-flags';
import { processarRetornoOAuthUrl } from '@/services/auth-oauth';
import { supabase } from '@/services/supabase';
import { DashboardArtista } from '@/telas/artist-dashboard';
import { TelaAutenticacao, type SessaoAuthInfo } from '@/telas/auth-screen';
import { DashboardCliente } from '@/telas/client-dashboard';
import { normalizarPerfil, verificarStatusPerfil, type PerfilUsuario } from '@/types/auth';

export default function TelaInicial() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [sessaoAuth, setSessaoAuth] = useState<SessaoAuthInfo | null>(null);
  const [dadosIncompletos, setDadosIncompletos] = useState<Partial<PerfilUsuario> | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [inicializando, setInicializando] = useState(true);

  const carregarPerfilUsuario = async (userId: string, authUser?: any) => {
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const status = verificarStatusPerfil(dbProfile, dbProfile?.tipo_perfil);

      if (dbProfile && status.completo) {
        const norm = normalizarPerfil(dbProfile);
        setPerfil(norm);
        setSessaoAuth(null);
        setDadosIncompletos(null);
        if (norm.tipo_perfil === 'artista' || norm.role === 'artista') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('home');
        }
        return norm;
      }

      // Perfil inexistente ou com campos obrigatórios pendentes
      setPerfil(null);
      setDadosIncompletos(dbProfile || null);

      const emailFinal = authUser?.email || dbProfile?.email || '';
      const nomeFinal =
        authUser?.user_metadata?.full_name ||
        authUser?.user_metadata?.name ||
        dbProfile?.nome_exibicao ||
        '';
      const fotoFinal =
        authUser?.user_metadata?.avatar_url ||
        authUser?.user_metadata?.picture ||
        dbProfile?.foto_url ||
        '';

      setSessaoAuth({
        id: userId,
        email: emailFinal,
        nome: nomeFinal,
        fotoUrl: fotoFinal,
      });

      return null;
    } catch {
      // silencioso
    }
    return null;
  };

  useEffect(() => {
    let montado = true;

    async function processarUrlInicial() {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && montado) {
          const user = await processarRetornoOAuthUrl(initialUrl);
          if (user) {
            await carregarPerfilUsuario(user.id, user);
          }
        }
      } catch {
        // silencioso
      }
    }

    async function verificarSessao() {
      try {
        if (!USAR_MOCK_AUTH) {
          await processarUrlInicial();

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && montado) {
            await carregarPerfilUsuario(session.user.id, session.user);
          }
        }
      } catch {
        // silencioso
      } finally {
        if (montado) setInicializando(false);
      }
    }

    verificarSessao();

    // Listener de deep links enquanto o app estiver em execução
    const linkingSub = Linking.addEventListener('url', async ({ url }) => {
      if (url && montado) {
        try {
          const user = await processarRetornoOAuthUrl(url);
          if (user && montado) {
            await carregarPerfilUsuario(user.id, user);
          }
        } catch {
          // silencioso
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (session?.user && montado) {
        await carregarPerfilUsuario(session.user.id, session.user);
      } else if (evento === 'SIGNED_OUT' && montado) {
        setPerfil(null);
        setSessaoAuth(null);
        setDadosIncompletos(null);
        setActiveTab('home');
      }
    });

    return () => {
      montado = false;
      linkingSub.remove();
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginComplete = (dados: PerfilUsuario) => {
    const norm = normalizarPerfil(dados);
    setPerfil(norm);
    setSessaoAuth(null);
    setDadosIncompletos(null);
    if (norm.role === 'artista' || norm.tipoPerfil === 'artista') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('home');
    }
  };

  const encerrarSessao = async () => {
    setSaindo(true);

    try {
      if (!USAR_MOCK_AUTH) {
        await supabase.auth.signOut();
      }
      setPerfil(null);
      setSessaoAuth(null);
      setDadosIncompletos(null);
      setActiveTab('home');
    } finally {
      setSaindo(false);
    }
  };

  const tipoPerfilAtual =
    perfil?.role === 'artista' || perfil?.tipo_perfil === 'artista' ? 'artista' : 'cliente';

  const renderConteudo = () => {
    if (inicializando) {
      return (
        <View style={styles.container}>
          <ActivityIndicator color="#f3c21a" size="large" />
        </View>
      );
    }

    if (!perfil) {
      return (
        <TelaAutenticacao
          onComplete={handleLoginComplete}
          sessaoAuth={sessaoAuth}
          dadosIncompletos={dadosIncompletos}
          onLogout={encerrarSessao}
        />
      );
    }

    if (saindo) {
      return (
        <View style={styles.container}>
          <ActivityIndicator color="#f3c21a" size="large" />
        </View>
      );
    }

    const renderDashboard = () => {
      if (tipoPerfilAtual === 'artista') {
        return <DashboardArtista perfil={perfil} onLogout={encerrarSessao} activeTab={activeTab} />;
      }

      return (
        <DashboardCliente
          perfil={perfil}
          onLogout={encerrarSessao}
          activeTab={activeTab}
          onNavegarAba={setActiveTab}
        />
      );
    };

    return (
      <View style={styles.shell}>
        <View style={styles.content}>{renderDashboard()}</View>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role={tipoPerfilAtual} />
      </View>
    );
  };

  return (
    <DebugProvider
      onSetPerfil={setPerfil}
      onSetActiveTab={setActiveTab}
      perfilAtual={perfil}
      activeTab={activeTab}
    >
      <DeviceFrameWrapper>
        {renderConteudo()}
        <DebugMenuModal />
      </DeviceFrameWrapper>
    </DebugProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070707',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    paddingBottom: 76,
  },
});

