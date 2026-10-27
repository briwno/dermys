export const camposDre = [
  ['receitaBruta', 'Receita operacional bruta'],
  ['deducoes', 'Deduções e tributos sobre receita'],
  ['custos', 'Custo dos serviços (materiais e repasses)'],
  ['vendas', 'Despesas com vendas e divulgação'],
  ['administrativas', 'Despesas administrativas'],
  ['depreciacao', 'Depreciação e amortização'],
  ['receitasFinanceiras', 'Receitas financeiras'],
  ['despesasFinanceiras', 'Despesas financeiras (taxas e juros)'],
  ['tributosLucro', 'IRPJ e CSLL sobre o lucro'],
] as const;

export type CampoDre = typeof camposDre[number][0];
export type ValoresDre = Record<CampoDre, number>;

export function valoresDreVazios(): ValoresDre {
  return Object.fromEntries(camposDre.map(([campo]) => [campo, 0])) as ValoresDre;
}

// Valores de entrada não negativos; resultados intermediários podem representar prejuízo.
export function calcularDre(valores: ValoresDre) {
  const centavos = (valor: number) => Math.round(valor * 100);
  const v = Object.fromEntries(camposDre.map(([campo]) => {
    const valor = valores[campo];
    if (!Number.isFinite(valor) || valor < 0 || !Number.isSafeInteger(centavos(valor))) {
      throw new Error('Os totais da DRE devem ser valores positivos dentro da precisão monetária suportada.');
    }
    return [campo, centavos(valor)];
  })) as ValoresDre;
  const receitaLiquida = v.receitaBruta - v.deducoes;
  const lucroBruto = receitaLiquida - v.custos;
  const operacional = lucroBruto - v.vendas - v.administrativas - v.depreciacao;
  const antesTributos = operacional + v.receitasFinanceiras - v.despesasFinanceiras;
  const liquido = antesTributos - v.tributosLucro;
  const margem = (valor: number) => receitaLiquida > 0 ? valor / receitaLiquida * 100 : null;
  return {
    receitaLiquida: receitaLiquida / 100,
    lucroBruto: lucroBruto / 100,
    operacional: operacional / 100,
    antesTributos: antesTributos / 100,
    liquido: liquido / 100,
    margemBruta: margem(lucroBruto),
    margemOperacional: margem(operacional),
    margemLiquida: margem(liquido),
  };
}

export function lerValorDre(texto: string): number {
  const limpo = texto.trim();
  if (!limpo) return 0;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(limpo)) {
    throw new Error('Use valores como 1.250,50, com até duas casas decimais.');
  }
  const valor = Number(limpo.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(valor) || valor > 999999999.99) {
    throw new Error('O valor máximo por campo é R$ 999.999.999,99.');
  }
  return valor;
}
