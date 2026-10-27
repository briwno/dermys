import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { ChevronLeft, ChevronRight, Download, Plus, RefreshCw } from 'lucide-react-native';
import { calcularDre, camposDre, CampoDre, lerValorDre, valoresDreVazios } from '@/services/dre';
import { DreService, LancamentoDre, limitesPeriodoDre, somarLancamentosDre } from '@/services/dre-service';
import { createThemedStyles, tc } from '@/theme';

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const origens = { manual: 'Manual', servico: 'Serviço concluído', despesa: 'Despesa registrada', taxa: 'Taxa de pagamento', estorno: 'Estorno confirmado' };

export function DrePainel({ artistaId }: { artistaId: string }) {
  const [periodo, setPeriodo] = useState(() => new Date());
  const [anual, setAnual] = useState(false);
  const [itens, setItens] = useState<LancamentoDre[]>([]);
  const [anterior, setAnterior] = useState(valoresDreVazios);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroForm, setErroForm] = useState('');
  const [aviso, setAviso] = useState('');
  const [form, setForm] = useState(false);
  const [edicaoId, setEdicaoId] = useState<string>();
  const [categoria, setCategoria] = useState<CampoDre>('custos');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [limite, setLimite] = useState(15);
  const [exclusao, setExclusao] = useState<string>();
  const requisicao = useRef(0);
  const ano = periodo.getFullYear(), mes = periodo.getMonth() + 1;
  const { inicio, fim } = limitesPeriodoDre(ano, anual ? null : mes);
  const tituloPeriodo = anual ? String(ano) : periodo.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const carregar = useCallback(async () => {
    const versao = ++requisicao.current;
    setCarregando(true); setErro(''); setLimite(15);
    const passado = new Date(ano - (anual ? 1 : 0), mes - 1 - (anual ? 0 : 1), 1);
    const prev = limitesPeriodoDre(passado.getFullYear(), anual ? null : passado.getMonth() + 1);
    try {
      const [atuais, antigos] = await Promise.all([DreService.listar(artistaId, inicio, fim), DreService.listar(artistaId, prev.inicio, prev.fim)]);
      if (versao !== requisicao.current) return;
      setItens(atuais); setAnterior(somarLancamentosDre(antigos));
    } catch (e) { if (versao === requisicao.current) setErro(e instanceof Error ? e.message : 'Não foi possível carregar a DRE.'); }
    finally { if (versao === requisicao.current) setCarregando(false); }
  }, [artistaId, inicio, fim, ano, mes, anual]);
  useEffect(() => {
    void carregar(); setAviso(''); setForm(false); setExclusao(undefined);
    return () => { ++requisicao.current; };
  }, [carregar]);

  function abrir(item?: LancamentoDre) {
    setEdicaoId(item?.id); setCategoria(item?.categoria ?? 'custos'); setDescricao(item?.descricao ?? '');
    setValor(item ? item.valor.toFixed(2).replace('.', ',') : ''); setData(item?.competencia ?? inicio);
    setErroForm(''); setForm(true); setAviso('');
  }
  async function salvar() {
    setErroForm(''); setSalvando(true);
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !Number.isFinite(Date.parse(data)) ||
        new Date(`${data}T12:00:00Z`).toISOString().slice(0, 10) !== data || data < inicio || data >= fim) {
        throw new Error('Informe uma data válida dentro do período selecionado (AAAA-MM-DD).');
      }
      await DreService.salvar(artistaId, { categoria, descricao, valor: lerValorDre(valor), competencia: data }, edicaoId);
      setForm(false); setAviso('Lançamento salvo e sincronizado.'); await carregar();
    } catch (e) { setErroForm(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  }
  async function excluir(id: string) {
    setSalvando(true);
    try { await DreService.excluir(artistaId, id); setExclusao(undefined); setAviso('Lançamento excluído.'); await carregar(); }
    catch (e) { setAviso(e instanceof Error ? e.message : 'Não foi possível excluir.'); }
    finally { setSalvando(false); }
  }

  const valores = somarLancamentosDre(itens), dre = calcularDre(valores);
  const linhas: [string, number, boolean][] = [
    ['Receita operacional bruta', valores.receitaBruta, false], ['(−) Deduções e tributos sobre receita', -valores.deducoes, false],
    ['Receita operacional líquida', dre.receitaLiquida, true], ['(−) Custo dos serviços prestados', -valores.custos, false],
    ['Lucro bruto', dre.lucroBruto, true], ['(−) Despesas com vendas', -valores.vendas, false],
    ['(−) Despesas administrativas', -valores.administrativas, false], ['(−) Depreciação e amortização', -valores.depreciacao, false],
    ['Resultado operacional (EBIT)', dre.operacional, true], ['(+) Receitas financeiras', valores.receitasFinanceiras, false],
    ['(−) Despesas financeiras', -valores.despesasFinanceiras, false], ['Resultado antes de IRPJ/CSLL', dre.antesTributos, true],
    ['(−) IRPJ e CSLL sobre o lucro', -valores.tributosLucro, false], ['Resultado líquido', dre.liquido, true],
  ];
  async function exportar() {
    const celula = (texto: string) => `"${(/^[=+@\-]/.test(texto.trimStart()) && !/^-?\d+,\d{2}$/.test(texto) ? "'" : '') + texto.replace(/"/g, '""')}"`;
    const csv = '\ufeff' + [
      ['DRE gerencial', tituloPeriodo], ['Conta', 'Valor (R$)'],
      ...linhas.map(([label, total]) => [label, total.toFixed(2).replace('.', ',')]), [],
      ['Competência', 'Descrição', 'Categoria', 'Origem', 'Valor (R$)'],
      ...itens.map((l) => [l.competencia, l.descricao, camposDre.find(([c]) => c === l.categoria)![1], origens[l.origem], l.valor.toFixed(2).replace('.', ',')]),
    ].map((linha) => linha.map(celula).join(';')).join('\r\n');
    try {
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = `dre-${anual ? ano : inicio.slice(0, 7)}.csv`;
        link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else await Share.share({ title: `DRE ${tituloPeriodo}`, message: csv });
    } catch { setAviso('Não foi possível exportar o relatório.'); }
  }
  const mover = (delta: number) => setPeriodo(new Date(ano + (anual ? delta : 0), mes - 1 + (anual ? 0 : delta), 1));

  return <View style={s.container}>
    <View style={s.row}><View style={s.flex}><Text style={s.eyebrow}>SEU ESTÚDIO EM NÚMEROS</Text><Text style={s.titulo}>Demonstrativo de resultado</Text></View><Pressable accessibilityLabel="Atualizar DRE" disabled={carregando || salvando || form} onPress={carregar} style={s.icone}><RefreshCw size={18} color={tc('#f3c21a')} /></Pressable></View>
    <View style={s.seletor}>{[false, true].map((opcao) => <Pressable key={String(opcao)} disabled={form || salvando} onPress={() => setAnual(opcao)} style={[s.opcao, anual === opcao && s.ativo]}><Text style={anual === opcao ? s.textoAtivo : s.texto}>{opcao ? 'Ano completo' : 'Mensal'}</Text></Pressable>)}</View>
    <View style={s.row}><Pressable accessibilityLabel="Período anterior" disabled={form || salvando} style={s.icone} onPress={() => mover(-1)}><ChevronLeft size={20} color={tc('#ddd')} /></Pressable><Text style={s.periodo}>{tituloPeriodo}</Text><Pressable accessibilityLabel="Próximo período" disabled={form || salvando} style={s.icone} onPress={() => mover(1)}><ChevronRight size={20} color={tc('#ddd')} /></Pressable></View>
    {aviso ? <Text accessibilityLiveRegion="polite" style={s.ajuda}>{aviso}</Text> : null}
    {carregando ? <ActivityIndicator color={tc('#f3c21a')} /> : erro ? <><Text accessibilityRole="alert" style={s.erro}>{erro}</Text><Pressable onPress={carregar} style={s.botao}><Text style={s.botaoTexto}>Tentar novamente</Text></Pressable></> : <>
      <View style={s.resultado}><Text style={s.ajuda}>{dre.liquido < 0 ? 'Prejuízo no período' : 'Resultado líquido do período'}</Text><Text style={[s.total, dre.liquido < 0 && s.erro]}>{moeda(dre.liquido)}</Text><Text style={s.ajuda}>{moeda(dre.liquido - calcularDre(anterior).liquido)} de diferença em relação ao {anual ? 'ano' : 'mês'} anterior</Text></View>
      <View style={s.acoes}><Pressable disabled={salvando || form} style={[s.botao, s.ativo]} onPress={() => abrir()}><Plus size={16} color={tc('#111')} /><Text style={s.textoAtivo}>Novo lançamento</Text></Pressable><Pressable disabled={salvando} style={s.botao} onPress={exportar}><Download size={16} color={tc('#ddd')} /><Text style={s.texto}>Exportar CSV</Text></Pressable></View>
      {form && <View style={s.formulario}>
        <Text style={s.subtitulo}>{edicaoId ? 'Editar lançamento' : 'Adicionar lançamento'}</Text>
        <Text style={s.ajuda}>Registre apenas valores que ainda não estão nas fontes automáticas. Informe tributos conforme sua apuração.</Text>
        <Text style={s.texto}>Categoria</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.acoes}>{camposDre.map(([campo, label]) => <Pressable key={campo} accessibilityState={{ selected: categoria === campo }} disabled={salvando} onPress={() => setCategoria(campo)} style={[s.botao, categoria === campo && s.ativo]}><Text style={categoria === campo ? s.textoAtivo : s.texto}>{label}</Text></Pressable>)}</ScrollView>
        <Text style={s.texto}>Descrição</Text><TextInput accessibilityLabel="Descrição do lançamento" editable={!salvando} value={descricao} onChangeText={setDescricao} maxLength={240} placeholder="Ex.: materiais para a sessão" placeholderTextColor={tc('#999')} style={s.input} />
        <Text style={s.texto}>Valor em reais</Text><TextInput accessibilityLabel="Valor do lançamento" editable={!salvando} keyboardType="decimal-pad" value={valor} onChangeText={setValor} placeholder="0,00" placeholderTextColor={tc('#999')} style={s.input} />
        <Text style={s.texto}>Data de competência (AAAA-MM-DD)</Text><TextInput accessibilityLabel="Data de competência" editable={!salvando} value={data} onChangeText={setData} maxLength={10} placeholder="2026-10-27" placeholderTextColor={tc('#999')} style={s.input} />
        {erroForm ? <Text accessibilityRole="alert" style={s.erro}>{erroForm}</Text> : null}
        <View style={s.acoes}><Pressable disabled={salvando} onPress={salvar} style={[s.botao, s.ativo]}><Text style={s.textoAtivo}>{salvando ? 'Salvando…' : 'Salvar lançamento'}</Text></Pressable><Pressable disabled={salvando} onPress={() => setForm(false)} style={s.botao}><Text style={s.texto}>Cancelar</Text></Pressable></View>
      </View>}
      <View>{linhas.map(([label, total, destaque], index) => <View key={label} style={[s.linha, destaque && s.destaque, index === linhas.length - 1 && s.linhaFinal]}><Text style={[s.label, destaque && s.negrito]}>{label}</Text><Text style={[s.valor, destaque && s.negrito]}>{moeda(total)}</Text></View>)}</View>
      <View style={s.acoes}>{[['Bruta', dre.margemBruta], ['Operacional', dre.margemOperacional], ['Líquida', dre.margemLiquida]].map(([label, margem]) => <View key={String(label)} style={s.margem}><Text style={s.ajuda}>{label}</Text><Text style={s.subtitulo}>{typeof margem === 'number' ? `${margem.toFixed(1).replace('.', ',')}%` : '—'}</Text></View>)}</View>
      <Text style={s.ajuda}>Margens sobre a receita líquida. Serviços entram na conclusão (ou na data agendada, se não houver conclusão registrada). Sinais futuros não entram na receita. Taxas avulsas seguem o pagamento. Notas e impostos estimados não são somados novamente.</Text>
      <View style={s.row}><Text style={s.subtitulo}>Lançamentos do período</Text><Text style={s.ajuda}>{itens.length} registros</Text></View>
      {itens.length === 0 && <Text style={s.ajuda}>Sem movimentações neste período. Serviços concluídos e despesas aparecerão aqui automaticamente.</Text>}
      {itens.slice(0, limite).map((item) => <View key={item.id} style={s.movimento}><View style={s.row}><Text style={[s.texto, s.flex]}>{item.descricao}</Text><Text style={s.negrito}>{moeda(item.valor)}</Text></View><Text style={s.ajuda}>{item.competencia.split('-').reverse().join('/')} · {origens[item.origem]}</Text><Text style={s.ajuda}>{camposDre.find(([c]) => c === item.categoria)?.[1]}</Text>
        {item.editavel && <View style={s.acoes}><Pressable disabled={salvando || form} onPress={() => abrir(item)} style={s.botao}><Text style={s.botaoTexto}>Editar</Text></Pressable><Pressable disabled={salvando || form} onPress={() => setExclusao(exclusao === item.id ? undefined : item.id)} style={s.botao}><Text style={s.texto}>Excluir</Text></Pressable>{exclusao === item.id && <Pressable disabled={salvando} onPress={() => excluir(item.id)} style={s.botao}><Text style={s.erro}>Confirmar exclusão</Text></Pressable>}</View>}
      </View>)}
      {limite < itens.length && <Pressable style={s.botao} onPress={() => setLimite(limite + 15)}><Text style={s.botaoTexto}>Ver mais lançamentos</Text></Pressable>}
      <Text style={s.ajuda}>Sincronizado com sua conta • DRE gerencial por competência. Revise a classificação e os tributos com seu contador.</Text>
    </>}
  </View>;
}

const s = createThemedStyles({
  container: { backgroundColor: '#111113', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#29292d', gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  flex: { flex: 1, minWidth: 130 },
  eyebrow: { color: '#f3c21a', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  titulo: { color: '#fff', fontSize: 21, fontWeight: '700', lineHeight: 27 },
  subtitulo: { color: '#f4f4f5', fontSize: 15, fontWeight: '700' },
  ajuda: { color: '#a1a1aa', fontSize: 12, lineHeight: 18 },
  texto: { color: '#e4e4e7', fontSize: 13, lineHeight: 19 },
  seletor: { flexDirection: 'row', backgroundColor: '#1c1c20', padding: 4, borderRadius: 12 },
  opcao: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 9 },
  ativo: { backgroundColor: '#f3c21a' },
  textoAtivo: { color: '#111', fontSize: 13, fontWeight: '700' },
  periodo: { color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize', flexShrink: 1, textAlign: 'center' },
  icone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  resultado: { backgroundColor: '#202016', padding: 16, borderRadius: 14, gap: 7 },
  total: { color: '#f3c21a', fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botao: { padding: 12, borderRadius: 10, backgroundColor: '#252529', alignItems: 'center', justifyContent: 'center', minHeight: 44, flexDirection: 'row', gap: 8 },
  botaoTexto: { color: '#f3c21a', fontWeight: '700', fontSize: 13 },
  formulario: { gap: 12, borderWidth: 1, borderColor: '#45454b', padding: 12, borderRadius: 12 },
  input: { color: '#fff', borderColor: '#55555f', borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderBottomColor: '#29292d', borderBottomWidth: 1 },
  destaque: { backgroundColor: '#202023', borderRadius: 8 },
  linhaFinal: { borderColor: '#f3c21a', borderWidth: 1, marginTop: 8 },
  label: { color: '#d4d4d8', fontSize: 13, lineHeight: 19, flexGrow: 1, flexShrink: 1, flexBasis: 155 },
  valor: { color: '#f4f4f5', fontSize: 13, textAlign: 'right', lineHeight: 19 },
  negrito: { color: '#f4f4f5', fontWeight: '700', fontSize: 13 },
  erro: { color: '#f87171', fontSize: 13, lineHeight: 19 },
  margem: { flex: 1, minWidth: 80, backgroundColor: '#202023', padding: 10, borderRadius: 10, gap: 5 },
  movimento: { borderTopWidth: 1, borderTopColor: '#303036', paddingTop: 12, gap: 7 },
});
