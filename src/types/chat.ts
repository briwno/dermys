export type TipoCardMensagem =
  | 'texto'
  | 'briefing'
  | 'quote'
  | 'deposit_confirmed'
  | 'anamnese_card';

export interface CardBriefingPayload {
  agendamentoId?: string;
  referenciasUrls: string[];
  fotoLocalCorpoUrl?: string;
  localCorpo: string;
  tamanhoCm: string;
  tamanhoNumericoCm?: number;
  descricao: string;
  disponibilidadePreferencial: string;
  estilo?: string;
  flashTitulo?: string;
  flashImagemUrl?: string;
  valorEstimadoBase?: number;
}

export interface CardQuotePayload {
  agendamentoId: string;
  valorTotal: number;
  duracaoEstimada: string;
  turnoRecomendado?: string;
  valorSinal: number;
  observacoes?: string;
  statusProposta: 'pendente' | 'aceita' | 'recusada' | 'expirada';
}

export interface CardDepositPayload {
  agendamentoId: string;
  valorSinal: number;
  dataHorarioFormatada: string;
  turnoNome: string;
  protocoloReserva: string;
}

export interface CardAnamnesePayload {
  agendamentoId: string;
  clienteNome?: string;
  statusFicha: 'pendente' | 'preenchida' | 'com_alerta';
  temAlertaSaude?: boolean;
}

export interface MensagemChat {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  criado_em: string;
  status_envio?: 'enviando' | 'enviado' | 'erro';
  tipo_mensagem?: TipoCardMensagem;
  card_payload?:
    | CardBriefingPayload
    | CardQuotePayload
    | CardDepositPayload
    | CardAnamnesePayload;
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
  agendamento_ativo_id?: string;
}
