import type {
  FiscalProviderAdapter,
  ParametrosEmissaoProvedor,
  ResultadoProvedorCancelamento,
  ResultadoProvedorEmissao,
} from './types';
import type { PerfilFiscal } from '@/types/fiscal';

export class SimuladoFiscalProvider implements FiscalProviderAdapter {
  readonly nome = 'Simulador Fiscal Dermys';
  readonly codigo = 'simulado';

  async emitirNfse(params: ParametrosEmissaoProvedor): Promise<ResultadoProvedorEmissao> {
    // Simula um delay realista de processamento de prefeitura (300ms)
    await new Promise((res) => setTimeout(res, 300));

    const ano = new Date().getFullYear();
    const sequencial = Math.floor(100000 + Math.random() * 900000);
    const numeroDocumento = `${ano}${sequencial}`;
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const codigoVerificacao = `DERM-${hash}-${numeroDocumento.slice(-4)}`;
    const provedorId = `SIM-${Date.now()}-${sequencial}`;

    // Gera URLs simuladas com parâmetros completos
    const urlPdf = `https://dermys.app/api/fiscal/danfse/${numeroDocumento}?cod=${codigoVerificacao}`;
    const urlXml = `https://dermys.app/api/fiscal/xml/${numeroDocumento}?cod=${codigoVerificacao}`;

    return {
      sucesso: true,
      status: 'AUTORIZADA',
      numeroDocumento,
      codigoVerificacao,
      provedorId,
      urlPdf,
      urlXml,
      respostaBruta: {
        status: 'AUTORIZADA',
        mensagem: 'NFS-e autorizada com sucesso pelo ambiente de simulação Dermys.',
        emitidoEm: new Date().toISOString(),
        protocolo: `PROT-${Date.now()}`,
      },
    };
  }

  async consultarStatus(provedorId: string, perfilFiscal: PerfilFiscal): Promise<ResultadoProvedorEmissao> {
    return {
      sucesso: true,
      status: 'AUTORIZADA',
      numeroDocumento: provedorId.replace('SIM-', '2026'),
      codigoVerificacao: `DERM-AUTH-${provedorId.slice(-6)}`,
      provedorId,
      urlPdf: `https://dermys.app/api/fiscal/danfse/${provedorId}`,
      urlXml: `https://dermys.app/api/fiscal/xml/${provedorId}`,
    };
  }

  async cancelarNfse(
    provedorId: string,
    motivo: string,
    perfilFiscal: PerfilFiscal
  ): Promise<ResultadoProvedorCancelamento> {
    await new Promise((res) => setTimeout(res, 200));
    return {
      sucesso: true,
      status: 'CANCELADA',
      mensagem: `NFS-e ${provedorId} cancelada com sucesso. Motivo: ${motivo}`,
      respostaBruta: {
        canceladoEm: new Date().toISOString(),
        motivo,
      },
    };
  }

  async obterPdfUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    return `https://dermys.app/api/fiscal/danfse/${provedorId}`;
  }

  async obterXmlUrl(provedorId: string, perfilFiscal: PerfilFiscal): Promise<string | null> {
    return `https://dermys.app/api/fiscal/xml/${provedorId}`;
  }
}
