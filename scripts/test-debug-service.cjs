const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
let chamada;
const target = { exports: {} };
const client = { rpc: async (nome, args) => {
  chamada = { nome, args };
  return { data: { loteId: args.p_request_id, despesas: 1, agendamentos: 0, transacoes: 0, lancamentos: 0 }, error: null };
} };
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/debug-service.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
new Function('require', 'module', 'exports', source)((id) => id === './supabase' ? { supabase: client } : {}, target, target.exports);
const debug = target.exports;
async function run() {
  assert.equal(debug.CENARIOS_DEBUG.length, 18);
  assert.equal(new Set(debug.CENARIOS_DEBUG.map((c) => c.id)).size, 18);
  assert.deepEqual(debug.resolverAlvosDebug({ id: 'artista-selecionado', role: 'artista' }, 'cliente-demo'), {
    artistaId: 'artista-selecionado', clienteId: 'cliente-demo',
  });
  assert.deepEqual(debug.resolverAlvosDebug({ uid: 'cliente-selecionado', tipo_perfil: 'cliente' }, 'artista-demo'), {
    artistaId: 'artista-demo', clienteId: 'cliente-selecionado',
  });
  assert.throws(() => debug.resolverAlvosDebug(null, 'parceiro'));
  assert.throws(() => debug.resolverAlvosDebug({ id: 'mesmo', role: 'artista' }, 'mesmo'));
  const requestId = debug.novoIdDebug();
  assert.match(requestId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(requestId, debug.novoIdDebug());
  const pedido = { artistaId: 'a', clienteId: 'c', cenario: 'despesa_material', data: '2026-10-27', valor: 80, quantidade: 3, requestId };
  await debug.DebugService.gerarCenario(pedido);
  assert.deepEqual(chamada, { nome: 'debug_gerar_cenario', args: {
    p_artista_id: 'a', p_cliente_id: 'c', p_cenario: 'despesa_material', p_data: '2026-10-27', p_valor: 80, p_quantidade: 3, p_request_id: requestId,
  } });
  await debug.DebugService.gerarCenario(pedido);
  assert.equal(chamada.args.p_request_id, requestId, 'Repetir um pedido deve manter sua idempotência');
  client.rpc = async () => ({ data: null, error: { code: '42501', message: 'permission denied' } });
  await assert.rejects(() => debug.DebugService.gerarCenario(pedido), /permissão/);
  client.rpc = async () => ({ data: null, error: { code: 'P0001', message: 'Limite de teste atingido' } });
  await assert.rejects(() => debug.DebugService.gerarCenario(pedido), /Limite de teste/);
  console.log('Debug: catálogo, perfil ativo, seleção de parceiro, idempotência e erros aprovados.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
