import { Fragment, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';

import { AnimatedScreenTransition } from '@/components/ui/animated-screen-transition';
import { BottomNav, type BottomNavTab } from '@/components/bottom-nav';
import {
  DebugFloatingButton,
  DebugMenuModal,
  DebugProvider,
  DebugRefreshBoundary,
  DeviceFrameWrapper,
} from '@/components/debug';
import { processarRetornoOAuthUrl } from '@/services/auth-oauth';
import { supabase } from '@/services/supabase';
import { deveCarregarPerfilAuth, obterPersonaTeste, obterRevisaoPersona, restaurarPersonaTeste, selecionarPersonaTeste } from '@/services/persona-teste';
import { PERSONAS_TESTE } from '@/components/debug/types';
import { DashboardArtista } from '@/telas/artist-dashboard';
import { TelaAutenticacao, type SessaoAuthInfo } from '@/telas/auth-screen';
import { DashboardCliente } from '@/telas/client-dashboard';
import { normalizarPerfil, verificarStatusPerfil, type PerfilUsuario } from '@/types/auth';
import { createThemedStyles, tc, useTheme } from '@/theme';

export default function TelaInicial() {
  // Assina o tema. Como o React Compiler memoiza o JSX, a árvore de conteúdo é
  // remontada (key={modo}) ao alternar o modo para que todos os estilos sejam reaplicados.
  const { modo, modoClaro } = useTheme();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [sessaoAuth, setSessaoAuth] = useState<SessaoAuthInfo | null>(null);
  const [dadosIncompletos, setDadosIncompletos] = useState<Partial<PerfilUsuario> | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [chatContatoId, setChatContatoId] = useState<string | undefined>(undefined);
  const [inicializando, setInicializando] = useState(true);
  const usuarioAuthCarregado = useRef<string | null>(null);
  const versaoCarregamento = useRef(0);

  const handleNavegarAba = (tab: BottomNavTab, contatoId?: string) => {
    setChatContatoId(contatoId);
    setActiveTab(tab);
  };

  const carregarPerfilUsuario = async (userId: string, authUser?: any) => {
    if (obterPersonaTeste()) return null;
    const versao = ++versaoCarregamento.current;
    const revisao = obterRevisaoPersona();
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (versao !== versaoCarregamento.current || revisao !== obterRevisaoPersona() || obterPersonaTeste()) return null;
      const mudouUsuario = usuarioAuthCarregado.current !== userId;
      usuarioAuthCarregado.current = userId;

      const status = verificarStatusPerfil(dbProfile, dbProfile?.tipo_perfil);

      if (dbProfile && status.completo) {
        const norm = normalizarPerfil(dbProfile);
        setPerfil(norm);
        setSessaoAuth(null);
        setDadosIncompletos(null);
        if (mudouUsuario) {
          setActiveTab(norm.tipo_perfil === 'artista' || norm.role === 'artista' ? 'dashboard' : 'home');
        }
        return norm;
      }

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
      return null;
    }
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
        // ignora se URL inicial for inválida
      }
    }

    async function verificarSessao() {
      try {
        const personaId = await restaurarPersonaTeste(PERSONAS_TESTE.map((p) => p.id));
        if (personaId && montado) {
          const revisao = obterRevisaoPersona();
          const persona = PERSONAS_TESTE.find((p) => p.id === personaId)!;
          const { data } = await supabase.from('profiles').select('*').eq('id', personaId).maybeSingle();
          if (!montado || revisao !== obterRevisaoPersona()) return;
          const restaurado = normalizarPerfil(data || {
            id: persona.id, email: persona.email, nome_exibicao: persona.nome,
            tipo_perfil: persona.tipo, foto_url: persona.avatarUrl, cidade: persona.cidade, nome_estudio: persona.estudio,
          });
          setPerfil(restaurado);
          setActiveTab(persona.tipo === 'artista' ? 'dashboard' : 'home');
          return;
        }
        await processarUrlInicial();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && montado) {
          await carregarPerfilUsuario(session.user.id, session.user);
        }
      } catch {
        // prossegue sem sessão ativa
      } finally {
        if (montado) setInicializando(false);
      }
    }

    verificarSessao();

    const linkingSub = Linking.addEventListener('url', async ({ url }) => {
      if (url && montado) {
        try {
          const user = await processarRetornoOAuthUrl(url);
          if (user && montado) {
            await carregarPerfilUsuario(user.id, user);
          }
        } catch {
          // falha de deep link silenciosa
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!montado || obterPersonaTeste()) return;
      if (evento === 'SIGNED_OUT') {
        ++versaoCarregamento.current;
        usuarioAuthCarregado.current = null;
        setPerfil(null);
        setSessaoAuth(null);
        setDadosIncompletos(null);
        setActiveTab('home');
      } else if (session?.user && deveCarregarPerfilAuth(evento, session.user.id, usuarioAuthCarregado.current)) {
        // Não faça chamadas ao cliente Supabase dentro do lock do callback de Auth.
        setTimeout(() => {
          if (montado && !obterPersonaTeste()) void carregarPerfilUsuario(session.user.id, session.user);
        }, 0);
      }
    });

    return () => {
      montado = false;
      linkingSub.remove();
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginComplete = (dados: PerfilUsuario) => {
    ++versaoCarregamento.current;
    void selecionarPersonaTeste(null).catch(() => {});
    usuarioAuthCarregado.current = dados.id || dados.uid || null;
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
      await selecionarPersonaTeste(null);
      ++versaoCarregamento.current;
      usuarioAuthCarregado.current = null;
      await supabase.auth.signOut();
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
          <ActivityIndicator color={tc('#f3c21a')} size="large" />
        </View>
      );
    }

    if (!perfil) {
      return (
        <AnimatedScreenTransition screenKey="auth" type="fade">
          <TelaAutenticacao
            onComplete={handleLoginComplete}
            sessaoAuth={sessaoAuth}
            dadosIncompletos={dadosIncompletos}
            onLogout={encerrarSessao}
          />
        </AnimatedScreenTransition>
      );
    }

    if (saindo) {
      return (
        <View style={styles.container}>
          <ActivityIndicator color={tc('#f3c21a')} size="large" />
        </View>
      );
    }

    const handleAtualizarPerfil = (novoPerfil: PerfilUsuario) => {
      setPerfil(novoPerfil);
    };

    const renderDashboard = () => {
      if (tipoPerfilAtual === 'artista') {
        return (
          <DashboardArtista
            key={perfil.id || perfil.uid}
            perfil={perfil}
            onLogout={encerrarSessao}
            activeTab={activeTab}
            chatContatoId={chatContatoId}
            onNavegarAba={handleNavegarAba}
            onAtualizarPerfil={handleAtualizarPerfil}
          />
        );
      }

      return (
        <DashboardCliente
          key={perfil.id || perfil.uid}
          perfil={perfil}
          onLogout={encerrarSessao}
          activeTab={activeTab}
          chatContatoId={chatContatoId}
          onNavegarAba={handleNavegarAba}
          onAtualizarPerfil={handleAtualizarPerfil}
        />
      );
    };

    return (
      <View style={styles.shell}>
        <View style={styles.content}>{renderDashboard()}</View>
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setChatContatoId(undefined);
            setActiveTab(tab);
          }}
          role={tipoPerfilAtual}
        />
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
        <StatusBar style={modoClaro ? 'dark' : 'light'} />
        <DebugRefreshBoundary><Fragment key={modo}>{renderConteudo()}</Fragment></DebugRefreshBoundary>
        <DebugMenuModal />
      </DeviceFrameWrapper>
    </DebugProvider>
  );
}

const styles = createThemedStyles({
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

