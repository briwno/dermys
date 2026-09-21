import type { DadosSplitFiscal } from '@/types/fiscal';

export interface ParametrosCalculoSplit {
  valorTotal: number;
  taxaPlataformaPercent?: number; // Ex: 10%
  taxaEstudioPercent?: number; // Ex: 0% a 30% (se for guest spot ou estúdio parceiro)
  gateway?: 'mercadopago' | 'asaas' | 'pagarme' | 'efi' | 'direto';
  identificadorSplit?: string;
}

export interface ResultadoCalculoSplit {
  dadosSplit: DadosSplitFiscal;
  resumoFiscal: {
    nfseArtistaCliente: {
      tomador: string;
      prestador: string;
      descricao: string;
      valorBaseCalculo: number;
    };
    nfseIntermediacaoPlataforma: {
      tomador: string;
      prestador: string;
      descricao: string;
      valorBaseCalculo: number;
    };
    evitaBitributacao: boolean;
  };
}

/**
 * Motor de Cálculo de Split de Pagamento e Prevenção de Bitributação
 * 
 * Regra Fiscal Aplicada:
 * 1. O artista emite NFS-e para o cliente final sobre a totalidade do serviço artístico prestado.
 * 2. O Dermys (ou o estúdio parceiro) emite NFS-e de intermediação de negócios / corretagem de serviços
 *    contra o artista referente apenas ao percentual de taxa retido.
 * 3. Dessa forma, a plataforma não recolhe tributos sobre o valor bruto da tatuagem, mas unicamente
 *    sobre sua receita de comissão/intermediação.
 */
export function calcularSplitFiscal(params: ParametrosCalculoSplit): ResultadoCalculoSplit {
  const valorTotal = Number(params.valorTotal) || 0;
  const taxaPlatPercent = Number(params.taxaPlataformaPercent ?? 10);
  const taxaEstudioPercent = Number(params.taxaEstudioPercent ?? 0);
  const gateway = params.gateway || 'mercadopago';

  const valorTaxaPlataforma = Number(((valorTotal * taxaPlatPercent) / 100).toFixed(2));
  const valorTaxaEstudio = Number(((valorTotal * taxaEstudioPercent) / 100).toFixed(2));
  const valorLiquidoArtista = Number((valorTotal - valorTaxaPlataforma - valorTaxaEstudio).toFixed(2));

  const splitId =
    params.identificadorSplit ||
    `SPLIT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const dadosSplit: DadosSplitFiscal = {
    valorServicoTotal: valorTotal,
    valorBrutoArtista: valorTotal,
    taxaPlataformaPercent: taxaPlatPercent,
    valorTaxaPlataforma,
    taxaEstudioPercent,
    valorTaxaEstudio,
    valorLiquidoArtista,
    gateway,
    identificadorSplit: splitId,
  };

  return {
    dadosSplit,
    resumoFiscal: {
      nfseArtistaCliente: {
        tomador: 'Cliente Final',
        prestador: 'Artista / Tatuador (MEI/PJ/PF)',
        descricao: 'Prestação de serviços artísticos de tatuagem / piercing',
        valorBaseCalculo: valorTotal,
      },
      nfseIntermediacaoPlataforma: {
        tomador: 'Artista / Tatuador',
        prestador: 'Dermys Plataforma Digital / Estúdio Parceiro',
        descricao: 'Intermediação e facilitação de agendamentos e transações digitais',
        valorBaseCalculo: valorTaxaPlataforma + valorTaxaEstudio,
      },
      evitaBitributacao: true,
    },
  };
}
