import type {
  FiscalProviderAdapter,
  ParametrosEmissaoProvedor,
  ResultadoProvedorCancelamento,
  ResultadoProvedorEmissao,
} from './types';
import type { PerfilFiscal } from '@/types/fiscal';

/**
 * Adaptador de integração com Nuvem Fiscal
 * Documentação: https://dev.nuvemfiscal.com.br/docs/
 */
export class NuvemFiscalProvider implements FiscalProviderAdapter {
  readonly nome = 'Nuvem Fiscal';
  readonly codigo = 'nuvemfiscal';

  private getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
    return ambiente === 'producao'
      ? 'https://api.nuvemfiscal.com.br/v2'
      : 'https://api.sandbox.nuvemfiscal.com.br/v2';
  }

  async emitirNfse(params: ParametrosEmissaoProvedor): Promise<ResultadoProvedorEmissao> {
    const token = params.perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(params.perfilFiscal.provedor_ambiente);

    if (!token) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: 'Token Nuvem Fiscal não configurado.',
      };
    }

    const payload = {
      prestador: {
        cpf_cnpj: params.prestador.cpfCnpj.replace(/\D/g, ''),
        inscricao_municipal: params.prestador.inscricaoMunicipal?.replace(/\D/g, ''),
      },
      tomador: {
        cpf_cnpj: params.tomador.cpfCnpj?.replace(/\D/g, '') || '',
        nome_razao_social: params.tomador.nome,
        email: params.tomador.email,
        telefone: params.tomador.telefone?.replace(/\D/g, ''),
      },
      servico: {
        codigo_tributacao_municipio: params.codigoTributacaoMunicipio || '06.01',
        discriminacao: params.descricaoServico,
        codigo_cnae: params.cnae.replace(/\D/g, ''),
        valores: {
          valor_servicos: params.valorServico,
          valor_descontos: params.valorDeducoes || 0,
          aliquota_iss: params.aliquotaIss || 0,
        },
      },
      ambiente: params.perfilFiscal.provedor_ambiente === 'producao' ? 'producao' : 'homologacao',
    };

    try {
      const response = await fetch(`${baseUrl}/nfse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
          mensagemErro: data.error?.message || 'Erro de emissão na Nuvem Fiscal',
          respostaBruta: data,
        };
      }

      const id = data.id || `NV-${Date.now()}`;
      return {
        sucesso: true,
        status: data.status === 'autorizada' ? 'AUTORIZADA' : 'PROCESSANDO',
        numeroDocumento: data.numero || id,
        codigoVerificacao: data.codigo_verificacao || '',
        provedorId: id,
        urlPdf: `${baseUrl}/nfse/${id}/pdf`,
        urlXml: `${baseUrl}/nfse/${id}/xml`,
        respostaBruta: data,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: err.message || 'Falha de comunicação com Nuvem Fiscal',
      };
    }
  }

  async consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao> {
    const token = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/nfse/${provedorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    const isAut = data.status === 'autorizada';
    const isRej = data.status === 'erro' || data.status === 'rejeitada';

    return {
      sucesso: isAut,
      status: isAut ? 'AUTORIZADA' : isRej ? 'REJEITADA' : 'PROCESSANDO',
      numeroDocumento: data.numero || provedorId,
      codigoVerificacao: data.codigo_verificacao || '',
      provedorId,
      urlPdf: `${baseUrl}/nfse/${provedorId}/pdf`,
      urlXml: `${baseUrl}/nfse/${provedorId}/xml`,
      mensagemErro: isRej ? JSON.stringify(data.mensagens) : undefined,
      respostaBruta: data,
    };
  }

  async cancelarNfse(provedorId: string, motivo: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorCancelamento> {
    const token = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/nfse/${provedorId}/cancelamento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ motivo }),
    });

    const data = await response.json();
    return {
      sucesso: response.ok,
      status: response.ok ? 'CANCELADA' : 'AUTORIZADA',
      mensagem: data.mensagem || 'Cancelamento solicitado',
      respostaBruta: data,
    };
  }

  async obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/${provedorId}/pdf`;
  }

  async obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/${provedorId}/xml`;
  }
}
