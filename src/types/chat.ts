export interface MensagemChat {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  criado_em: string;
  status_envio?: 'enviando' | 'enviado' | 'erro';
}

export interface ConversaResumo {
  contato_id: string;
  nome: string;
  foto_url?: string;
  tipo_perfil: 'cliente' | 'artista';
  nome_estudio?: string;
  estilo_principal?: string;
  cidade?: string;
  ultima_mensagem: string;
  data_ultima_mensagem: string;
  nao_lidas: number;
}
