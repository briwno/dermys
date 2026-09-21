import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface AftercareModalProps {
  visivel: boolean;
  onClose: () => void;
  artistaNome?: string;
}

export function AftercareModal({ visivel, onClose, artistaNome }: AftercareModalProps) {
  const passos = [
    {
      titulo: '1. Primeiras 2 a 4 Horas',
      desc: 'Mantenha o plástico filme ou curativo colocado pelo tatuador. Lave com sabonete neutro e água corrente morna logo após retirar.',
    },
    {
      titulo: '2. Higienização & Hidratação',
      desc: 'Lave suavemente 2 a 3 vezes ao dia com água fria e sabonete antibacteriano neutro. Seque pressionando com toalha de papel limpa.',
    },
    {
      titulo: '3. Pomada Cicatrizante',
      desc: 'Aplique uma camada ultrafina de pomada recomendada (ex: Bepantol Derma ou específica para tattoo) 3 vezes ao dia após o segundo dia.',
    },
    {
      titulo: '4. Não Coçar e Não Tirar Cascas',
      desc: 'É normal formar casquinhas finas. NUNCA as puxe ou coce a região para evitar falhas na pigmentação da tinta.',
    },
    {
      titulo: '5. Proibições Críticas (15 a 30 dias)',
      desc: 'Evite sol direto, praia, piscina, sauna e banhos de imersão. Evite alimentos muito gordurosos ou frutos do mar se tiver sensibilidade.',
    },
  ];

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrap}>
                <ShieldCheck size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.title}>Guia de Cicatrização</Text>
                <Text style={styles.subtitle}>Protocolo de Biossegurança Dermys</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Conteúdo */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.introBox}>
              <Sparkles size={16} color="#f3c21a" />
              <Text style={styles.introText}>
                Sua tatuagem foi feita com materiais 100% esterilizados por {artistaNome || 'seu artista'}.
                Agora, o resultado final depende dos seus cuidados diários!
              </Text>
            </View>

            {passos.map((item, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <Text style={styles.stepTitle}>{item.titulo}</Text>
                </View>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            ))}

            <View style={styles.alertBox}>
              <AlertCircle size={16} color="#f59e0b" />
              <Text style={styles.alertText}>
                Em caso de vermelhidão excessiva após o 5º dia, calor excessivo ou secreções, entre em
                contato imediatamente com o seu tatuador pelo chat.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Entendido, vou cuidar!</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '88%',
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  subtitle: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161616',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  introBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
  },
  introText: {
    color: '#d1d5db',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  stepCard: {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 14,
    gap: 6,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepDesc: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: 24,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 12,
  },
  alertText: {
    color: '#f59e0b',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
