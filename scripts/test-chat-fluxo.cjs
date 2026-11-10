const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/services/chat-fluxo.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const target = { exports: {} };
new Function('module', 'exports', compiled)(target, target.exports);
const { obterFluxoAtendimento } = target.exports;
let sequencia = 0;
const msg = (tipo, agendamentoId) => ({ id: String(++sequencia), tipo_mensagem: tipo,
  card_payload: agendamentoId ? { agendamentoId } : undefined, conteudo: '',
  remetente_id: 'cliente', destinatario_id: 'artista', lida: false, criado_em: new Date().toISOString() });

const primeiro = ['briefing', 'quote', 'deposit_confirmed', 'session_completed'].map(t => msg(t, 'primeiro'));
assert.equal(obterFluxoAtendimento(primeiro).podePropor, false);
const novo = msg('briefing', 'segundo');
const novaConversa = [...primeiro, novo];
let fluxo = obterFluxoAtendimento(novaConversa);
assert.equal(fluxo.podePropor, true, 'Uma sessão concluída não bloqueia um novo pedido');
assert.equal(fluxo.ultimaProposta, undefined);
assert.equal(fluxo.ultimoSinal, undefined);
assert.equal(fluxo.ultimaSessaoConcluida, undefined);
assert.equal(fluxo.ultimoBriefing.id, novo.id);

const proposta = msg('quote', 'segundo');
fluxo = obterFluxoAtendimento([...novaConversa, proposta, msg('deposit_confirmed', 'primeiro')]);
assert.equal(fluxo.podePropor, false, 'O mesmo pedido não oferece proposta duplicada');
assert.equal(fluxo.ultimaProposta.id, proposta.id);
assert.equal(fluxo.ultimoSinal, undefined, 'Evento atrasado de outro pedido não confirma o atual');

const assinaturaAntiga = { ...msg('texto'), conteudo: 'Ficha de Saúde assinada' };
fluxo = obterFluxoAtendimento([...primeiro, assinaturaAntiga, novo]);
assert.equal(fluxo.temAnamneseAssinada, false, 'Assinatura antiga não vale para uma nova sessão');
assert.equal(obterFluxoAtendimento([]).podePropor, false);
const legado = [...primeiro, msg('briefing')];
assert.equal(obterFluxoAtendimento(legado).podePropor, true, 'Briefing legado sem ID usa somente as etapas posteriores');
assert.equal(obterFluxoAtendimento([msg('quote', 'direto'), msg('deposit_confirmed', 'direto')]).ultimoSinal.card_payload.agendamentoId, 'direto');
console.log('Chat: novos atendimentos, histórico, eventos atrasados e assinatura por sessão aprovados.');
