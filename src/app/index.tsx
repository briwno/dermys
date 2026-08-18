import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BottomNav, type BottomNavTab } from '@/components/bottom-nav';
import { USAR_MOCK_AUTH } from '@/constants/feature-flags';
import { supabase } from '@/services/supabase';
import { DashboardArtista } from '@/telas/artist-dashboard';
import { TelaAutenticacao } from '@/telas/auth-screen';
import { DashboardCliente } from '@/telas/client-dashboard';
import type { PerfilUsuario } from '@/types/auth';

export default function TelaInicial() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');

  const encerrarSessao = async () => {
    setSaindo(true);

    try {
      if (!USAR_MOCK_AUTH) {
        await supabase.auth.signOut();
      }
      setPerfil(null);
    } finally {
      setSaindo(false);
    }
  };

  if (!perfil) {
    return <TelaAutenticacao onComplete={setPerfil} />;
  }

  if (saindo) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#f3c21a" size="large" />
      </View>
    );
  }

  let tipoPerfilAtual: 'cliente' | 'artista' = 'cliente';

  const perfilValido = (valor: string | undefined): valor is 'cliente' | 'artista' => {
    if (valor === 'cliente') {
      return true;
    }

    if (valor === 'artista') {
      return true;
    }

    return false;
  };

  if (perfilValido(perfil.tipoPerfil)) {
    tipoPerfilAtual = perfil.tipoPerfil;
  } else if (perfilValido(perfil.role)) {
    tipoPerfilAtual = perfil.role;
  }

  const renderDashboard = () => {
    if (tipoPerfilAtual === 'artista') {
      return <DashboardArtista perfil={perfil} onLogout={encerrarSessao} />;
    }

    return <DashboardCliente perfil={perfil} onLogout={encerrarSessao} />;
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
