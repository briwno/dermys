import { AppModal } from '@/components/ui/app-modal';
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  imagens: string[];
  indiceInicial: number;
  onClose: () => void;
}

export function VisualizadorReferencias({ imagens, indiceInicial, onClose }: Props) {
  const [indice, setIndice] = useState(indiceInicial);
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState({ width: 300, height: 450 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const trocar = (proximo: number) => {
    setIndice(proximo); setZoom(1); setErro(false); setCarregando(true);
  };

  return (
    <AppModal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.container} accessibilityViewIsModal>
        <View style={s.header}>
          <View style={s.titulo}>
            <Text style={s.texto}>Referência {indice + 1} de {imagens.length}</Text>
            <Text style={s.ajuda}>Amplie para ver os detalhes</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar foto ampliada" onPress={onClose} style={s.botao}><X color="#fff" size={24} /></Pressable>
        </View>
        <View style={s.area} onLayout={e => setArea(e.nativeEvent.layout)}>
          <ScrollView key={indice} horizontal contentContainerStyle={{ minWidth: area.width }}>
            <ScrollView contentContainerStyle={{ minHeight: area.height, justifyContent: 'center' }}>
              <Image source={{ uri: imagens[indice] }} resizeMode="contain"
                accessibilityLabel={`Foto de referência ${indice + 1} ampliada`}
                style={{ width: area.width * zoom, height: area.height * zoom }}
                onLoadStart={() => setCarregando(true)} onLoadEnd={() => setCarregando(false)}
                onError={() => { setErro(true); setCarregando(false); }} />
            </ScrollView>
          </ScrollView>
          {carregando && <ActivityIndicator pointerEvents="none" style={StyleSheet.absoluteFill} color="#f3c21a" />}
          {erro && <View style={s.erro}><Text style={s.texto}>Não foi possível carregar esta foto.</Text></View>}
        </View>
        <View style={s.controles}>
          <Pressable accessibilityRole="button" accessibilityLabel="Foto anterior" disabled={indice === 0} onPress={() => trocar(indice - 1)} style={[s.botao, indice === 0 && s.desativado]}><ChevronLeft size={24} color="#fff" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Diminuir foto" disabled={zoom === 1} onPress={() => setZoom(z => Math.max(1, z - 0.5))} style={[s.botao, zoom === 1 && s.desativado]}><Minus size={22} color="#fff" /></Pressable>
          <Text style={s.texto}>{Math.round(zoom * 100)}%</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Ampliar foto" disabled={zoom === 3} onPress={() => setZoom(z => Math.min(3, z + 0.5))} style={[s.botao, zoom === 3 && s.desativado]}><Plus size={22} color="#fff" /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Próxima foto" disabled={indice === imagens.length - 1} onPress={() => trocar(indice + 1)} style={[s.botao, indice === imagens.length - 1 && s.desativado]}><ChevronRight size={24} color="#fff" /></Pressable>
        </View>
        <Text style={[s.ajuda, s.rodape]}>{zoom > 1 ? 'Arraste a imagem para explorar os detalhes' : 'Use + para ampliar a imagem'}</Text>
      </View>
    </AppModal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  titulo: { flex: 1, gap: 4 },
  texto: { color: '#fff', fontSize: 15, fontWeight: '600' },
  ajuda: { color: '#b4b4bc', fontSize: 12 },
  area: { flex: 1, overflow: 'hidden' },
  botao: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#202024' },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', padding: 12 },
  desativado: { opacity: 0.3 },
  rodape: { textAlign: 'center', paddingBottom: 18 },
  erro: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#08080a' },
});
