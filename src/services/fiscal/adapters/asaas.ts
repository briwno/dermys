import type {
  FiscalProviderAdapter,
  ParametrosEmissaoProvedor,
  ResultadoProvedorCancelamento,
  ResultadoProvedorEmissao,
} from './types';
import type { PerfilFiscal } from '@/types/fiscal';

/**
 * Adaptador de integração com Asaas (NFS-e & Split)
 * Documentação: https://docs.asaas.com/reference/invoices
 */
export class AsaasFiscalProvider implements FiscalProviderAdapter {
  readonly nome = 'Asaas NFS-e';
  readonly codigo = 'asaas';

  private getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
    return ambiente === 'producao'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  async emitirNfse(params: ParametrosEmissaoProvedor): Promise<ResultadoProvedorEmissao> {
    const apiKey = params.perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(params.perfilFiscal.provedor_ambiente);

    if (!apiKey) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: 'API Key do Asaas não configurada.',
      };
    }

    const payload = {
      serviceDescription: params.descricaoServico,
      observations: `NFS-e gerada via Dermys Tattoo Platform - CNAE ${params.cnae}`,
      value: params.valorServico,
      deductions: params.valorDeducoes || 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      municipalServiceCode: params.codigoTributacaoMunicipio || '06.01',
      municipalServiceDescription: 'Serviços de tatuagem, colocação de piercing e afins',
      taxes: {
        retainIss: false,
        iss: params.aliquotaIss || 0,
      },
    };

    try {
      const response = await fetch(`${baseUrl}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          sucesso: false,
          status: 'REJEITADA',
          numeroDocumento: '',
          codigoVerificacao: '',
          provedorId: '',
          mensagemErro: data.errors?.[0]?.description || 'Erro ao gerar nota no Asaas',
          respostaBruta: data,
        };
      }

      const id = data.id;
      const isAut = data.status === 'AUTHORIZED';
      return {
        sucesso: true,
        status: isAut ? 'AUTORIZADA' : 'PROCESSANDO',
        numeroDocumento: data.number || id,
        codigoVerificacao: data.verificationCode || '',
        provedorId: id,
        urlPdf: data.pdfUrl,
        urlXml: data.xmlUrl,
        respostaBruta: data,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: err.message || 'Falha de conexão com Asaas',
      };
    }
  }

  async consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/invoices/${provedorId}`, {
      headers: { access_token: apiKey || '' },
    });
    const data = await response.json();

    const isAut = data.status === 'AUTHORIZED';
    const isErr = data.status === 'ERROR';

    return {
      sucesso: isAut,
      status: isAut ? 'AUTORIZADA' : isErr ? 'REJEITADA' : 'PROCESSANDO',
      numeroDocumento: data.number || provedorId,
      codigoVerificacao: data.verificationCode || '',
      provedorId,
      urlPdf: data.pdfUrl,
      urlXml: data.xmlUrl,
      mensagemErro: isErr ? data.errorMessage : undefined,
      respostaBruta: data,
    };
  }

  async cancelarNfse(provedorId: string, motivo: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorCancelamento> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/invoices/${provedorId}/cancel`, {
      method: 'POST',
      headers: { access_token: apiKey || '' },
    });

    const data = await response.json();
    return {
      sucesso: response.ok,
      status: response.ok ? 'CANCELADA' : 'AUTORIZADA',
      mensagem: data.status,
      respostaBruta: data,
    };
  }

  async obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/invoices/${provedorId}/pdf`;
  }

  async obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/invoices/${provedorId}/xml`;
  }
}
