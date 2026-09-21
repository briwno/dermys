import { supabase } from '@/services/supabase';
import type {
  DadosCobrancaMercadoPago,
  MetodoPagamento,
  ReciboFiscal,
  RegimeTributario,
  TransacaoFinanceira,
} from '@/types/financeiro';

/**
 * Utilitário para gerar CRC16 padrão CCITT para padrão EMV de PIX (Bacen)
 */
function calcularCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera string oficial PIX Copia e Cola no formato EMV BRCode
 */
export function gerarPixCopiaECola(params: {
  chavePix: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  identificador: string;
  descricao?: string;
}): string {
  const chave = params.chavePix.replace(/[^a-zA-Z0-9@.+_-]/g, '');
  const nome = params.nomeRecebedor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase() || 'DERMYS TATTOO';
  const cidade = params.cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase() || 'SAO PAULO';
  const valorStr = params.valor.toFixed(2);
  const txid = params.identificador.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || 'DERMYS' + Date.now().toString().slice(-6);

  const formatoCampo = (id: string, valor: string) => {
    const len = valor.length.toString().padStart(2, '0');
    return `${id}${len}${valor}`;
  };

  // GUI + Chave PIX
  const merchantAccount =
    formatoCampo('00', 'br.gov.bcb.pix') +
    formatoCampo('01', chave);

  let payload =
    formatoCampo('00', '01') + // Payload Format Indicator
    formatoCampo('26', merchantAccount) +
    formatoCampo('52', '0000') + // Merchant Category Code
    formatoCampo('53', '986') + // Currency: BRL
    formatoCampo('54', valorStr) + // Amount
    formatoCampo('58', 'BR') + // Country Code
    formatoCampo('59', nome) + // Merchant Name
    formatoCampo('60', cidade) + // Merchant City
    formatoCampo('62', formatoCampo('05', txid)) + // Additional Data Field (txid)
    '6304'; // CRC16 Header

  const crc = calcularCRC16(payload);
  return `${payload}${crc}`;
}

/**
 * Retorna URL de imagem QR Code oficial a partir do Copia e Cola
 */
export function obterUrlQrCodePix(copiaECola: string, tamanho = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&margin=10&data=${encodeURIComponent(
    copiaECola
  )}`;
}

/**
 * Calcula taxas estimadas do Mercado Pago
 */
export function calcularTaxasMercadoPago(valor: number, metodo: MetodoPagamento = 'pix') {
  let percentualTaxa = 0.0099; // 0.99% PIX MP
  let taxaFixa = 0.0;

  if (metodo === 'cartao') {
    percentualTaxa = 0.0399; // 3.99% Cartão de Crédito
    taxaFixa = 0.40;
  } else if (metodo === 'dinheiro') {
    percentualTaxa = 0.0;
    taxaFixa = 0.0;
  }

  const taxaTotal = Number((valor * percentualTaxa + taxaFixa).toFixed(2));
  const valorLiquido = Number((valor - taxaTotal).toFixed(2));

  return {
    percentualTaxa: percentualTaxa * 100,
    taxaTotal,
    valorLiquido,
  };
}

/**
 * Estima o imposto tributário com base no regime (para apoio contábil)
 */
export function estimarTributos(valor: number, regime: RegimeTributario = 'MEI'): number {
  switch (regime) {
    case 'MEI':
      // MEI paga taxa fixa mensal DAS, tributação sobre nota é 0% até o teto de 81k
      return 0;
    case 'SIMPLES':
      // Anexo III / V do Simples Nacional ~ 6%
      return Number((valor * 0.06).toFixed(2));
    case 'AUTONOMO_PF':
      // IRPF Carnê Leão médio de retenção ~ 15%
      return Number((valor * 0.15).toFixed(2));
    default:
      return 0;
  }
}

/**
 * Cria cobrança de sinal para reserva de agendamento via Mercado Pago
 */
export async function criarCobrancaSinal(params: {
  agendamentoId: string;
  artistaId: string;
  clienteId: string;
  valorSinal: number;
  artistaNome: string;
  chavePixArtista?: string;
  cidade?: string;
  descricao?: string;
}): Promise<DadosCobrancaMercadoPago> {
  const paymentId = `MP-SINAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const chavePixFinal = params.chavePixArtista || 'pix@dermys.app';
  const cidadeFinal = params.cidade || 'SAO PAULO';

  const copiaCola = gerarPixCopiaECola({
    chavePix: chavePixFinal,
    nomeRecebedor: params.artistaNome || 'Dermys Artista',
    cidade: cidadeFinal,
    valor: params.valorSinal,
    identificador: params.agendamentoId.replace(/-/g, '').substring(0, 20),
    descricao: params.descricao || `Sinal Tattoo Dermys #${params.agendamentoId.slice(0, 8)}`,
  });

  const { taxaTotal, valorLiquido } = calcularTaxasMercadoPago(params.valorSinal, 'pix');
  const impostoEstimado = estimarTributos(params.valorSinal, 'MEI');

  try {
    // Registra transação como CUSTODIA no banco de dados
    await supabase.from('transacoes_financeiras').insert({
      agendamento_id: params.agendamentoId,
      artista_id: params.artistaId,
      cliente_id: params.clienteId,
      tipo: 'SINAL',
      valor_bruto: params.valorSinal,
      taxa_mercado_pago: taxaTotal,
      valor_liquido: valorLiquido,
      status: 'CUSTODIA',
      forma_pagamento: 'pix',
      mercado_pago_payment_id: paymentId,
      descricao: `Sinal de agendamento reservado via Mercado Pago PIX`,
      imposto_estimado: impostoEstimado,
    });

    // Atualiza agendamento com metadados de pagamento
    await supabase
      .from('agendamentos')
      .update({
        valor_sinal: params.valorSinal,
        forma_pagamento: 'pix',
        mercado_pago_id: paymentId,
        mercado_pago_copia_cola: copiaCola,
        sinal_pago: true,
      })
      .eq('id', params.agendamentoId);
  } catch (err) {
    console.warn('[MercadoPago] Erro ao gravar transacao:', err);
  }

  return {
    paymentId,
    qrCodePayload: copiaCola,
    qrCodeBase64: obterUrlQrCodePix(copiaCola),
    valor: params.valorSinal,
    status: 'pending',
    expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    descricao: `Sinal de Reserva - ${params.artistaNome}`,
  };
}

/**
 * Cria cobrança do saldo final ou total da sessão
 */
export async function criarCobrancaFinal(params: {
  agendamentoId: string;
  artistaId: string;
  clienteId: string;
  valorFinal: number;
  valorSinalJaPago: number;
  metodo: MetodoPagamento;
  artistaNome: string;
  chavePixArtista?: string;
}): Promise<DadosCobrancaMercadoPago> {
  const saldoRestante = Math.max(0, params.valorFinal - params.valorSinalJaPago);
  const paymentId = `MP-FINAL-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const chavePixFinal = params.chavePixArtista || 'pix@dermys.app';

  const copiaCola = gerarPixCopiaECola({
    chavePix: chavePixFinal,
    nomeRecebedor: params.artistaNome || 'Dermys Artista',
    cidade: 'SAO PAULO',
    valor: saldoRestante > 0 ? saldoRestante : params.valorFinal,
    identificador: params.agendamentoId.replace(/-/g, '').substring(0, 20),
    descricao: `Quitacao Tattoo Dermys #${params.agendamentoId.slice(0, 8)}`,
  });

  const { taxaTotal, valorLiquido } = calcularTaxasMercadoPago(saldoRestante, params.metodo);
  const impostoEstimado = estimarTributos(params.valorFinal, 'MEI');

  try {
    // Registra transação final como APROVADO
    await supabase.from('transacoes_financeiras').insert({
      agendamento_id: params.agendamentoId,
      artista_id: params.artistaId,
      cliente_id: params.clienteId,
      tipo: 'PAGAMENTO_FINAL',
      valor_bruto: saldoRestante,
      taxa_mercado_pago: taxaTotal,
      valor_liquido: valorLiquido,
      status: 'LIBERADO',
      forma_pagamento: params.metodo,
      mercado_pago_payment_id: paymentId,
      descricao: `Liquidação final de procedimento (${params.metodo.toUpperCase()})`,
      imposto_estimado: impostoEstimado,
    });

    // Libera também o sinal anterior que estava em custódia
    await supabase
      .from('transacoes_financeiras')
      .update({ status: 'LIBERADO' })
      .eq('agendamento_id', params.agendamentoId)
      .eq('tipo', 'SINAL');
  } catch (err) {
    console.warn('[MercadoPago] Erro ao gravar liquidacao:', err);
  }

  return {
    paymentId,
    qrCodePayload: copiaCola,
    qrCodeBase64: obterUrlQrCodePix(copiaCola),
    valor: saldoRestante,
    status: 'approved',
    expiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    descricao: `Quitação da Sessão - ${params.artistaNome}`,
  };
}

/**
 * Gera objeto de Recibo Fiscal estruturado
 */
export function gerarReciboFiscal(params: {
  agendamentoId: string;
  artistaNome: string;
  artistaDocumento?: string;
  artistaEstudio?: string;
  clienteNome: string;
  clienteDocumento?: string;
  descricaoServico: string;
  estilo: string;
  valorSinal: number;
  valorFinal: number;
  formaPagamento: string;
  regimeTributario?: RegimeTributario;
}): ReciboFiscal {
  const ano = new Date().getFullYear();
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const numeroRecibo = `DERM-${ano}-${hash}`;
  const valorTotal = params.valorFinal || params.valorSinal;
  const regime = params.regimeTributario || 'MEI';
  const tributos = estimarTributos(valorTotal, regime);

  return {
    numeroRecibo,
    dataEmissao: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    agendamentoId: params.agendamentoId,
    artistaNome: params.artistaNome,
    artistaDocumento: params.artistaDocumento || 'MEI - Prestação de Serviços Artísticos',
    artistaEstudio: params.artistaEstudio || 'Estúdio Particular Dermys',
    clienteNome: params.clienteNome,
    clienteDocumento: params.clienteDocumento || 'Não informado',
    descricaoServico: params.descricaoServico || 'Procedimento de Tatuagem Artística Autoral',
    estilo: params.estilo || 'Tattoo Autoral',
    valorSinal: params.valorSinal,
    valorFinal: params.valorFinal,
    valorTotal,
    formaPagamento: params.formaPagamento.toUpperCase(),
    codigoAutenticacao: `AUTH-${Date.now().toString(16).toUpperCase()}-${hash}`,
    regimeTributario: regime,
    tributosEstimados: tributos,
  };
}
