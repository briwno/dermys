const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const arquivos = new Map();
const disco = new Map();
let falharStorage = false;
const storage = {
  getItem: async key => disco.get(key) ?? null,
  setItem: async (key, valor) => { if (falharStorage) throw new Error('Disco cheio'); disco.set(key, valor); },
};
let rede = 0;
const remoto = { from: () => { rede++; throw new Error('Rede consultada'); }, rpc: () => { rede++; }, auth: { getSession: async () => ({ data: { session: null } }) } };
function carregar(nome) {
  const arquivo = path.resolve(__dirname, '../src', nome.endsWith('.ts') ? nome : `${nome}.ts`);
  if (arquivos.has(arquivo)) return arquivos.get(arquivo).exports;
  const modulo = { exports: {} }; arquivos.set(arquivo, modulo);
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', codigo)(id => {
    if (id === '@react-native-async-storage/async-storage') return storage;
    if (id === 'expo-asset') return { Asset: { fromModule: modulo => ({ uri: `asset:${modulo}` }) } };
    if (id.endsWith('.jpg')) return id;
    if (id === './supabase') return { supabase: remoto };
    if (id.startsWith('@/')) return carregar(id.slice(2));
    if (id.startsWith('.')) return carregar(path.relative(path.resolve(__dirname, '../src'), path.resolve(path.dirname(arquivo), id)));
    throw new Error(`Dependência não simulada: ${id}`);
  }, modulo, modulo.exports);
  return modulo.exports;
}
async function run() {
  const s = carregar('services/apresentacao-store');
  const { supabase: db } = carregar('services/data-client');
  const { DreService, somarLancamentosDre } = carregar('services/dre-service');
  const { calcularDre } = carregar('services/dre');
  const { DebugService, CENARIOS_DEBUG } = carregar('services/debug-service');
  const { ChatService } = carregar('services/chat-service');
  const mp = carregar('services/mercadopago');
  await s.prepararApresentacao();
  assert.equal(s.demoAtiva(), true);
  assert.equal(s.snapshotDemo().tabelas.profiles.length, 9);
  const totais = async () => somarLancamentosDre(await DreService.listar(s.ARTISTA_DEMO, '2000-01-01', '2100-01-01'));
  const base = await totais(); assert.equal(base.receitaBruta, 1800); assert.equal(base.custos, 180); assert.equal(base.administrativas, 250);
  await s.avancarApresentacao();
  const id = s.snapshotDemo().jornadaId;
  let consulta = await db.from('agendamentos').select('*, artista:profiles(*), cliente:profiles(*)').eq('id', id).single();
  assert.equal(consulta.data.status, 'pendente'); assert.equal(consulta.data.artista.nome_exibicao, 'Camila Rossi');
  await s.simularAcaoApresentacao('recusar'); assert.equal((await totais()).receitaBruta, 1800);
  await s.avancarApresentacao(); // sinal em custódia
  assert.equal(s.snapshotDemo().tabelas.agendamentos.find(a => a.id === id).sinal_pago, true);
  assert.equal((await totais()).receitaBruta, 1800, 'Custódia não é receita');
  await s.avancarApresentacao(); // atendimento
  assert.equal((await totais()).receitaBruta, 1800);
  await s.avancarApresentacao(); // quitação
  assert.equal((await totais()).receitaBruta, 2400); assert.equal((await totais()).custos, 270);
  await s.avancarApresentacao(); await s.avancarApresentacao();
  assert.equal(s.snapshotDemo().tabelas.notas_fiscais.length, 1);
  assert.equal((await totais()).receitaBruta, 2400, 'Recibo não duplica a receita');
  await s.simularAcaoApresentacao('estornar');
  assert.equal((await totais()).deducoes, 150);
  await assert.rejects(() => s.simularAcaoApresentacao('estornar'), /já recebeu/);
  const estadoFinal = JSON.stringify(s.snapshotDemo());
  await s.restaurarDemoSalva(); assert.equal(JSON.stringify(s.snapshotDemo()), estadoFinal, 'Restaura jornada e dados salvos');
  assert.ok(s.snapshotDemo().avisos.some(a => a.perfilId === s.CLIENTE_DEMO));
  await s.marcarAvisosLidos(s.CLIENTE_DEMO); assert.ok(s.snapshotDemo().avisos.filter(a => a.perfilId === s.CLIENTE_DEMO).every(a => a.lida));

  await s.prepararApresentacao();
  await s.avancarApresentacao(); await s.simularAcaoApresentacao('cancelar');
  await assert.rejects(() => s.avancarApresentacao(), /cancelada/);
  await s.prepararApresentacao();
  for (const c of CENARIOS_DEBUG) {
    const pedido = { artistaId: s.ARTISTA_DEMO, clienteId: s.CLIENTE_DEMO, cenario: c.id, data: '2026-11-03', valor: 600, quantidade: 1, requestId: s.idDemo() };
    const antes = await totais();
    const lote = await DebugService.gerarCenario(pedido);
    assert.ok(lote.agendamentos + lote.transacoes + lote.despesas + lote.lancamentos > 0, c.id);
    assert.deepEqual(await DebugService.gerarCenario(pedido), lote, 'Idempotência local');
    if (c.id === 'dre_completa') {
      const depois = await totais();
      for (const campo of Object.keys(antes)) assert.ok(depois[campo] > antes[campo], `Categoria ${campo}`);
    }
    if (['mes_lucrativo', 'mes_prejuizo'].includes(c.id)) {
      const depois = await totais(); const diferenca = Object.fromEntries(Object.keys(antes).map(k => [k, Math.round((depois[k] - antes[k]) * 100) / 100]));
      assert.equal(calcularDre(diferenca).liquido, c.id === 'mes_lucrativo' ? 390 : -300);
    }
    await DebugService.removerLote(lote.loteId); assert.deepEqual(await totais(), antes, `Limpeza ${c.id}`);
  }
  // Consultas reais das telas e persistência do chat sem contaminar o cache remoto.
  let recebidas = 0;
  const cancelar = ChatService.inscreverRealtime(s.ARTISTA_DEMO, s.CLIENTE_DEMO, () => recebidas++);
  await ChatService.enviarMensagem(s.CLIENTE_DEMO, s.ARTISTA_DEMO, 'Teste local de conversa'); cancelar();
  assert.equal(recebidas, 1);
  assert.ok((await ChatService.carregarMensagens(s.CLIENTE_DEMO, s.ARTISTA_DEMO)).some(m => m.conteudo === 'Teste local de conversa'));
  assert.ok((await ChatService.listarConversas(s.ARTISTA_DEMO)).some(c => c.contato_id === s.CLIENTE_DEMO));
  assert.equal(disco.has('@dermys:chat_cache_mensagens'), false);
  const desconhecida = await db.from('tabela_desconhecida').insert({ teste: true });
  assert.ok(desconhecida.error); assert.equal(rede, 0, 'Nenhuma operação local acessa a rede');

  // Fluxo pelos serviços usados pelo formulário e pela agenda, independente do roteiro.
  const reserva = await db.from('agendamentos').insert({ artista_id: s.ARTISTA_DEMO, cliente_id: s.CLIENTE_DEMO, status: 'pendente', valor_total: 600, data_horario: new Date().toISOString() }).select().single();
  const cobranca = await mp.criarCobrancaSinal({ agendamentoId: reserva.data.id, artistaId: s.ARTISTA_DEMO, clienteId: s.CLIENTE_DEMO, valorSinal: 180, artistaNome: 'Camila' });
  assert.match(cobranca.qrCodePayload, /DEMONSTRACAO/);
  assert.equal(s.snapshotDemo().tabelas.agendamentos.find(a => a.id === reserva.data.id).sinal_pago, false);
  await mp.confirmarSinalSimulado(reserva.data.id);
  assert.equal(s.snapshotDemo().tabelas.agendamentos.find(a => a.id === reserva.data.id).status, 'confirmado');
  await mp.criarCobrancaFinal({ agendamentoId: reserva.data.id, artistaId: s.ARTISTA_DEMO, clienteId: s.CLIENTE_DEMO, valorFinal: 600, valorSinalJaPago: 180, metodo: 'pix', artistaNome: 'Camila' });
  const antesErro = JSON.stringify(s.snapshotDemo());
  falharStorage = true;
  const falha = await db.from('agendamentos').update({ status: 'concluido' }).eq('id', reserva.data.id);
  assert.ok(falha.error); assert.equal(JSON.stringify(s.snapshotDemo()), antesErro, 'Falha de persistência não altera o estado');
  falharStorage = false;
  const invalido = await db.from('agendamentos').update({ status: 'CONCLUIDO' }).eq('id', reserva.data.id);
  assert.ok(invalido.error); assert.equal(JSON.stringify(s.snapshotDemo()), antesErro, 'Status inválido reverte toda a mudança');
  await s.prepararApresentacao(); assert.equal(s.snapshotDemo().passo, 0); assert.equal(s.snapshotDemo().jornadaId, null);
  assert.equal(s.snapshotDemo().tabelas.notas_fiscais.length, 0);
  await s.sairApresentacao(); assert.equal(s.demoAtiva(), false);
  assert.equal(rede, 0);
  console.log('Apresentação: jornada, DRE, estorno, restauração, 18 cenários, idempotência, consultas, chat, pagamentos e isolamento aprovados.');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
