import React from 'react';
import { PainelChatRealtime } from '@/components/chat/painel-chat-realtime';
import type { PerfilUsuario } from '@/types/auth';

interface ClienteMensagensTabProps {
  perfil?: PerfilUsuario;
  contatoInicialId?: string;
}

export function ClienteMensagensTab({ perfil, contatoInicialId }: ClienteMensagensTabProps) {
  // Fallback seguro caso perfil ainda não esteja injetado
  const perfilFinal = perfil || {
    id: '99999999-9999-9999-9999-999999999999',
    nome_exibicao: 'Mariana Costa',
    nomeExibicao: 'Mariana Costa',
    tipo_perfil: 'cliente',
    role: 'cliente',
    email: 'cliente.dermys@dermys.app',
  };

  return <PainelChatRealtime perfilAtual={perfilFinal} contatoInicialId={contatoInicialId} />;
}
