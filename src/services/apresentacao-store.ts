import AsyncStorage from '@react-native-async-storage/async-storage';
import { PERSONAS_TESTE } from '@/components/debug/types';
import type { PedidoDebug, ResultadoDebug, LoteDebug } from './debug-service';

// Este banco é exclusivo da demonstração: nunca contém tokens nem escreve no Supabase.
export type RegistroDemo = Record<string, any>;
export interface AvisoDemo { id: string; perfilId: string; titulo: string; texto: string; aba: string; lida: boolean; criadoEm: string }
interface EstadoDemo {
  versao: 1; ativo: boolean; tabelas: Record<string, RegistroDemo[]>;
  avisos: AvisoDemo[]; jornadaId: string | null; passo: number;
}
const CHAVE = '@dermys:apresentacao:v1';
export const CLIENTE_DEMO = PERSONAS_TESTE[0].id;
export const ARTISTA_DEMO = PERSONAS_TESTE[1].id;
const ouvintes = new Set<() => void>();
const eventos = new Set<(tabela: string, registro: RegistroDemo) => void>();
let estado: EstadoDemo = { versao: 1, ativo: false, tabelas: {}, avisos: [], jornadaId: null, passo: 0 };
let fila = Promise.resolve();
let revisao = 0;
const copiar = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
export const idDemo = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const n = Math.floor(Math.random() * 16); return (c === 'x' ? n : (n & 3) | 8).toString(16);
});
export const dataDemo = () => {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const agora = () => new Date().toISOString();
export function demoAtiva() { return estado.ativo; }
export function snapshotDemo() { return estado; }
export function assinarDemo(callback: () => void) { ouvintes.add(callback); return () => { ouvintes.delete(callback); }; }
export function assinarEventosDemo(callback: (tabela: string, registro: RegistroDemo) => void) { eventos.add(callback); return () => { eventos.delete(callback); }; }
export function emitirEventoDemo(tabela: string, registro: RegistroDemo) { eventos.forEach(fn => fn(tabela, copiar(registro))); }

// Só publica uma alteração depois de persistir. Falha no armazenamento não vira sucesso visual.
export async function alterarDemo<T>(acao: (rascunho: EstadoDemo) => T): Promise<T> {
  let resultado!: T;
  const tarefa = fila.then(async () => {
    const rascunho = copiar(estado); resultado = acao(rascunho);
    await AsyncStorage.setItem(CHAVE, JSON.stringify(rascunho));
    estado = rascunho; revisao++; ouvintes.forEach(fn => fn());
  });
  fila = tarefa.catch(() => {}); await tarefa; return resultado;
}
export async function restaurarDemoSalva() {
  const inicio = revisao;
  const salvo = await AsyncStorage.getItem(CHAVE);
  if (!salvo || inicio !== revisao) return;
  try {
    const obj = JSON.parse(salvo);
    if (obj.versao === 1 && typeof obj.ativo === 'boolean' && obj.tabelas && Array.isArray(obj.avisos)) {
      estado = obj; ouvintes.forEach(fn => fn());
    }
  } catch { /* Estado inválido será substituído ao preparar um cenário. */ }
}

function perfisDemo() {
  return PERSONAS_TESTE.map(p => ({ id: p.id, nome_exibicao: p.nome, email: p.email, tipo_perfil: p.tipo,
    foto_url: p.avatarUrl, nome_estudio: p.estudio, estilo_principal: p.estilo, cidade: p.cidade,
    bio: p.tipo === 'artista' ? 'Arte autoral, escuta e cuidado em cada traço. Vamos criar sua próxima história?' : 'Apaixonada por arte e novas histórias.',
    agenda_aberta: true, estilos: [p.estilo], preco_hora: 200, valor_minimo: 300,
    telefone: '(11) 99999-0000', instagram: '@dermys.demo', chave_pix: 'DEMONSTRACAO-SEM-COBRANCA' }));
}
function aviso(e: EstadoDemo, perfilId: string, titulo: string, texto: string, aba: string) {
  e.avisos.unshift({ id: idDemo(), perfilId, titulo, texto, aba, lida: false, criadoEm: agora() });
  e.avisos = e.avisos.slice(0, 100);
}
function mensagem(e: EstadoDemo, de: string, para: string, conteudo: string) {
  const m = { id: idDemo(), remetente_id: de, destinatario_id: para, conteudo, lida: false, criado_em: agora() };
  e.tabelas.mensagens.push(m); aviso(e, para, 'Nova mensagem', conteudo, 'chat');
  return m;
}
export function notificarAlteracaoDemo(e: EstadoDemo, tabela: string, r: RegistroDemo) {
  if (tabela === 'mensagens' && !r.lida) aviso(e, r.destinatario_id, 'Nova mensagem', r.conteudo.startsWith('[DERMYS_CARD:') ? 'Há uma atualização sobre seu atendimento.' : r.conteudo, 'chat');
  if (tabela === 'agendamentos') {
    aviso(e, r.artista_id, 'Agenda atualizada', `${r.descricao || 'Reserva'} · ${r.status}`, 'schedule');
    aviso(e, r.cliente_id, 'Reserva atualizada', `Seu atendimento está ${r.status}.`, 'bookings');
  }
  if (tabela === 'transacoes_financeiras') aviso(e, r.artista_id, 'Movimentação simulada', `${r.tipo} · R$ ${Number(r.valor_bruto).toFixed(2)} · ${r.status}`, 'financial');
}
function transacao(e: EstadoDemo, a: RegistroDemo, tipo: string, valor: number, status: string) {
  const t = { id: idDemo(), agendamento_id: a.id, artista_id: a.artista_id, cliente_id: a.cliente_id,
    tipo, valor_bruto: valor, valor_liquido: valor, taxa_mercado_pago: 0, imposto_estimado: 0,
    forma_pagamento: 'pix', status, descricao: 'Demonstração acadêmica · sem cobrança real', criado_em: agora() };
  e.tabelas.transacoes_financeiras.push(t); return t;
}
function agendamento(e: EstadoDemo, artistaId: string, clienteId: string, valor: number, data: string, status = 'pendente') {
  const a = { id: idDemo(), artista_id: artistaId, cliente_id: clienteId, data_horario: `${data}T14:00:00-03:00`,
    estilo: 'Fine Line', descricao: 'Projeto botânico autoral · demonstração', local_corpo: 'Antebraço', tamanho_cm: '12 cm',
    turno: 'tarde', tipo_sessao: 'exclusivo', referencias_urls: [], valor_total: valor,
    valor_sinal: Math.round(valor * 30) / 100, valor_final: null, sinal_pago: false, status, criado_em: agora() };
  e.tabelas.agendamentos.push(a); return a;
}
function despesa(e: EstadoDemo, artistaId: string, valor: number, categoria: string, data: string) {
  e.tabelas.despesas_artista.push({ id: idDemo(), artista_id: artistaId, valor, categoria, data,
    descricao: categoria === 'ESTUDIO_FIXO' ? 'Contas do estúdio · demo' : 'Materiais · demo', recorrente: categoria === 'ESTUDIO_FIXO', criado_em: agora() });
}
export async function prepararApresentacao() {
  await alterarDemo(e => {
    e.ativo = true; e.passo = 0; e.jornadaId = null; e.avisos = [];
    e.tabelas = { profiles: perfisDemo(), agendamentos: [], transacoes_financeiras: [], despesas_artista: [],
      financeiro_lancamentos: [], mensagens: [], notas_fiscais: [], fichas_anamnese: [], fiscal_profiles: [], avaliacoes: [], flashes_portfolio: [], debug_lotes: [] };
    const hoje = dataDemo();
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setDate(d.getDate() - i); const dia = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const a = agendamento(e, ARTISTA_DEMO, CLIENTE_DEMO, 400 + i * 100, dia, 'concluido');
      Object.assign(a, { sinal_pago: true, valor_final: a.valor_total, concluido_em: a.data_horario });
      transacao(e, a, 'SINAL', a.valor_sinal, 'LIBERADO');
      transacao(e, a, 'PAGAMENTO_FINAL', a.valor_total - a.valor_sinal, 'LIBERADO');
    }
    despesa(e, ARTISTA_DEMO, 180, 'MATERIAIS_TATUAGEM', hoje); despesa(e, ARTISTA_DEMO, 250, 'ESTUDIO_FIXO', hoje);
    mensagem(e, ARTISTA_DEMO, CLIENTE_DEMO, 'Oi, Mariana! Vamos criar um projeto botânico para o antebraço? Tenho uma ideia exclusiva para você.');
    mensagem(e, CLIENTE_DEMO, ARTISTA_DEMO, 'Adorei! Quero traços delicados e uma composição com folhas.');
    e.tabelas.avaliacoes.push({ id: idDemo(), artista_id: ARTISTA_DEMO, cliente_id: CLIENTE_DEMO, nota: 5, comentario: 'Atendimento cuidadoso e arte incrível!', criado_em: agora() });
  });
}
export async function sairApresentacao() { await alterarDemo(e => { e.ativo = false; }); }
export async function marcarAvisosLidos(perfilId: string) { await alterarDemo(e => { e.avisos.filter(a => a.perfilId === perfilId).forEach(a => { a.lida = true; }); }); }
export const PASSOS_APRESENTACAO = [
  { titulo: 'Descobrir o artista', texto: 'Apresente o Explore, os estilos e o portfólio. O cliente encontra uma arte com a qual se identifica.', perfil: CLIENTE_DEMO, aba: 'home' },
  { titulo: 'Enviar uma reserva', texto: 'Crie o pedido botânico e mostre como ele aparece para cliente e artista.', perfil: CLIENTE_DEMO, aba: 'bookings' },
  { titulo: 'Aprovar o sinal', texto: 'Simule o sinal de R$ 180 em custódia. A reserva de R$ 600 passa para confirmada.', perfil: ARTISTA_DEMO, aba: 'schedule' },
  { titulo: 'Realizar a sessão', texto: 'Mostre a ficha assinada e o início do atendimento. A receita ainda não entrou na DRE.', perfil: ARTISTA_DEMO, aba: 'schedule' },
  { titulo: 'Concluir e quitar', texto: 'Simule os R$ 420 restantes. A receita entra na DRE e os valores ficam liberados.', perfil: ARTISTA_DEMO, aba: 'financial' },
  { titulo: 'Recibo e cuidados', texto: 'O cliente recebe o recibo demonstrativo e encontra as orientações de cuidado nos agendamentos.', perfil: CLIENTE_DEMO, aba: 'bookings' },
  { titulo: 'Mostrar o resultado', texto: 'Abra a DRE no financeiro. Explique como receitas e despesas geram o resultado do período.', perfil: ARTISTA_DEMO, aba: 'financial' },
] as const;

export async function avancarApresentacao() {
  const novasMensagens: RegistroDemo[] = [];
  await alterarDemo(e => {
    if (!e.ativo) throw new Error('Prepare o cenário antes de iniciar.');
    if (e.passo >= PASSOS_APRESENTACAO.length - 1) return;
    const passo = e.passo + 1;
    if (passo === 1) {
      const a = agendamento(e, ARTISTA_DEMO, CLIENTE_DEMO, 600, dataDemo()); e.jornadaId = a.id;
      aviso(e, ARTISTA_DEMO, 'Nova reserva', 'Mariana enviou um pedido botânico de R$ 600.', 'schedule');
      novasMensagens.push(mensagem(e, CLIENTE_DEMO, ARTISTA_DEMO, `[DERMYS_CARD:${JSON.stringify({ tipo: 'briefing', payload: { agendamentoId: a.id, referenciasUrls: [], localCorpo: 'Antebraço', tamanhoCm: '12 cm', descricao: 'Projeto botânico autoral', disponibilidadePreferencial: 'Tarde', estilo: 'Fine Line', valorEstimadoBase: 600 } })}]`));
      novasMensagens.push(mensagem(e, ARTISTA_DEMO, CLIENTE_DEMO, `[DERMYS_CARD:${JSON.stringify({ tipo: 'quote', payload: { agendamentoId: a.id, valorTotal: 600, valorSinal: 180, duracaoEstimada: '3 horas', statusProposta: 'pendente' } })}]`));
    }
    const a = e.tabelas.agendamentos.find(a => a.id === e.jornadaId);
    if (!a) throw new Error('Reserva da apresentação não encontrada. Restaure o cenário.');
    if (a.status === 'cancelado') throw new Error('A reserva foi cancelada. Restaure o cenário para repetir a jornada.');
    const esperado: Record<number, string> = { 2: 'pendente', 3: 'confirmado', 4: 'em_andamento', 5: 'concluido', 6: 'concluido' };
    if (esperado[passo] && a.status !== esperado[passo]) throw new Error('Esta reserva foi alterada fora do roteiro. Restaure o cenário para executar a sequência novamente.');
    if (passo === 2) {
      a.sinal_pago = true; a.status = 'confirmado'; transacao(e, a, 'SINAL', a.valor_sinal, 'CUSTODIA');
      aviso(e, CLIENTE_DEMO, 'Reserva confirmada', 'Sinal de R$ 180 aprovado na simulação.', 'bookings');
      novasMensagens.push(mensagem(e, ARTISTA_DEMO, CLIENTE_DEMO, `[DERMYS_CARD:${JSON.stringify({ tipo: 'deposit_confirmed', payload: { agendamentoId: a.id, valorSinal: 180, dataHorarioFormatada: `${dataDemo()} · 14h`, turnoNome: 'Tarde', protocoloReserva: `DEMO-${a.id.slice(0, 8)}` } })}]`));
    }
    if (passo === 3) {
      a.status = 'em_andamento';
      e.tabelas.fichas_anamnese.push({ id: idDemo(), agendamento_id: a.id, cliente_id: CLIENTE_DEMO, artista_id: ARTISTA_DEMO, assinado: true, tem_alerta_saude: false, data_assinatura: agora(), alergias: 'Nenhuma · exemplo fictício' });
    }
    if (passo === 4) {
      a.status = 'concluido'; a.concluido_em = agora(); a.valor_final = 600;
      e.tabelas.transacoes_financeiras.filter(t => t.agendamento_id === a.id).forEach(t => { t.status = 'LIBERADO'; });
      transacao(e, a, 'PAGAMENTO_FINAL', 420, 'LIBERADO'); despesa(e, ARTISTA_DEMO, 90, 'MATERIAIS_TATUAGEM', dataDemo());
      aviso(e, ARTISTA_DEMO, 'Pagamento liberado', 'Sessão concluída. R$ 600 em receitas e R$ 90 em materiais na DRE.', 'financial');
    }
    if (passo === 5) {
      e.tabelas.notas_fiscais.push({ id: idDemo(), artista_id: ARTISTA_DEMO, cliente_id: CLIENTE_DEMO, agendamento_id: a.id,
        tipo_documento: 'RECIBO_SIMPLES', numero_documento: `DEMO-${a.id.slice(0, 8).toUpperCase()}`, codigo_verificacao: 'DEMONSTRACAO', status: 'AUTORIZADA',
        valor_servicos: 600, valor_deducoes: 0, valor_iss: 0, aliquota_iss: 0, valor_liquido: 600, descricao_servico: 'Projeto botânico · documento demonstrativo sem validade fiscal',
        dados_tomador: { nome: 'Mariana Costa' }, dados_prestador: { razaoSocial: 'Camila Rossi', nomeFantasia: 'Aura Tatuaria & Botânica', cpfCnpj: 'Documento fictício' },
        provedor: 'simulado', criado_em: agora(), emitida_em: agora() });
      aviso(e, CLIENTE_DEMO, 'Seu recibo está disponível', 'Veja o documento demonstrativo e os cuidados após a sessão.', 'bookings');
      novasMensagens.push(mensagem(e, ARTISTA_DEMO, CLIENTE_DEMO, `[DERMYS_CARD:${JSON.stringify({ tipo: 'session_completed', payload: { agendamentoId: a.id, valorTotal: 600, valorSinalPago: 180, valorRestantePago: 420, metodoPagamentoRestante: 'pix', numeroNotaFiscal: `DEMO-${a.id.slice(0, 8).toUpperCase()}`, codigoVerificacaoNfse: 'DEMONSTRACAO', dataRealizacao: agora(), estilo: 'Fine Line', tomadorNome: 'Mariana Costa' } })}]`));
    }
    e.passo = passo;
  });
  novasMensagens.forEach(m => emitirEventoDemo('mensagens', m));
}

export async function simularAcaoApresentacao(acao: 'recusar' | 'aprovar' | 'cancelar' | 'estornar') {
  await alterarDemo(e => {
    const a = e.tabelas.agendamentos.find(a => a.id === e.jornadaId);
    if (!a) throw new Error('Avance até a reserva para testar esta ação.');
    if (acao === 'recusar') {
      if (a.status !== 'pendente') throw new Error('A recusa é demonstrada enquanto a reserva está pendente. Restaure o roteiro para repetir.');
      e.tabelas.transacoes_financeiras.filter(t => t.agendamento_id === a.id && t.status === 'PENDENTE').forEach(t => { t.status = 'CANCELADO'; });
      transacao(e, a, 'SINAL', 180, 'CANCELADO'); aviso(e, CLIENTE_DEMO, 'Pagamento recusado', 'A simulação recusou o sinal. Você pode tentar novamente.', 'bookings');
    } else if (acao === 'aprovar') {
      if (a.status !== 'pendente') throw new Error('Somente reservas pendentes podem receber o sinal.');
      a.sinal_pago = true; a.status = 'confirmado'; transacao(e, a, 'SINAL', 180, 'CUSTODIA'); e.passo = 2;
      aviso(e, CLIENTE_DEMO, 'Sinal aprovado', 'Sua reserva está confirmada.', 'bookings');
    } else if (acao === 'cancelar') {
      if (!['pendente', 'confirmado'].includes(a.status)) throw new Error('Somente reservas pendentes ou confirmadas podem ser canceladas.');
      a.status = 'cancelado'; a.sinal_pago = false;
      e.tabelas.transacoes_financeiras.filter(t => t.agendamento_id === a.id).forEach(t => { t.status = 'CANCELADO'; });
      aviso(e, CLIENTE_DEMO, 'Reserva cancelada', 'Cancelamento demonstrativo. Restaure o cenário para repetir o roteiro.', 'bookings');
    } else {
      if (a.status !== 'concluido') throw new Error('Conclua e quite a sessão antes do estorno.');
      if (e.tabelas.transacoes_financeiras.some(t => t.agendamento_id === a.id && t.tipo === 'ESTORNO')) throw new Error('Esta sessão já recebeu um estorno de R$ 150.');
      transacao(e, a, 'ESTORNO', 150, 'LIBERADO'); aviso(e, CLIENTE_DEMO, 'Estorno de R$ 150', 'Estorno parcial simulado. O valor também reduz o resultado na DRE.', 'bookings');
    }
  });
}

export function lancamentosDemo(artistaId: string, inicio: string, fim: string): RegistroDemo[] {
  const t = estado.tabelas;
  const periodo = (data: string) => data >= inicio && data < fim;
  const linhas: RegistroDemo[] = (t.financeiro_lancamentos || []).filter(x => x.artista_id === artistaId).map(x => ({ ...x, origem: 'manual', editavel: true }));
  const concluidos = (t.agendamentos || []).filter(a => a.artista_id === artistaId && a.status === 'concluido');
  // ISO em vez de depender do formato de locale disponível no Hermes.
  const competencia = (data: string) => {
    const d = new Date(new Date(data).getTime() - 3 * 3600000); return d.toISOString().slice(0, 10);
  };
  concluidos.forEach(a => linhas.push({ id: a.id, categoria: 'receitaBruta', descricao: a.descricao, valor: a.valor_total, competencia: competencia(a.concluido_em || a.data_horario), origem: 'servico', editavel: false }));
  (t.despesas_artista || []).filter(d => d.artista_id === artistaId).forEach(d => linhas.push({ id: d.id, categoria: ['MATERIAIS_TATUAGEM', 'LIMPEZA_BIOSSEGURANCA'].includes(d.categoria) ? 'custos' : 'administrativas', descricao: d.descricao, valor: d.valor, competencia: d.data, origem: 'despesa', editavel: false }));
  (t.transacoes_financeiras || []).filter(x => x.artista_id === artistaId && ['APROVADO', 'LIBERADO'].includes(x.status)).forEach(x => {
    const a = concluidos.find(a => a.id === x.agendamento_id);
    if (x.tipo === 'ESTORNO' && a) linhas.push({ id: x.id, categoria: 'deducoes', descricao: 'Estorno simulado', valor: x.valor_bruto, competencia: competencia(x.criado_em), origem: 'estorno', editavel: false });
    if (Number(x.taxa_mercado_pago) > 0 && (!x.agendamento_id || a)) linhas.push({ id: `taxa-${x.id}`, categoria: 'despesasFinanceiras', descricao: 'Taxa simulada', valor: x.taxa_mercado_pago, competencia: competencia(a?.concluido_em || a?.data_horario || x.criado_em), origem: 'taxa', editavel: false });
  });
  return linhas.filter(l => periodo(l.competencia)).sort((a, b) => a.competencia.localeCompare(b.competencia) || a.id.localeCompare(b.id));
}

export async function gerarCenarioLocal(p: PedidoDebug): Promise<ResultadoDebug> {
  return alterarDemo(e => {
    if (!e.ativo) throw new Error('Ative a apresentação antes de gerar dados locais.');
    if (!e.tabelas.profiles.some(a => a.id === p.artistaId && a.tipo_perfil === 'artista') || !e.tabelas.profiles.some(a => a.id === p.clienteId && a.tipo_perfil === 'cliente')) throw new Error('Selecione um artista e um cliente da apresentação.');
    if (!Number.isFinite(p.valor) || p.valor < 1 || p.valor > 10000 || ![1, 3, 5].includes(p.quantidade) || !/^\d{4}-\d{2}-\d{2}$/.test(p.data) || !Number.isFinite(Date.parse(`${p.data}T12:00:00Z`)) || new Date(`${p.data}T12:00:00Z`).toISOString().slice(0, 10) !== p.data) throw new Error('Confira valor, data e repetições.');
    const anterior = e.tabelas.debug_lotes.find(l => l.requestId === p.requestId);
    if (anterior) {
      if (JSON.stringify(anterior.pedido) !== JSON.stringify(p)) throw new Error('Identificador já utilizado para outro pedido.');
      if (anterior.removido_em) throw new Error('Este lote já foi removido.');
      return anterior.resultado;
    }
    const tabelas = ['agendamentos', 'transacoes_financeiras', 'despesas_artista', 'financeiro_lancamentos'];
    const antes = Object.fromEntries(tabelas.map(t => [t, new Set(e.tabelas[t].map(r => r.id))]));
    const cent = (v: number) => Math.round(v * 100) / 100;
    const sessao = (status: string, pagamento: string | null, data: string, valor = p.valor, cartao = false) => {
      const a = agendamento(e, p.artistaId, p.clienteId, valor, data, status);
      if (status === 'concluido') Object.assign(a, { concluido_em: a.data_horario, valor_final: valor });
      a.sinal_pago = ['CUSTODIA', 'LIBERADO', 'APROVADO'].includes(pagamento || '');
      if (pagamento) {
        const sinal = transacao(e, a, 'SINAL', a.valor_sinal, pagamento); sinal.criado_em = a.data_horario;
        const ts = [sinal];
        if (status === 'concluido') { const final = transacao(e, a, 'PAGAMENTO_FINAL', cent(valor - a.valor_sinal), pagamento); final.criado_em = a.data_horario; ts.push(final); }
        if (cartao) ts.forEach(t => Object.assign(t, { forma_pagamento: 'cartao', taxa_mercado_pago: cent(t.valor_bruto * .0499), valor_liquido: cent(t.valor_bruto - cent(t.valor_bruto * .0499)) }));
      }
      return a;
    };
    for (let i = 0; i < p.quantidade; i++) {
      const dt = new Date(`${p.data}T12:00:00Z`); dt.setUTCDate(dt.getUTCDate() + i); const data = dt.toISOString().slice(0, 10);
      const custo = (valor: number, categoria = 'MATERIAIS_TATUAGEM', dia = data) => despesa(e, p.artistaId, cent(valor), categoria, dia);
      switch (p.cenario) {
        case 'reserva_pendente': sessao('pendente', null, data); break;
        case 'reserva_confirmada': case 'sinal_custodia': sessao('confirmado', 'CUSTODIA', data); break;
        case 'reserva_cancelada': sessao('cancelado', null, data); break;
        case 'sessao_concluida': case 'pix_liberado': sessao('concluido', 'LIBERADO', data); break;
        case 'cartao_aprovado': sessao('concluido', 'APROVADO', data, p.valor, true); break;
        case 'pagamento_pendente': sessao('pendente', 'PENDENTE', data); break;
        case 'pagamento_cancelado': sessao('cancelado', 'CANCELADO', data); break;
        case 'estorno_parcial': { const a = sessao('concluido', 'LIBERADO', data); const t = transacao(e, a, 'ESTORNO', cent(p.valor * .25), 'LIBERADO'); t.criado_em = a.data_horario; break; }
        case 'despesa_material': custo(p.valor); break;
        case 'despesa_estudio': custo(p.valor, 'ESTUDIO_FIXO'); break;
        case 'despesa_equipamento': custo(p.valor, 'EQUIPAMENTOS_MANUTENCAO'); break;
        case 'pacote_despesas': [.3, .1, .4, .15, .05].forEach((f, j) => custo(p.valor * f, ['MATERIAIS_TATUAGEM', 'LIMPEZA_BIOSSEGURANCA', 'ESTUDIO_FIXO', 'EQUIPAMENTOS_MANUTENCAO', 'OUTROS'][j])); break;
        case 'mes_lucrativo': case 'mes_prejuizo': sessao('concluido', 'LIBERADO', data); custo(p.valor * (p.cenario === 'mes_prejuizo' ? .8 : .2)); custo(p.valor * (p.cenario === 'mes_prejuizo' ? .7 : .15), 'ESTUDIO_FIXO'); break;
        case 'historico_trimestral': for (let mes = -2; mes <= 0; mes++) { const d = new Date(`${data}T12:00:00Z`); const dia = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + mes); const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(dia, ultimo)); const base = d.toISOString().slice(0, 10); sessao('concluido', 'LIBERADO', base, cent(p.valor * (1.2 + mes * .2))); custo(p.valor * .25, 'ESTUDIO_FIXO', base); } break;
        case 'dre_completa':
          sessao('concluido', 'LIBERADO', data); sessao('concluido', 'APROVADO', data, p.valor, true); custo(p.valor * .3); custo(p.valor * .2, 'ESTUDIO_FIXO');
          for (const [categoria, f] of [['deducoes', .05], ['vendas', .08], ['depreciacao', .03], ['receitasFinanceiras', .01], ['despesasFinanceiras', .02], ['tributosLucro', .04]] as const) e.tabelas.financeiro_lancamentos.push({ id: idDemo(), artista_id: p.artistaId, competencia: data, categoria, descricao: `${categoria} · simulação`, valor: cent(p.valor * f) });
          break;
        default: throw new Error('Cenário não implementado no ambiente local.');
      }
    }
    const ids = Object.fromEntries(tabelas.map(t => [t, e.tabelas[t].filter(r => !antes[t].has(r.id)).map(r => r.id)]));
    const resultado = { loteId: idDemo(), agendamentos: ids.agendamentos.length, transacoes: ids.transacoes_financeiras.length, despesas: ids.despesas_artista.length, lancamentos: ids.financeiro_lancamentos.length };
    e.tabelas.debug_lotes.unshift({ id: resultado.loteId, requestId: p.requestId, pedido: p, cenario: p.cenario, criado_em: agora(), data_base: p.data, resultado, removido_em: null, ids });
    return resultado;
  });
}
export function listarLotesLocais(perfilId: string): LoteDebug[] {
  return (estado.tabelas.debug_lotes || []).filter(l => [l.pedido.artistaId, l.pedido.clienteId].includes(perfilId)).slice(0, 15) as LoteDebug[];
}
export async function removerLoteLocal(id: string) {
  await alterarDemo(e => {
    const lote = e.tabelas.debug_lotes.find(l => l.id === id); if (!lote) throw new Error('Lote local não encontrado.');
    if (lote.removido_em) return;
    const ags: string[] = lote.ids.agendamentos;
    if (e.tabelas.notas_fiscais.some(n => ags.includes(n.agendamento_id)) || e.tabelas.fichas_anamnese.some(f => ags.includes(f.agendamento_id)) || e.tabelas.transacoes_financeiras.some(t => ags.includes(t.agendamento_id) && !lote.ids.transacoes_financeiras.includes(t.id))) throw new Error('Este lote já foi usado em outros registros. Restaure o cenário completo para preservar a consistência.');
    Object.entries(lote.ids).forEach(([t, ids]) => { e.tabelas[t] = e.tabelas[t].filter(r => !(ids as string[]).includes(r.id)); }); lote.removido_em = agora();
  });
}
