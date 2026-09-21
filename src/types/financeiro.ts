export type TipoTransacao = 'SINAL' | 'PAGAMENTO_FINAL' | 'ESTORNO' | 'TAXA_PLATAFORMA';

export type StatusTransacao = 'PENDENTE' | 'APROVADO' | 'CUSTODIA' | 'LIBERADO' | 'CANCELADO';

export type RegimeTributario = 'MEI' | 'SIMPLES' | 'AUTONOMO_PF';

export type MetodoPagamento = 'pix' | 'cartao' | 'dinheiro';

export interface TransacaoFinanceira {
  id: string;
  agendamento_id?: string;
  artista_id: string;
  cliente_id?: string;
  tipo: TipoTransacao;
  valor_bruto: number;
  taxa_mercado_pago: number;
  valor_liquido: number;
  status: StatusTransacao;
  forma_pagamento: MetodoPagamento;
  mercado_pago_payment_id?: string;
  descricao?: string;
  recibo_fiscal_id?: string;
  imposto_estimado: number;
  criado_em: string;
  cliente_nome?: string;
  artista_nome?: string;
}

export interface ReciboFiscal {
  numeroRecibo: string;
  dataEmissao: string;
  agendamentoId: string;
  artistaNome: string;
  artistaDocumento: string;
  artistaEstudio: string;
  clienteNome: string;
  clienteDocumento?: string;
  descricaoServico: string;
  estilo: string;
  valorSinal: number;
  valorFinal: number;
  valorTotal: number;
  formaPagamento: string;
  codigoAutenticacao: string;
  regimeTributario: RegimeTributario;
  tributosEstimados: number;
}

export interface ResumoFinanceiroArtista {
  saldoDisponivel: number;
  saldoEmCustodia: number;
  faturamentoMes: number;
  totalTaxas: number;
  faturamentoLiquido: number;
  totalAtendimentosMes: number;
  limiteAnualMei: number;
  faturamentoAnualAcumulado: number;
  porcentagemTetoMei: number;
}

export interface DadosCobrancaMercadoPago {
  paymentId: string;
  qrCodeBase64?: string;
  qrCodePayload: string; // Copia e Cola EMV
  valor: number;
  status: 'pending' | 'approved' | 'rejected';
  expiraEm: string;
  descricao: string;
}
