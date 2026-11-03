import { alterarDemo, demoAtiva, emitirEventoDemo, idDemo, notificarAlteracaoDemo, snapshotDemo, type RegistroDemo } from './apresentacao-store';

type Filtro = (r: RegistroDemo) => boolean;
// Subconjunto explícito usado pelas telas. Operações não suportadas falham e nunca vão à rede.
function separar(expr: string): string[] {
  let nivel = 0, inicio = 0; const partes: string[] = [];
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === '(') nivel++; if (expr[i] === ')') nivel--;
    if (expr[i] === ',' && nivel === 0) { partes.push(expr.slice(inicio, i)); inicio = i + 1; }
  }
  partes.push(expr.slice(inicio)); return partes;
}
function expressao(expr: string): Filtro {
  if (expr.startsWith('and(') && expr.endsWith(')')) { const fs = separar(expr.slice(4, -1)).map(expressao); return r => fs.every(f => f(r)); }
  if (expr.startsWith('or(') && expr.endsWith(')')) { const fs = separar(expr.slice(3, -1)).map(expressao); return r => fs.some(f => f(r)); }
  const m = expr.match(/^([a-z_]+)\.(eq|neq)\.(.+)$/);
  if (!m) throw new Error('Filtro indisponível na apresentação.');
  return r => m[2] === 'eq' ? String(r[m[1]]) === m[3] : String(r[m[1]]) !== m[3];
}
export class ConsultaDemo implements PromiseLike<any> {
  private filtros: Filtro[] = [];
  private acao: 'ler' | 'inserir' | 'atualizar' | 'excluir' | 'upsert' = 'ler';
  private valores: RegistroDemo[] = [];
  private unico = false;
  private opcional = false;
  private inicio = 0;
  private fim = Infinity;
  private ordens: { campo: string; asc: boolean }[] = [];
  private selecao = '*';
  private conflito = 'id';
  private execucao?: Promise<any>;
  constructor(private tabela: string) {}
  select(colunas = '*') { this.selecao = colunas; return this; }
  insert(dados: RegistroDemo | RegistroDemo[]) { this.acao = 'inserir'; this.valores = Array.isArray(dados) ? dados : [dados]; return this; }
  upsert(dados: RegistroDemo | RegistroDemo[], op?: { onConflict?: string }) { this.insert(dados); this.acao = 'upsert'; this.conflito = op?.onConflict || 'id'; return this; }
  update(dados: RegistroDemo) { this.acao = 'atualizar'; this.valores = [dados]; return this; }
  delete() { this.acao = 'excluir'; return this; }
  eq(c: string, v: any) { this.filtros.push(r => r[c] === v); return this; }
  neq(c: string, v: any) { this.filtros.push(r => r[c] !== v); return this; }
  in(c: string, vs: any[]) { this.filtros.push(r => vs.includes(r[c])); return this; }
  gte(c: string, v: any) { this.filtros.push(r => r[c] >= v); return this; }
  lte(c: string, v: any) { this.filtros.push(r => r[c] <= v); return this; }
  gt(c: string, v: any) { this.filtros.push(r => r[c] > v); return this; }
  lt(c: string, v: any) { this.filtros.push(r => r[c] < v); return this; }
  match(dados: RegistroDemo) { Object.entries(dados).forEach(([c, v]) => this.eq(c, v)); return this; }
  or(expr: string) { const fs = separar(expr).map(expressao); this.filtros.push(r => fs.some(f => f(r))); return this; }
  order(campo: string, op?: { ascending?: boolean }) { this.ordens.push({ campo, asc: op?.ascending !== false }); return this; }
  limit(n: number) { this.fim = n - 1; return this; }
  range(inicio: number, fim: number) { this.inicio = inicio; this.fim = fim; return this; }
  single() { this.unico = true; return this; }
  maybeSingle() { this.unico = true; this.opcional = true; return this; }
  private async executar() {
    try {
      if (!demoAtiva()) throw new Error('O ambiente de apresentação foi encerrado. Atualize a tela.');
      const tabelas = snapshotDemo().tabelas;
      if (!Array.isArray(tabelas[this.tabela])) throw new Error(`Tabela ${this.tabela} indisponível na apresentação.`);
      let linhas: RegistroDemo[] = [];
      if (this.acao === 'ler') linhas = tabelas[this.tabela].filter(r => this.filtros.every(f => f(r)));
      else {
        await alterarDemo(e => {
          const tabela = e.tabelas[this.tabela];
          const alvos = tabela.filter(r => this.filtros.every(f => f(r)));
          if (this.acao === 'inserir' || this.acao === 'upsert') {
            for (const valor of this.valores) {
              let r = this.acao === 'upsert' ? tabela.find(r => r[this.conflito] === valor[this.conflito]) : undefined;
              if (r) Object.assign(r, valor);
              else { r = { id: idDemo(), criado_em: new Date().toISOString(), ...valor }; tabela.push(r); }
              linhas.push(r);
            }
          } else if (this.acao === 'atualizar') { alvos.forEach(r => Object.assign(r, this.valores[0])); linhas = alvos; }
          else { e.tabelas[this.tabela] = tabela.filter(r => !alvos.includes(r)); linhas = alvos; }
          if (this.tabela === 'agendamentos' && linhas.some(a => !['pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado'].includes(a.status))) throw new Error('Status de agendamento inválido.');
          if (this.acao !== 'excluir') linhas.forEach(r => notificarAlteracaoDemo(e, this.tabela, r));
        });
        linhas.forEach(r => emitirEventoDemo(this.tabela, r));
      }
      linhas = JSON.parse(JSON.stringify(linhas));
      // Mesmas relações que as consultas das telas solicitam ao PostgREST.
      linhas = linhas.map(r => {
        const rel = { ...r };
        if (this.selecao.includes('flashes:')) rel.flashes = tabelas.flashes_portfolio.filter(f => f.artista_id === r.id);
        for (const alias of ['artista', 'cliente', 'agendamento', 'fiscal_profiles']) {
          if (!this.selecao.includes(`${alias}:`) && !this.selecao.includes(`${alias}(`)) continue;
          rel[alias] = alias === 'agendamento' ? tabelas.agendamentos.find(a => a.id === r.agendamento_id)
            : alias === 'fiscal_profiles' ? tabelas.fiscal_profiles.find(p => p.id === r.fiscal_profile_id)
            : tabelas.profiles.find(p => p.id === r[`${alias}_id`]);
        }
        return rel;
      });
      for (const { campo, asc } of [...this.ordens].reverse()) linhas.sort((a, b) => (a[campo] < b[campo] ? -1 : a[campo] > b[campo] ? 1 : 0) * (asc ? 1 : -1));
      const count = linhas.length; linhas = linhas.slice(this.inicio, this.fim === Infinity ? undefined : this.fim + 1);
      if (this.unico && (linhas.length > 1 || (!this.opcional && linhas.length !== 1))) return { data: null, error: { code: 'PGRST116', message: 'Registro não encontrado ou resultado ambíguo.' }, count };
      return { data: this.unico ? linhas[0] || null : linhas, error: null, count };
    } catch (e) { return { data: null, error: { code: 'DEMO_ERROR', message: e instanceof Error ? e.message : 'Falha no ambiente local.' } }; }
  }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    this.execucao ??= this.executar(); return this.execucao.then(onfulfilled, onrejected);
  }
}
