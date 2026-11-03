import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { AppModal } from '@/components/ui/app-modal';
import { marcarAvisosLidos, PASSOS_APRESENTACAO } from '@/services/apresentacao-store';
import { useApresentacao } from './use-apresentacao';
import { useDebug } from './debug-context';

export function ApresentacaoStatus() {
  const demo = useApresentacao();
  const { perfilAtual, navegarParaAba, setMenuAberto } = useDebug();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState('');
  const id = perfilAtual?.id || perfilAtual?.uid;
  if (!demo.ativo) return null;
  const avisos = demo.avisos.filter(a => a.perfilId === id);
  const novas = avisos.filter(a => !a.lida).length;
  return <>
    <View style={s.faixa}><Pressable style={s.rotulo} onPress={() => setMenuAberto(true)} accessibilityLabel="Abrir roteiro da apresentação"><View style={s.ponto} /><Text style={s.texto}>Demonstração local · {demo.passo + 1}/{PASSOS_APRESENTACAO.length}</Text></Pressable><Pressable style={s.sino} accessibilityLabel={`Notificações, ${novas} não lidas`} onPress={() => { setAberto(true); if (id) void marcarAvisosLidos(id).catch(() => setErro('Não foi possível marcar as notificações como lidas.')); }}><Bell size={17} color="#f3c21a" />{novas > 0 && <Text style={s.contagem}>{novas}</Text>}</Pressable></View>
    <AppModal visible={aberto} onRequestClose={() => setAberto(false)}><View style={s.fundo}><View style={s.card}><View style={s.cabecalho}><Text style={s.titulo}>Suas notificações</Text><Pressable accessibilityLabel="Fechar notificações" style={s.sino} onPress={() => setAberto(false)}><X size={22} color="#fff" /></Pressable></View><Text style={s.ajuda}>Eventos da apresentação neste aparelho.</Text>{erro ? <Text style={s.ajuda}>{erro}</Text> : null}<ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>{avisos.length === 0 ? <Text style={s.ajuda}>Tudo tranquilo por aqui. Os próximos passos do roteiro vão gerar novidades.</Text> : avisos.map(a => <Pressable key={a.id} style={s.aviso} onPress={() => { navegarParaAba(a.aba); setAberto(false); }}><Text style={s.branco}>{a.titulo}</Text><Text style={s.ajuda}>{a.texto}</Text><Text style={s.data}>{new Date(a.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Toque para abrir</Text></Pressable>)}</ScrollView></View></View></AppModal>
  </>;
}
const s = StyleSheet.create({
  faixa: { minHeight: 36, paddingLeft: 16, paddingRight: 8, backgroundColor: '#1b1910', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rotulo: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }, ponto: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#f3c21a' }, texto: { color: '#e4d99f', fontSize: 11, fontWeight: '600' },
  sino: { minWidth: 44, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, contagem: { color: '#f3c21a', fontSize: 11, fontWeight: '700' },
  fundo: { flex: 1, justifyContent: 'center', backgroundColor: '#000a', padding: 16 }, card: { backgroundColor: '#111113', borderRadius: 20, padding: 16, gap: 14, maxHeight: '90%', width: '100%', maxWidth: 540, alignSelf: 'center' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, titulo: { fontSize: 20, color: '#fff', fontWeight: '700', flexShrink: 1 }, aviso: { backgroundColor: '#1b1b20', borderRadius: 14, padding: 16, gap: 8 }, branco: { color: '#f4f4f5', fontSize: 15, fontWeight: '600' }, ajuda: { color: '#b7b7c3', fontSize: 14, lineHeight: 21 }, data: { color: '#a6a6b2', fontSize: 11 },
});
