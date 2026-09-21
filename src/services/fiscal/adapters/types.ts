import type {
  DadosPrestador,
  DadosTomador,
  NotaFiscalRegistro,
  PerfilFiscal,
  StatusNotaFiscal,
} from '@/types/fiscal';

export interface ParametrosEmissaoProvedor {
  perfilFiscal: PerfilFiscal;
  prestador: DadosPrestador;
  tomador: DadosTomador;
  valorServico: number;
  valorDeducoes?: number;
  aliquotaIss?: number;
  descricaoServico: string;
  cnae: string;
  codigoTributacaoMunicipio: string;
  numeroRps?: string;
  referenciaExternaId?: string;
}

export interface ResultadoProvedorEmissao {
  sucesso: boolean;
  status: StatusNotaFiscal;
  numeroDocumento: string;
  codigoVerificacao: string;
  provedorId: string;
  urlPdf?: string;
  urlXml?: string;
  mensagemErro?: string;
  respostaBruta?: any;
}

export interface ResultadoProvedorCancelamento {
  sucesso: boolean;
  status: StatusNotaFiscal;
  mensagem?: string;
  respostaBruta?: any;
}

export interface FiscalProviderAdapter {
  readonly nome: string;
  readonly codigo: string;

  emitirNfse(params: ParametrosEmissaoProvedor): Promise<ResultadoProvedorEmissao>;
  consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao>;
  cancelarNfse(provedorId: string, motivo: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorCancelamento>;
  obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null>;
  obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null>;
}
