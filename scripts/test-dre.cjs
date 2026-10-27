const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/services/dre.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const target = { exports: {} };
new Function('module', 'exports', compiled)(target, target.exports);
const { calcularDre, valoresDreVazios, lerValorDre } = target.exports;

const exemplo = {
  ...valoresDreVazios(), receitaBruta: 500000, deducoes: 50000,
  custos: 180000, vendas: 30000, administrativas: 90000,
  despesasFinanceiras: 10000, tributosLucro: 21000,
};
const resultado = calcularDre(exemplo);
assert.equal(resultado.receitaLiquida, 450000);
assert.equal(resultado.lucroBruto, 270000);
assert.equal(resultado.operacional, 150000);
assert.equal(resultado.antesTributos, 140000);
assert.equal(resultado.liquido, 119000);
assert.equal(resultado.margemBruta, 60);
assert.equal(resultado.margemLiquida.toFixed(1), '26.4');
assert.equal(calcularDre(valoresDreVazios()).margemLiquida, null);
assert.equal(calcularDre({ ...valoresDreVazios(), custos: 25 }).liquido, -25);
assert.equal(calcularDre({ ...valoresDreVazios(), receitaBruta: 0.3, custos: 0.1 }).liquido, 0.2);
assert.equal(calcularDre({ ...valoresDreVazios(), receitasFinanceiras: 10, depreciacao: 3 }).liquido, 7);
assert.equal(lerValorDre('1.250,50'), 1250.5);
assert.equal(lerValorDre(''), 0);
for (const invalido of ['-10', '1,234', '1.25', 'abc', 'Infinity', '1000000000']) {
  assert.throws(() => lerValorDre(invalido));
}
assert.throws(() => calcularDre({ ...exemplo, custos: NaN }));
console.log('DRE: exemplo de referência, margens, prejuízo, centavos e validação aprovados.');
