import type {
  FiscalProviderAdapter,
  ParametrosEmissaoProvedor,
  ResultadoProvedorCancelamento,
  ResultadoProvedorEmissao,
} from './types';
import type { PerfilFiscal } from '@/types/fiscal';

/**
 * Adaptador de integração com PlugNotas (TecnoSpeed)
 * Documentação: https://docs.plugnotas.com.br/
 */
export class PlugNotasProvider implements FiscalProviderAdapter {
  readonly nome = 'PlugNotas (TecnoSpeed)';
  readonly codigo = 'plugnotas';

  private getBaseUrl(ambiente: 'homologacao' | 'producao'): string {
    return ambiente === 'producao'
      ? 'https://api.plugnotas.com.br'
      : 'https://api.sandbox.plugnotas.com.br';
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
        mensagemErro: 'API Key do PlugNotas não configurada.',
      };
    }

    const payload = [
      {
        prestador: {
          cpfCnpj: params.prestador.cpfCnpj.replace(/\D/g, ''),
          inscricaoMunicipal: params.prestador.inscricaoMunicipal?.replace(/\D/g, ''),
        },
        tomador: {
          cpfCnpj: params.tomador.cpfCnpj?.replace(/\D/g, '') || '',
          razaoSocial: params.tomador.nome,
          email: params.tomador.email,
          telefone: params.tomador.telefone?.replace(/\D/g, ''),
        },
        servico: [
          {
            codigo: params.codigoTributacaoMunicipio || '06.01',
            codigoCnae: params.cnae.replace(/\D/g, ''),
            discriminacao: params.descricaoServico,
            valor: {
              servico: params.valorServico,
              descontoIncondicionado: params.valorDeducoes || 0,
              iss: {
                aliquota: params.aliquotaIss || 0,
              },
            },
          },
        ],
      },
    ];

    try {
      const response = await fetch(`${baseUrl}/nfse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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
          mensagemErro: data.message || 'Erro ao enviar NFS-e ao PlugNotas',
          respostaBruta: data,
        };
      }

      const protocol = data.protocol || data[0]?.id || `PN-${Date.now()}`;
      return {
        sucesso: true,
        status: 'PROCESSANDO',
        numeroDocumento: `PN-${protocol.slice(0, 8)}`,
        codigoVerificacao: '',
        provedorId: protocol,
        urlPdf: `${baseUrl}/nfse/pdf/${protocol}`,
        urlXml: `${baseUrl}/nfse/xml/${protocol}`,
        respostaBruta: data,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        status: 'REJEITADA',
        numeroDocumento: '',
        codigoVerificacao: '',
        provedorId: '',
        mensagemErro: err.message || 'Falha de comunicação com PlugNotas',
      };
    }
  }

  async consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/nfse/consultar/${provedorId}`, {
      headers: { 'x-api-key': apiKey || '' },
    });
    const data = await response.json();

    const isConcluida = data.situacao === 'CONCLUIDO';
    const isErro = data.situacao === 'ERRO';

    return {
      sucesso: isConcluida,
      status: isConcluida ? 'AUTORIZADA' : isErro ? 'REJEITADA' : 'PROCESSANDO',
      numeroDocumento: data.numeroNfse || provedorId,
      codigoVerificacao: data.codigoVerificacao || '',
      provedorId,
      urlPdf: `${baseUrl}/nfse/pdf/${provedorId}`,
      urlXml: `${baseUrl}/nfse/xml/${provedorId}`,
      mensagemErro: isErro ? JSON.stringify(data.mensagens) : undefined,
      respostaBruta: data,
    };
  }

  async cancelarNfse(provedorId: string, motivo: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorCancelamento> {
    const apiKey = perfilFiscal.provedor_api_key;
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);

    const response = await fetch(`${baseUrl}/nfse/cancelar/${provedorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
      },
      body: JSON.stringify({ motivo }),
    });

    const data = await response.json();
    return {
      sucesso: response.ok,
      status: response.ok ? 'CANCELADA' : 'AUTORIZADA',
      mensagem: data.message,
      respostaBruta: data,
    };
  }

  async obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/pdf/${provedorId}`;
  }

  async obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    const baseUrl = this.getBaseUrl(perfilFiscal.provedor_ambiente);
    return `${baseUrl}/nfse/xml/${provedorId}`;
  }
}
