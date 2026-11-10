const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function carregar(nome) {
  const source = fs.readFileSync(path.join(__dirname, `../src/services/${nome}.ts`), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} };
  new Function('module', 'exports', compiled)(m, m.exports);
  return m.exports;
}
const { autenticarAposCadastro } = carregar('sessao-cadastro');
const { erroFinanceiro } = carregar('erro-financeiro');
(async () => {
  let tentativas = 0;
  const auth = { signInWithPassword: async () => { tentativas++; return { data: { session: {} }, error: null }; } };
  assert.equal(await autenticarAposCadastro(auth, {}, 'teste@example.com', 'senha-ficticia'), true);
  assert.equal(tentativas, 0, 'Sessão válida não deve provocar outro login');
  assert.equal(await autenticarAposCadastro(auth, null, 'teste@example.com', 'senha-ficticia'), true);
  assert.equal(tentativas, 1, 'Cadastro sem sessão tenta autenticar a conta confirmada');
  assert.equal(await autenticarAposCadastro({ signInWithPassword: async () => ({ data: { session: null }, error: { code: 'email_not_confirmed' } }) }, null, 'teste@example.com', 'senha-ficticia'), false);
  assert.equal(await autenticarAposCadastro({ signInWithPassword: async () => ({ data: { session: null }, error: null }) }, null, 'teste@example.com', 'senha-ficticia'), false, 'Usuário sem sessão não é login concluído');
  assert.match(erroFinanceiro({ code: '42501' }, 'genérico').message, /sessão/);
  assert.match(erroFinanceiro({ code: '23503' }, 'genérico').message, /removido/);
  assert.equal(erroFinanceiro(new Error('rede'), 'Tente novamente').message, 'Tente novamente');
  console.log('Cadastro: sessão real, conta confirmada e falha de autenticação verificados; erros financeiros diferenciados.');
})().catch(e => { console.error(e); process.exitCode = 1; });
