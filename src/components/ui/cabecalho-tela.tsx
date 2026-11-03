import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { createThemedStyles, ds, tc } from '@/theme';

export function CabecalhoTela({ contexto, titulo, subtitulo, onSair }: {
  contexto: string; titulo: string; subtitulo?: string; onSair: () => void;
}) {
  return <View style={styles.header}>
    <View style={styles.textos}>
      <Text style={styles.contexto}>{contexto}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Sair da conta" onPress={onSair}
      style={({ pressed }) => [styles.sair, pressed && styles.pressionado]}>
      <LogOut size={19} color={tc(ds.cores.textoSecundario)} />
    </Pressable>
  </View>;
}

const styles = createThemedStyles({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: ds.espaco.medio, marginBottom: 4 },
  textos: { flex: 1, minWidth: 0, gap: 6 },
  contexto: { color: ds.cores.destaque, fontSize: ds.fonte.marca, fontWeight: '800', letterSpacing: 1.8, lineHeight: 15 },
  titulo: { color: ds.cores.texto, fontSize: ds.fonte.titulo, fontWeight: '800', letterSpacing: -0.8, lineHeight: 33 },
  subtitulo: { color: ds.cores.textoSuave, fontSize: ds.fonte.corpo, lineHeight: 21 },
  sair: { width: ds.alvo.compacto, height: ds.alvo.compacto, borderRadius: ds.raio.controle, backgroundColor: ds.cores.elevada, borderWidth: 1, borderColor: ds.cores.borda, alignItems: 'center', justifyContent: 'center' },
  pressionado: { opacity: 0.6 },
});
