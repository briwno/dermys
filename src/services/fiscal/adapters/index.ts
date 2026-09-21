import { AsaasFiscalProvider } from './asaas';
import { FocusNFeProvider } from './focus-nfe';
import { NuvemFiscalProvider } from './nuvemfiscal';
import { PlugNotasProvider } from './plugnotas';
import { SimuladoFiscalProvider } from './simulado';
import type { FiscalProviderAdapter } from './types';
import type { ProvedorFiscalTipo } from '@/types/fiscal';

export * from './types';
export * from './simulado';
export * from './focus-nfe';
export * from './plugnotas';
export * from './nuvemfiscal';
export * from './asaas';

const provedoresInstanciados: Partial<Record<ProvedorFiscalTipo, FiscalProviderAdapter>> = {
  simulado: new SimuladoFiscalProvider(),
  focus_nfe: new FocusNFeProvider(),
  plugnotas: new PlugNotasProvider(),
  nuvemfiscal: new NuvemFiscalProvider(),
  asaas: new AsaasFiscalProvider(),
  padrao_nacional: new SimuladoFiscalProvider(), // Padrão nacional usa simulador com fallback
};

export function obterAdaptadorFiscal(tipo: ProvedorFiscalTipo = 'simulado'): FiscalProviderAdapter {
  const adaptador = provedoresInstanciados[tipo];
  if (!adaptador) {
    return provedoresInstanciados.simulado!;
  }
  return adaptador;
}
