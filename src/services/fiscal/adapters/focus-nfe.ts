import type {
  FiscalProviderAdapter,
  ParametrosEmissaoProvedor,
  ResultadoProvedorCancelamento,
  ResultadoProvedorEmissao,
} from './types';
import type { PerfilFiscal } from '@/types/fiscal';

/**
 * Adaptador de integração com Focus NFe (API v2)
 * Documentação: https://focusnfe.com.br/doc/
 */
export class FocusNFeProvider implements FiscalProviderAdapter {
  readonly nome = 'Focus NFe';
  readonly codigo = 'focus_nfe';

  private getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
    return ambiente === 'producao'
      ? 'https://api.focusnfe.com.br/v2'
      : 'https://homologacao.focusnfe.com.br/v2';
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
        mensagemErro: 'Token de autenticação da Focus NFe não configurado.',
      };
    }

    const payload = {
      data_emissao: new Date().toISOString(),
      prestador: {
        cnpj: params.prestador.cpfCnpj.replace(/\D/g, ''),
        inscricao_municipal: params.prestador.inscricaoMunicipal?.replace(/\D/g, '') || '',
        codigo_municipio: params.prestador.codigoTributacaoMunicipio || '06.01',
      },
      tomador: {
        cpf: params.tomador.cpfCnpj?.replace(/\D/g, '') || '',
        razao_social: params.tomador.nome,
        email: params.tomador.email,
        telefone: params.tomador.telefone?.replace(/\D/g, ''),
      },
      servico: {
        aliquota: params.aliquotaIss || 0,
        discriminacao: params.descricaoServico,
        iss_retido: false,
        item_lista_servico: params.codigoTributacaoMunicipio || '06.01',
        codigo_cnae: params.cnae.replace(/\D/g, ''),
        valor_servicos: params.valorServico,
        valor_deducoes: params.valorDeducoes || 0,
      },
    };

    try {
      const refId = params.referenciaExternaId || `DERMYS-${Date.now()}`;
      const response = await fetch(`${baseUrl}/nfse?ref=${refId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${token}:`)}`,
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
          provedorId: refId,
          mensagemErro: data.mensagem || 'Erro ao processar NFS-e na Focus NFe',
          respostaBruta: data,
        };
      }

      return {
        sucesso: true,
        status: data.status === 'autorizado' ? 'AUTORIZADA' : 'PROCESSANDO',
        numeroDocumento: data.numero || refId,
        codigoVerificacao: data.codigo_verificacao || '',
        provedorId: refId,
        urlPdf: data.caminho_danfse || `${baseUrl}/nfse/${refId}.pdf`,
        urlXml: data.caminho_xml_nota_fiscal || `${baseUrl}/nfse/${refId}.xml`,
        respostaBruta: data,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: err.message || 'Falha de conexão com a API Focus NFe',
      };
    }
  }

  async consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao> {
    const token = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    if (!token) throw new Error('Token Focus NFe não informado');

    const response = await fetch(`${baseUrl}/nfse/${provedorId}`, {
      headers: { Authorization: `Basic ${btoa(`${token}:`)}` },
    });
    const data = await response.json();

    return {
      sucesso: response.ok && data.status === 'autorizado',
      status: data.status === 'autorizado' ? 'AUTORIZADA' : data.status === 'erro_autorizacao' ? 'REJEITADA' : 'PROCESSANDO',
      numeroDocumento: data.numero || provedorId,
      codigoVerificacao: data.codigo_verificacao || '',
      provedorId,
      urlPdf: data.caminho_danfse,
      urlXml: data.caminho_xml_nota_fiscal,
      mensagemErro: data.erros ? JSON.stringify(data.erros) : undefined,
      respostaBruta: data,
    };
  }

  async cancelarNfse(provedorId: string, motivo: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorCancelamento> {
    const token = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/nfse/${provedorId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${token}:`)}`,
      },
      body: JSON.stringify({ justificativa: motivo }),
    });

    const data = await response.json();
    return {
      sucesso: response.ok,
      status: response.ok ? 'CANCELADA' : 'AUTORIZADA',
      mensagem: data.mensagem || 'Cancelamento solicitado na Focus NFe',
      respostaBruta: data,
    };
  }

  async obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/${provedorId}.pdf`;
  }

  async obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/${provedorId}.xml`;
  }
}
