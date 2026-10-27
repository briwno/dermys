const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, dependencies) {
  const target = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)((id) => dependencies[id], target, target.exports);
  return target.exports;
}
async function run() {
  const storage = new Map();
  const auth = load('persona-teste.ts', {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => { storage.set(key, value); },
      removeItem: async (key) => { storage.delete(key); },
    },
  });
  assert.equal(auth.deveCarregarPerfilAuth('SIGNED_IN', 'bruno', null), true);
  assert.equal(auth.deveCarregarPerfilAuth('SIGNED_IN', 'bruno', 'bruno'), false);
  assert.equal(auth.deveCarregarPerfilAuth('TOKEN_REFRESHED', 'bruno', null), false);
  await auth.selecionarPersonaTeste('camila');
  for (const event of ['TOKEN_REFRESHED', 'SIGNED_IN', 'USER_UPDATED', 'INITIAL_SESSION']) {
    assert.equal(auth.deveCarregarPerfilAuth(event, 'bruno', null), false);
  }
  assert.equal(await auth.restaurarPersonaTeste(['camila']), 'camila');
  const restauracao = auth.restaurarPersonaTeste(['camila', 'maya']);
  await auth.selecionarPersonaTeste('maya');
  await restauracao;
  assert.equal(auth.obterPersonaTeste(), 'maya', 'Restauração antiga não sobrescreve troca em voo');
  await auth.selecionarPersonaTeste(null);
  assert.equal(await auth.restaurarPersonaTeste(['camila']), null);
  assert.equal(auth.deveCarregarPerfilAuth('SIGNED_IN', 'bruno', null), true);

  const dre = load('dre.ts', {});
  let consultas = 0;
  const servico = load('dre-service.ts', {
    './dre': dre,
    './supabase': { supabase: { rpc: (nome) => {
      if (nome === 'financeiro_pode_acessar') return Promise.resolve({ data: true, error: null });
      return { range: async (inicio, fim) => {
        consultas++;
        const pagina = Array.from({ length: inicio === 0 ? 1000 : 1 }, (_, i) => ({
          id: String(inicio + i), categoria: 'custos', valor: '0.10', competencia: '2026-10-01', origem: 'manual', editavel: true,
        }));
        return { data: pagina, error: null };
      } };
    } } },
  });
  assert.deepEqual(servico.limitesPeriodoDre(2026, 12), { inicio: '2026-12-01', fim: '2027-01-01' });
  assert.deepEqual(servico.limitesPeriodoDre(2024, null), { inicio: '2024-01-01', fim: '2025-01-01' });
  const linhas = await servico.DreService.listar('camila', '2026-10-01', '2026-11-01');
  assert.equal(consultas, 2);
  assert.equal(linhas.length, 1001, 'DRE não pode ser truncada no limite do Data API');
  assert.equal(servico.somarLancamentosDre(linhas).custos, 100.1);
  assert.throws(() => servico.somarLancamentosDre([{ categoria: 'invalida', valor: 10 }]));
  console.log('Persona: refresh, foco, restauração e corrida aprovados. DRE: períodos, paginação e centavos aprovados.');
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
