import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Database, Play, RefreshCw, Square, Trash2 } from 'lucide-react-native';
import { CENARIOS_DEBUG, DebugService, novoIdDebug, resolverAlvosDebug, type CenarioDebug, type LoteDebug, type PedidoDebug, type ResultadoDebug } from '@/services/debug-service';
import { lerValorDre } from '@/services/dre';
import { useDebug } from './debug-context';
import { PERSONAS_TESTE } from './types';

const GRUPOS = ['Pagamentos', 'Despesas', 'Agenda', 'Cenários completos', 'Histórico'] as const;
const resumir = (r: ResultadoDebug) => [
  r.agendamentos && `${r.agendamentos} agendamento(s)`, r.transacoes && `${r.transacoes} transação(ões)`,
  r.despesas && `${r.despesas} despesa(s)`, r.lancamentos && `${r.lancamentos} lançamento(s) DRE`,
].filter(Boolean).join(' · ');
const hojeLocal = () => {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
};

export function DebugSimulador() {
  const { perfilAtual, atualizarDadosTeste, navegarParaAba, setMenuAberto } = useDebug();
  const perfilId = perfilAtual?.id || perfilAtual?.uid || '';
  const artista = perfilAtual?.role === 'artista' || perfilAtual?.tipo_perfil === 'artista';
  const parceiros = PERSONAS_TESTE.filter((p) => p.tipo === (artista ? 'cliente' : 'artista') && p.id !== perfilId);
  const [outroId, setOutroId] = useState(() => parceiros[0]?.id ?? '');
  const [grupo, setGrupo] = useState<typeof GRUPOS[number]>('Pagamentos');
  const [valor, setValor] = useState('600,00');
  const [data, setData] = useState(hojeLocal);
  const [quantidade, setQuantidade] = useState(1);
  const [ocupado, setOcupado] = useState(false);
  const [feedback, setFeedback] = useState<{ erro: boolean; texto: string }>();
  const [pendente, setPendente] = useState<PedidoDebug>();
  const [lotes, setLotes] = useState<LoteDebug[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState('');
  const [confirmarRemocao, setConfirmarRemocao] = useState<string>();
  const [automatico, setAutomatico] = useState(false);
  const [ciclos, setCiclos] = useState(0);
  const trava = useRef(false);
  const perfilRef = useRef(perfilId);
  perfilRef.current = perfilId;
  const versaoHistorico = useRef(0);
  const atualizarRef = useRef(atualizarDadosTeste);
  atualizarRef.current = atualizarDadosTeste;
  const bloqueado = ocupado || automatico || !!pendente;

  const carregarHistorico = useCallback(async () => {
    if (!perfilId) return;
    const versao = ++versaoHistorico.current;
    setCarregandoHistorico(true); setErroHistorico('');
    try {
      const registros = await DebugService.listarLotes(perfilId);
      if (perfilRef.current === perfilId && versao === versaoHistorico.current) setLotes(registros);
    } catch (e) { if (perfilRef.current === perfilId && versao === versaoHistorico.current) setErroHistorico(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'); }
    finally { if (perfilRef.current === perfilId && versao === versaoHistorico.current) setCarregandoHistorico(false); }
  }, [perfilId]);

  useEffect(() => {
    setOutroId(PERSONAS_TESTE.find((p) => p.tipo === (artista ? 'cliente' : 'artista') && p.id !== perfilId)?.id ?? '');
    setAutomatico(false); setCiclos(0); setPendente(undefined); setFeedback(undefined); setLotes([]); setConfirmarRemocao(undefined);
    void carregarHistorico();
    return () => { ++versaoHistorico.current; };
  }, [perfilId, artista, carregarHistorico]);

  function montarPedido(cenario: CenarioDebug, umaVez = false): PedidoDebug {
    const alvos = resolverAlvosDebug(perfilAtual, outroId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !Number.isFinite(Date.parse(data)) || new Date(`${data}T12:00:00Z`).toISOString().slice(0, 10) !== data) throw new Error('Informe a data base no formato AAAA-MM-DD.');
    const valorBase = lerValorDre(valor);
    if (valorBase < 1 || valorBase > 10000) throw new Error('Use um valor base entre R$ 1 e R$ 10.000.');
    return { ...alvos, cenario, data, valor: valorBase, quantidade: umaVez ? 1 : quantidade, requestId: novoIdDebug() };
  }

  async function executar(pedido: PedidoDebug) {
    if (trava.current) return false;
    trava.current = true; setOcupado(true); setFeedback(undefined);
    const perfilInicial = perfilId;
    try {
      const resultado = await DebugService.gerarCenario(pedido);
      atualizarRef.current();
      if (perfilRef.current === perfilInicial) {
        setPendente(undefined); setFeedback({ erro: false, texto: `Criado no perfil selecionado: ${resumir(resultado)}.` });
        await carregarHistorico();
      }
      return true;
    } catch (e) {
      if (perfilRef.current === perfilInicial) {
        setPendente(pedido); setFeedback({ erro: true, texto: e instanceof Error ? e.message : 'Não foi possível gerar o cenário.' });
      }
      return false;
    } finally { trava.current = false; setOcupado(false); }
  }

  async function gerar(cenario: CenarioDebug) {
    try { await executar(montarPedido(cenario)); }
    catch (e) { setFeedback({ erro: true, texto: e instanceof Error ? e.message : 'Confira os campos.' }); }
  }

  // Simulação local, finita: cessa ao fechar o painel ou trocar de perfil.
  const executarRef = useRef(executar); executarRef.current = executar;
  const montarRef = useRef(montarPedido); montarRef.current = montarPedido;
  useEffect(() => {
    if (!automatico) return;
    let ativo = true, feitos = 0;
    const sequencia: CenarioDebug[] = ['pix_liberado', 'despesa_material', 'cartao_aprovado', 'despesa_estudio', 'estorno_parcial'];
    async function ciclo() {
      if (!ativo || trava.current || feitos >= sequencia.length || perfilRef.current !== perfilId) return;
      try {
        const sucesso = await executarRef.current(montarRef.current(sequencia[feitos], true));
        if (!ativo) return;
        if (!sucesso) { setAutomatico(false); return; }
        feitos++; setCiclos(feitos);
        if (feitos === sequencia.length) setAutomatico(false);
      } catch (e) {
        if (ativo) { setFeedback({ erro: true, texto: e instanceof Error ? e.message : 'Falha na simulação.' }); setAutomatico(false); }
      }
    }
    const timer = setInterval(() => { void ciclo(); }, 10000);
    void ciclo();
    return () => { ativo = false; clearInterval(timer); };
  }, [automatico, perfilId]);

  async function remover(loteId: string) {
    if (trava.current) return;
    trava.current = true; setOcupado(true);
    const perfilInicial = perfilId;
    try {
      await DebugService.removerLote(loteId); atualizarRef.current();
      if (perfilRef.current === perfilInicial) {
        setConfirmarRemocao(undefined); setFeedback({ erro: false, texto: 'Somente os registros deste lote foram removidos.' }); await carregarHistorico();
      }
    } catch (e) { if (perfilRef.current === perfilInicial) setFeedback({ erro: true, texto: e instanceof Error ? e.message : 'Não foi possível remover o lote.' }); }
    finally { trava.current = false; setOcupado(false); }
  }

  if (!perfilId) return <Text style={s.texto}>Selecione um perfil nas ferramentas de teste para começar.</Text>;
  return <View style={s.stack}>
    <View style={s.contexto}>
      <Text style={s.eyebrow}>GERAR NO PERFIL ATIVO</Text>
      <Text style={s.titulo}>{perfilAtual?.nomeExibicao || perfilAtual?.nome_exibicao || 'Perfil selecionado'}</Text>
      <Text style={s.ajuda}>{artista ? 'Artista: receitas e despesas serão deste perfil.' : 'Cliente: agendamentos e pagamentos serão deste perfil. Despesas e DRE pertencem ao artista escolhido abaixo.'}</Text>
      <Text style={s.ajuda}>Os dados são acrescentados no Supabase com identificação de teste, sem substituir os existentes. Nenhuma cobrança, nota fiscal ou mensagem é enviada.</Text>
    </View>
    <Text style={s.label}>{artista ? 'Cliente de demonstração' : 'Artista do cenário'}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.linha}>{parceiros.map((p) => <Pressable key={p.id} disabled={bloqueado} onPress={() => setOutroId(p.id)} style={[s.chip, outroId === p.id && s.selecionado]} accessibilityState={{ selected: outroId === p.id }}><Text style={outroId === p.id ? s.textoAtivo : s.texto}>{p.nome}</Text></Pressable>)}</ScrollView>
    <View style={s.campos}>
      <View style={s.campo}><Text style={s.label}>Valor base (R$)</Text><TextInput accessibilityLabel="Valor base dos testes" editable={!bloqueado} value={valor} onChangeText={setValor} keyboardType="decimal-pad" style={s.input} /></View>
      <View style={s.campo}><Text style={s.label}>Data base (AAAA-MM-DD)</Text><TextInput accessibilityLabel="Data base dos testes" editable={!bloqueado} value={data} onChangeText={setData} maxLength={10} style={s.input} /></View>
    </View>
    <View style={s.linha}><Text style={s.label}>Repetições do cenário</Text>{[1, 3, 5].map((q) => <Pressable key={q} disabled={bloqueado} onPress={() => setQuantidade(q)} style={[s.chip, quantidade === q && s.selecionado]}><Text style={quantidade === q ? s.textoAtivo : s.texto}>{q}×</Text></Pressable>)}</View>
    {feedback && <View style={[s.feedback, feedback.erro && s.feedbackErro]}><Text accessibilityRole={feedback.erro ? 'alert' : undefined} accessibilityLiveRegion="polite" style={feedback.erro ? s.erro : s.texto}>{feedback.texto}</Text></View>}
    {pendente && <View style={s.card}><Text style={s.ajuda}>Pedido preservado para repetir com o mesmo identificador e evitar duplicação.</Text><View style={s.linha}><Pressable disabled={ocupado || automatico} onPress={() => executar(pendente)} style={s.botao}><Text style={s.textoAtivo}>Tentar novamente</Text></Pressable><Pressable disabled={ocupado} onPress={() => setPendente(undefined)} style={s.secundario}><Text style={s.texto}>Encerrar tentativa</Text></Pressable></View></View>}
    {ocupado && <View style={s.linha}><ActivityIndicator color="#f3c21a" /><Text style={s.ajuda}>Processando no Supabase…</Text></View>}
    <View style={s.card}><View style={s.linha}><Database size={18} color="#f3c21a" /><Text style={s.subtitulo}>Simulação automática</Text></View><Text style={s.ajuda}>Cinco ciclos, a cada 10 segundos: PIX, material, cartão, despesa fixa e estorno. Uma repetição por ciclo. Para ao fechar o painel ou trocar de perfil; uma ação em andamento termina normalmente.</Text><Pressable disabled={(ocupado && !automatico) || !!pendente} style={automatico ? s.secundario : s.botao} onPress={() => { if (!automatico) setCiclos(0); setAutomatico(!automatico); }}>{automatico ? <Square size={15} color="#ddd" /> : <Play size={15} color="#111" />}<Text style={automatico ? s.texto : s.textoAtivo}>{automatico ? `Parar · ${ciclos}/5 concluídos` : 'Iniciar cinco ciclos'}</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.linha}>{GRUPOS.map((g) => <Pressable key={g} onPress={() => setGrupo(g)} style={[s.chip, grupo === g && s.selecionado]}><Text style={grupo === g ? s.textoAtivo : s.texto}>{g}</Text></Pressable>)}</ScrollView>
    {grupo !== 'Histórico' ? CENARIOS_DEBUG.filter((c) => c.grupo === grupo).map((c) => <View key={c.id} style={s.card}><Text style={s.subtitulo}>{c.titulo}</Text><Text style={s.ajuda}>{c.descricao}</Text><Pressable disabled={bloqueado} onPress={() => gerar(c.id)} style={[s.botao, bloqueado && s.desabilitado]} accessibilityLabel={`Gerar cenário: ${c.titulo}`}><Play size={14} color="#111" /><Text style={s.textoAtivo}>Gerar {quantidade}×</Text></Pressable></View>) : <View style={s.stack}>
      <View style={s.linha}><Text style={s.subtitulo}>Últimos 15 lotes deste perfil</Text><Pressable accessibilityLabel="Atualizar histórico de testes" disabled={carregandoHistorico || ocupado} style={s.secundario} onPress={carregarHistorico}><RefreshCw size={16} color="#ddd" /></Pressable></View>
      {erroHistorico ? <Text accessibilityRole="alert" style={s.erro}>{erroHistorico}</Text> : carregandoHistorico ? <ActivityIndicator color="#f3c21a" /> : lotes.length === 0 ? <Text style={s.ajuda}>Nenhum lote gerado por sua conta neste perfil.</Text> : lotes.map((l) => <View key={l.id} style={s.card}><Text style={s.subtitulo}>{CENARIOS_DEBUG.find((c) => c.id === l.cenario)?.titulo || l.cenario}</Text><Text style={s.ajuda}>{new Date(l.criado_em).toLocaleString('pt-BR')} · Base: {l.data_base.split('-').reverse().join('/')}</Text><Text style={s.ajuda}>{resumir(l.resultado)}</Text>{l.removido_em ? <Text style={s.ajuda}>Lote removido</Text> : <View style={s.linha}><Pressable disabled={bloqueado} style={s.secundario} onPress={() => setConfirmarRemocao(confirmarRemocao === l.id ? undefined : l.id)}><Trash2 size={14} color="#f87171" /><Text style={s.erro}>Remover este lote</Text></Pressable>{confirmarRemocao === l.id && <Pressable disabled={bloqueado} onPress={() => remover(l.id)} style={s.secundario}><Text style={s.erro}>Confirmar remoção</Text></Pressable>}</View>}</View>)}
    </View>}
    <View style={s.linha}><Pressable disabled={ocupado || automatico} style={s.secundario} onPress={() => { atualizarDadosTeste(); setFeedback({ erro: false, texto: 'Os dados da tela atual foram recarregados.' }); }}><RefreshCw size={15} color="#ddd" /><Text style={s.texto}>Recarregar tela</Text></Pressable><Pressable disabled={ocupado || automatico} style={s.secundario} onPress={() => { navegarParaAba(artista ? 'financial' : 'bookings'); setMenuAberto(false); }}><Text style={s.texto}>{artista ? 'Ver financeiro' : 'Ver agendamentos'}</Text></Pressable></View>
  </View>;
}

const s = StyleSheet.create({
  stack: { gap: 14, paddingBottom: 18 },
  contexto: { backgroundColor: '#222219', borderColor: '#494129', borderWidth: 1, padding: 14, borderRadius: 12, gap: 8 },
  eyebrow: { color: '#f3c21a', fontSize: 10, letterSpacing: 1.2, fontWeight: '800' },
  titulo: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitulo: { color: '#fff', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  texto: { color: '#e4e4e7', fontSize: 13, lineHeight: 18 },
  ajuda: { color: '#aaaab5', fontSize: 12, lineHeight: 18 },
  label: { color: '#d4d4dc', fontSize: 12, fontWeight: '600' },
  linha: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  campos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campo: { flex: 1, minWidth: 150, gap: 7 },
  input: { color: '#fff', fontSize: 16, borderColor: '#4a4a55', borderWidth: 1, borderRadius: 8, padding: 12 },
  chip: { backgroundColor: '#26262e', borderRadius: 8, padding: 10, minHeight: 44, justifyContent: 'center' },
  selecionado: { backgroundColor: '#f3c21a' },
  textoAtivo: { color: '#111', fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#1b1b21', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#32323c', gap: 10 },
  botao: { backgroundColor: '#f3c21a', borderRadius: 8, padding: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, alignSelf: 'flex-start' },
  secundario: { backgroundColor: '#2b2b35', borderRadius: 8, padding: 12, minHeight: 44, alignItems: 'center', flexDirection: 'row', gap: 8, alignSelf: 'flex-start' },
  desabilitado: { opacity: 0.4 },
  feedback: { padding: 12, backgroundColor: '#203027', borderRadius: 10 },
  feedbackErro: { backgroundColor: '#382323' },
  erro: { color: '#f87171', fontSize: 12, lineHeight: 18 },
});
