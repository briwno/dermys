import { deduplicarListaMensagensParaTeste } from '../services/chat-service-test-helper';
import { montarDadosDanfse, gerarHtmlDanfseCompleto } from '../services/fiscal/danfse-generator';
import type { MensagemChat } from '../types/chat';

function runTests() {
  console.log('🧪 Iniciando bateria de testes do Dermys...\n');
  let passou = 0;
  let falhou = 0;

  function assert(cond: boolean, desc: string) {
    if (cond) {
      console.log(`  ✅ PASSOU: ${desc}`);
      passou++;
    } else {
      console.error(`  ❌ FALHOU: ${desc}`);
      falhou++;
    }
  }

  // TESTE 1: Deduplicação de Cards de Sinal e Anamnese no Chat
  console.log('--- TESTE 1: Anti-Spam & Deduplicação de Mensagens do Chat ---');
  const mensagensComSpam: MensagemChat[] = [
    {
      id: 'm1',
      remetente_id: 'cli1',
      destinatario_id: 'art1',
      conteudo: 'Olá, tenho interesse',
      lida: true,
      criado_em: '2026-09-22T18:00:00.000Z',
      tipo_mensagem: 'texto',
    },
    {
      id: 'm2',
      remetente_id: 'art1',
      destinatario_id: 'cli1',
      conteudo: '[DERMYS_CARD:{"tipo":"deposit_confirmed","payload":{"agendamentoId":"AG-123","valorSinal":240,"dataHorarioFormatada":"24/09/2026 (Turno tarde)","turnoNome":"Tarde","protocoloReserva":"DERM-918299"}}]',
      lida: true,
      criado_em: '2026-09-22T18:01:00.000Z',
      tipo_mensagem: 'deposit_confirmed',
      card_payload: {
        agendamentoId: 'AG-123',
        valorSinal: 240,
        dataHorarioFormatada: '24/09/2026 (Turno tarde)',
        turnoNome: 'Tarde',
        protocoloReserva: 'DERM-918299',
      },
    },
    {
      id: 'm3_duplicada',
      remetente_id: 'art1',
      destinatario_id: 'cli1',
      conteudo: '[DERMYS_CARD:{"tipo":"deposit_confirmed","payload":{"agendamentoId":"AG-123","valorSinal":240,"dataHorarioFormatada":"24/09/2026 (Turno tarde)","turnoNome":"Tarde","protocoloReserva":"DERM-918299"}}]',
      lida: true,
      criado_em: '2026-09-22T18:01:02.000Z',
      tipo_mensagem: 'deposit_confirmed',
      card_payload: {
        agendamentoId: 'AG-123',
        valorSinal: 240,
        dataHorarioFormatada: '24/09/2026 (Turno tarde)',
        turnoNome: 'Tarde',
        protocoloReserva: 'DERM-918299',
      },
    },
    {
      id: 'm4',
      remetente_id: 'art1',
      destinatario_id: 'cli1',
      conteudo: '[DERMYS_CARD:{"tipo":"anamnese_card","payload":{"agendamentoId":"AG-123","clienteNome":"Mariana Costa","statusFicha":"pendente"}}]',
      lida: true,
      criado_em: '2026-09-22T18:02:00.000Z',
      tipo_mensagem: 'anamnese_card',
      card_payload: { agendamentoId: 'AG-123', statusFicha: 'pendente' },
    },
    {
      id: 'm5_duplicada',
      remetente_id: 'art1',
      destinatario_id: 'cli1',
      conteudo: '[DERMYS_CARD:{"tipo":"anamnese_card","payload":{"agendamentoId":"AG-123","clienteNome":"Mariana Costa","statusFicha":"assinada"}}]',
      lida: true,
      criado_em: '2026-09-22T18:02:05.000Z',
      tipo_mensagem: 'anamnese_card',
      card_payload: { agendamentoId: 'AG-123', statusFicha: 'assinada' },
    },
  ];

  const deduplicadas = deduplicarListaMensagensParaTeste(mensagensComSpam);
  assert(deduplicadas.length === 3, `Lista com 5 mensagens com spam reduziu para 3 mensagens únicas (obtido: ${deduplicadas.length})`);
  
  const cardsSinal = deduplicadas.filter((m: MensagemChat) => m.tipo_mensagem === 'deposit_confirmed');
  assert(cardsSinal.length === 1, `Apenas 1 Card de Sinal Confirmado mantido (obtido: ${cardsSinal.length})`);

  const cardsAnamnese = deduplicadas.filter((m: MensagemChat) => m.tipo_mensagem === 'anamnese_card');
  assert(cardsAnamnese.length === 1, `Apenas 1 Card de Anamnese mantido (obtido: ${cardsAnamnese.length})`);
  const payloadAnamnese = cardsAnamnese[0]?.card_payload as any;
  assert(payloadAnamnese?.statusFicha === 'assinada', `Card de Anamnese preservou o estado mais recente ('assinada')`);

  // TESTE 2: Geração e Estrutura dos Dados do DANFSe v1.0
  console.log('\n--- TESTE 2: Estruturação dos Dados da NFS-e / DANFSe v1.0 ---');
  const mockRecibo = {
    numeroNotaFiscal: 'NFS-2026-0089',
    agendamentoId: 'DERM-918299',
    valorTotal: 850,
    valorSinalPago: 255,
    valorRestantePago: 595,
    metodoPagamentoRestante: 'PIX Presencial',
    codigoVerificacaoNfse: 'VER-9A4B7C',
    dataRealizacao: '24/09/2026',
    estilo: 'Irezumi Tradicional / Blackwork',
    tomadorNome: 'Mariana Costa',
  };

  const mockTatuador = {
    nome_exibicao: 'Kaito Tanaka',
    nome_estudio: 'Irezumi Tradicional Kaito',
    cpf_cnpj: '54.321.987/0001-23',
    cidade: 'São Paulo, SP',
  };

  const mockCliente = {
    nome_exibicao: 'Mariana Costa',
  };

  const danfse = montarDadosDanfse(mockRecibo, mockTatuador, mockCliente);
  assert(danfse.chaveAcesso.replace(/\s/g, '').length === 50, `Chave de acesso possui 50 dígitos numéricos oficiais (obtido: ${danfse.chaveAcesso.replace(/\s/g, '').length})`);
  assert(danfse.prestadorNome.includes('Kaito Tanaka'), `Prestador identificado corretamente: ${danfse.prestadorNome}`);
  assert(danfse.prestadorCpfCnpj === '54.321.987/0001-23', `CNPJ do Prestador correto: ${danfse.prestadorCpfCnpj}`);
  assert(danfse.tomadorNome === 'Mariana Costa', `Tomador (Cliente) identificado: ${danfse.tomadorNome}`);
  assert(danfse.valorServico === 850, `Valor total do serviço correto: R$ ${danfse.valorServico}`);
  assert(danfse.codigoTributacaoNacional.includes('06.01.01'), `Código de Tributação Nacional da Tatuagem (06.01.01) presente`);

  // TESTE 3: Geração do HTML de Impressão e PDF
  console.log('\n--- TESTE 3: Geração do HTML e Layout de Impressão do DANFSe ---');
  const html = gerarHtmlDanfseCompleto(danfse);
  assert(html.includes('DANFSe v1.0'), 'Documento possui título oficial DANFSe v1.0');
  assert(html.includes('Documento Auxiliar da NFS-e'), 'Documento possui subtítulo oficial');
  assert(html.includes('EMITENTE DA NFS-e'), 'Possui seção EMITENTE DA NFS-e');
  assert(html.includes('TOMADOR DO SERVIÇO'), 'Possui seção TOMADOR DO SERVIÇO');
  assert(html.includes('TRIBUTAÇÃO MUNICIPAL'), 'Possui seção TRIBUTAÇÃO MUNICIPAL');
  assert(html.includes('TRIBUTAÇÃO FEDERAL'), 'Possui seção TRIBUTAÇÃO FEDERAL');
  assert(html.includes('VALOR TOTAL DA NFS-E'), 'Possui seção VALOR TOTAL DA NFS-E');

  console.log(`\n========================================`);
  console.log(`🏁 RESULTADO DOS TESTES: ${passou} PASSOU, ${falhou} FALHOU`);
  console.log(`========================================\n`);

  if (falhou > 0) {
    process.exit(1);
  }
}

runTests();
