import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';

import { BottomNav, type BottomNavTab } from '@/components/bottom-nav';
import { USAR_MOCK_AUTH } from '@/constants/feature-flags';
import { processarRetornoOAuthUrl } from '@/services/auth-oauth';
import { supabase } from '@/services/supabase';
import { DashboardArtista } from '@/telas/artist-dashboard';
import { TelaAutenticacao } from '@/telas/auth-screen';
import { DashboardCliente } from '@/telas/client-dashboard';
import { normalizarPerfil, type PerfilUsuario } from '@/types/auth';

export default function TelaInicial() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [inicializando, setInicializando] = useState(true);

  const carregarPerfilUsuario = async (userId: string) => {
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbProfile) {
        const norm = normalizarPerfil(dbProfile);
        setPerfil(norm);
        if (norm.tipo_perfil === 'artista' || norm.role === 'artista') {
          setActiveTab('dashboard');
        }
        return norm;
      }
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
            await carregarPerfilUsuario(user.id);
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

          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && montado) {
            await carregarPerfilUsuario(session.user.id);
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
            await carregarPerfilUsuario(user.id);
          }
        } catch {
          // silencioso
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (evento, session) => {
      if (session?.user && montado) {
        await carregarPerfilUsuario(session.user.id);
      } else if (evento === 'SIGNED_OUT' && montado) {
        setPerfil(null);
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
      setActiveTab('home');
    } finally {
      setSaindo(false);
    }
  };

  if (inicializando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#f3c21a" size="large" />
      </View>
    );
  }

  if (!perfil) {
    return <TelaAutenticacao onComplete={handleLoginComplete} />;
  }

  if (saindo) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#f3c21a" size="large" />
      </View>
    );
  }

  const tipoPerfilAtual = perfil.role === 'artista' || perfil.tipo_perfil === 'artista' ? 'artista' : 'cliente';

  const renderDashboard = () => {
    if (tipoPerfilAtual === 'artista') {
      return <DashboardArtista perfil={perfil} onLogout={encerrarSessao} activeTab={activeTab} />;
    }

    return <DashboardCliente perfil={perfil} onLogout={encerrarSessao} activeTab={activeTab} />;
  };

  return (
    <View style={styles.shell}>
      <View style={styles.content}>{renderDashboard()}</View>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role={tipoPerfilAtual} />
    </View>
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
