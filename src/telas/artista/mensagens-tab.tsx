import React from 'react';
import { PainelChatRealtime } from '@/components/chat/painel-chat-realtime';
import type { PerfilUsuario } from '@/types/auth';

interface ArtistaMensagensTabProps {
  perfil?: PerfilUsuario;
}

export function ArtistaMensagensTab({ perfil }: ArtistaMensagensTabProps) {
  // Fallback seguro com o artista Camila Rossi caso não seja passado
  const perfilFinal = perfil || {
    id: '11111111-1111-1111-1111-111111111111',
    nome_exibicao: 'Camila Rossi',
    nomeExibicao: 'Camila Rossi',
    tipo_perfil: 'artista',
    role: 'artista',
    email: 'camila@dermys.app',
    nome_estudio: 'Aura Tatuaria & Botânica',
    estilo_principal: 'Fine Line / Botânica',
  };

  return <PainelChatRealtime perfilAtual={perfilFinal} />;
}
