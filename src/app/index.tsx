import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { USAR_MOCK_AUTH } from '@/constants/feature-flags';
import { supabase } from '@/services/supabase';
import { DashboardArtista } from '@/telas/artist-dashboard';
import { TelaAutenticacao } from '@/telas/auth-screen';
import { DashboardCliente } from '@/telas/client-dashboard';
import type { PerfilUsuario } from '@/types/auth';

export default function TelaInicial() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [saindo, setSaindo] = useState(false);

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
        <ActivityIndicator color="#B7FD58" size="large" />
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

  if (tipoPerfilAtual === 'artista') {
    return <DashboardArtista perfil={perfil} onLogout={encerrarSessao} />;
  }

  return <DashboardCliente perfil={perfil} onLogout={encerrarSessao} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070707',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
