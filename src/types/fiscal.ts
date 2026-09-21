export type TipoPessoa = 'PJ' | 'PF';

export type RegimeTributarioFiscal =
  | 'MEI'
  | 'SIMPLES_NACIONAL'
  | 'LUCRO_PRESUMIDO'
  | 'AUTONOMO_PF';

export type StatusNotaFiscal =
  | 'PROCESSANDO'
  | 'AUTORIZADA'
  | 'REJEITADA'
  | 'CANCELADA';

export type TipoDocumentoFiscal =
  | 'NFSE'
  | 'RECIBO_SIMPLES'
  | 'TAXA_INTERMEDIACAO';

export type ProvedorFiscalTipo =
  | 'simulado'
  | 'focus_nfe'
  | 'plugnotas'
  | 'nuvemfiscal'
  | 'asaas'
  | 'padrao_nacional';

export type AmbienteFiscal = 'homologacao' | 'producao';

export interface EnderecoFiscal {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep?: string;
}

export interface DadosTomador {
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: EnderecoFiscal;
}

export interface DadosPrestador {
  razaoSocial: string;
  nomeFantasia?: string;
  cpfCnpj: string;
  inscricaoMunicipal?: string;
  cnae: string;
  codigoTributacaoMunicipio: string;
  aliquotaIss?: number;
  endereco?: EnderecoFiscal;
}

export interface DadosSplitFiscal {
  valorServicoTotal: number;
  valorBrutoArtista: number;
  taxaPlataformaPercent: number;
  valorTaxaPlataforma: number;
  taxaEstudioPercent?: number;
  valorTaxaEstudio?: number;
  valorLiquidoArtista: number;
  gateway: 'mercadopago' | 'asaas' | 'pagarme' | 'efi' | 'direto';
  identificadorSplit?: string;
}

export interface PerfilFiscal {
  id?: string;
  artist_id: string;
  tipo_pessoa: TipoPessoa;
  regime_tributario: RegimeTributarioFiscal;
  cpf_cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  inscricao_municipal?: string;
  cnae_padrao: string;
  codigo_tributacao_municipio: string;
  aliquota_iss: number;
  provedor_emissao: ProvedorFiscalTipo;
  provedor_api_key?: string;
  provedor_ambiente: AmbienteFiscal;
  certificado_a1_url?: string;
  certificado_a1_validade?: string;
  emissao_automatica: boolean;
  email_notificacao_fiscal?: string;
  telefone_notificacao_fiscal?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export interface NotaFiscalRegistro {
  id: string;
  fiscal_profile_id?: string;
  artista_id: string;
  cliente_id?: string;
  agendamento_id?: string;
  transacao_id?: string;
  tipo_documento: TipoDocumentoFiscal;
  numero_documento: string;
  codigo_verificacao: string;
  status: StatusNotaFiscal;
  valor_servicos: number;
  valor_deducoes: number;
  valor_iss: number;
  aliquota_iss: number;
  valor_liquido: number;
  descricao_servico: string;
  cnae: string;
  codigo_tributacao_municipio: string;
  dados_tomador: DadosTomador;
  dados_prestador: DadosPrestador;
  dados_split?: DadosSplitFiscal;
  url_pdf?: string;
  url_xml?: string;
  mensagem_erro?: string;
  provedor: ProvedorFiscalTipo;
  provedor_id?: string;
  emitida_em?: string;
  cancelada_em?: string;
  criado_em: string;
  atualizado_em?: string;
}

export type FaixaAlertaTetoMei = 'NORMAL' | 'ALERTA_70' | 'ALERTA_85' | 'CRITICO_100';

export interface MetricasFiscaisArtista {
  tetoMeiAnual: number; // R$ 81.000,00
  faturamentoAcumuladoAno: number;
  faturamentoMes: number;
  percentualTetoMei: number;
  faixaAlerta: FaixaAlertaTetoMei;
  saldoRestanteTeto: number;
  totalNotasEmitidas: number;
  totalAutorizadas: number;
  totalProcessando: number;
  totalRejeitadas: number;
  totalCanceladas: number;
}

export interface ItemRelatorioMensalDASN {
  mesNumero: number;
  mesNome: string;
  receitaBrutaServicos: number;
  receitaComRetencao: number;
  deducoes: number;
  receitaLiquida: number;
  totalNotas: number;
}

export interface RelatorioDASN {
  ano: number;
  razaoSocial: string;
  cnpj: string;
  tetoAnual: number;
  faturamentoTotalAno: number;
  percentualUtilizado: number;
  meses: ItemRelatorioMensalDASN[];
  geradoEm: string;
}

export interface SolicitacaoEmissaoNfse {
  artistaId: string;
  clienteId?: string;
  agendamentoId?: string;
  transacaoId?: string;
  tipoDocumento?: TipoDocumentoFiscal;
  valorServico: number;
  descricaoServico: string;
  cnae?: string;
  codigoTributacao?: string;
  tomador: DadosTomador;
  split?: DadosSplitFiscal;
  aliquotaIss?: number;
}
