import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Play, RotateCcw } from 'lucide-react-native';
import { avancarApresentacao, PASSOS_APRESENTACAO, prepararApresentacao, sairApresentacao, simularAcaoApresentacao } from '@/services/apresentacao-store';
import { selecionarPersonaTeste } from '@/services/persona-teste';
import { useApresentacao } from './use-apresentacao';
import { useDebug } from './debug-context';
import { PERSONAS_TESTE } from './types';

export function ApresentacaoPainel() {
  const demo = useApresentacao();
  const { trocarPersona, navegarParaAba, setMenuAberto, atualizarDadosTeste, deslogarParaAuth } = useDebug();
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const [erro, setErro] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const passo = PASSOS_APRESENTACAO[demo.passo] || PASSOS_APRESENTACAO[0];
  async function executar(acao: () => Promise<void>) {
    if (trava.current) return; trava.current = true; setOcupado(true); setErro('');
    try { await acao(); atualizarDadosTeste(); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível preparar a demonstração.'); }
    finally { trava.current = false; setOcupado(false); }
  }
  async function mostrar(indice = demo.passo) {
    const alvo = PASSOS_APRESENTACAO[indice];
    await trocarPersona(PERSONAS_TESTE.find(p => p.id === alvo.perfil)!);
    navegarParaAba(alvo.aba); setMenuAberto(false);
  }
  return <View style={s.stack}>
    <View style={s.hero}><Text style={s.marca}>DERMYS / APRESENTAÇÃO</Text><Text style={s.titulo}>Uma história, do traço ao resultado.</Text><Text style={s.texto}>Explore, reserva, atendimento, pagamento, recibo e DRE nas mesmas telas do app.</Text></View>
    <Text style={s.texto}>O cenário local fica salvo neste aparelho e funciona sem conexão para os dados. Fotos externas precisam ter sido carregadas. Não envia cobranças, documentos ou mensagens para outras pessoas.</Text>
    {erro ? <Text accessibilityRole="alert" style={s.erro}>{erro}</Text> : null}
    {ocupado && <ActivityIndicator color="#f3c21a" />}
    {!demo.ativo ? <Pressable disabled={ocupado} style={s.primario} onPress={() => executar(async () => { await prepararApresentacao(); await mostrar(0); })}><Play color="#111" size={18} /><Text style={s.ativo}>Preparar apresentação</Text></Pressable> : <>
      <View style={s.card}><Text style={s.marca}>PASSO {demo.passo + 1} DE {PASSOS_APRESENTACAO.length}</Text><Text style={s.subtitulo}>{passo.titulo}</Text><Text style={s.texto}>{passo.texto}</Text>
        <Pressable disabled={ocupado} style={s.secundario} onPress={() => executar(() => mostrar())}><Text style={s.branco}>Abrir tela deste passo</Text></Pressable>
        {demo.passo < PASSOS_APRESENTACAO.length - 1 && <Pressable disabled={ocupado} style={s.primario} onPress={() => executar(async () => { await avancarApresentacao(); })}><Play size={16} color="#111" /><Text style={s.ativo}>Executar próximo passo</Text></Pressable>}
        <Text style={s.pequeno}>Execute o passo e abra a tela para mostrar o resultado. Troque entre cliente e artista na aba Perfis quando quiser.</Text>
      </View>
      <Text style={s.subtitulo}>Teste outros caminhos</Text>
      <View style={s.linha}>{([['recusar', 'Recusar sinal'], ['aprovar', 'Aprovar sinal'], ['cancelar', 'Cancelar reserva'], ['estornar', 'Estornar R$ 150']] as const).map(([acao, titulo]) => <Pressable key={acao} disabled={ocupado} style={s.secundario} onPress={() => executar(() => simularAcaoApresentacao(acao))}><Text style={s.branco}>{titulo}</Text></Pressable>)}</View>
      <Text style={s.pequeno}>Recusa e cancelamento: antes da sessão. Estorno: após a conclusão. Restaure o cenário para repetir a jornada original.</Text>
      <Pressable disabled={ocupado} style={s.secundario} onPress={() => setConfirmar(!confirmar)}><RotateCcw size={16} color="#f3c21a" /><Text style={s.branco}>Restaurar cenário inicial</Text></Pressable>
      {confirmar && <View style={s.card}><Text style={s.texto}>Isso substitui somente os dados locais da apresentação, incluindo alterações feitas durante os testes. Os dados do Supabase são preservados.</Text><Pressable disabled={ocupado} style={s.primario} onPress={() => executar(async () => { await prepararApresentacao(); setConfirmar(false); await mostrar(0); })}><Text style={s.ativo}>Confirmar restauração</Text></Pressable></View>}
      <Pressable disabled={ocupado} style={s.secundario} onPress={() => executar(async () => { await sairApresentacao(); await selecionarPersonaTeste(null); deslogarParaAuth(); })}><Text style={s.branco}>Sair da apresentação local</Text></Pressable>
    </>}
    <View style={s.card}><Text style={s.subtitulo}>Roteiro para a banca · 5 a 7 minutos</Text>{PASSOS_APRESENTACAO.map((p, i) => <View key={p.titulo} style={s.item}><Text style={s.numero}>{i + 1}</Text><View style={{ flex: 1, gap: 4 }}><Text style={s.branco}>{p.titulo}</Text><Text style={s.pequeno}>{p.texto}</Text></View></View>)}<Pressable style={s.secundario} onPress={() => executar(async () => { await Share.share({ message: `DERMYS · Roteiro de apresentação\n\nProblema: conectar a descoberta do artista à organização do atendimento e do estúdio.\n\n${PASSOS_APRESENTACAO.map((p, i) => `${i + 1}. ${p.titulo}\n${p.texto}`).join('\n\n')}\n\nPagamentos e documentos são simulados para fins acadêmicos.` }); })}><Text style={s.branco}>Compartilhar roteiro</Text></Pressable></View>
  </View>;
}
const s = StyleSheet.create({
  stack: { gap: 16, paddingBottom: 24 }, hero: { gap: 12, padding: 20, borderRadius: 20, backgroundColor: '#242116' },
  marca: { color: '#f3c21a', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, titulo: { color: '#fff', fontSize: 26, lineHeight: 31, fontWeight: '800' },
  subtitulo: { color: '#fff', fontSize: 18, fontWeight: '700' }, texto: { color: '#d4d4dc', fontSize: 14, lineHeight: 21 }, pequeno: { color: '#a6a6b2', fontSize: 12, lineHeight: 18 },
  card: { padding: 16, borderRadius: 16, gap: 14, backgroundColor: '#1b1b20', borderWidth: 1, borderColor: '#303036' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, item: { flexDirection: 'row', gap: 12 }, numero: { color: '#f3c21a', fontSize: 18, fontWeight: '700', width: 24 },
  primario: { backgroundColor: '#f3c21a', padding: 14, minHeight: 48, borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
  secundario: { backgroundColor: '#252529', padding: 14, minHeight: 48, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  branco: { color: '#f4f4f5', fontSize: 14, fontWeight: '600' }, ativo: { color: '#111', fontSize: 14, fontWeight: '700' }, erro: { color: '#fca5a5', fontSize: 14, lineHeight: 20 },
});
