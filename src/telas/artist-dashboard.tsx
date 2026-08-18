import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { PerfilUsuario } from '@/types/auth';

interface PropsDashboardArtista {
  perfil: PerfilUsuario;
  onLogout: () => void;
}

const KPI = [
  { label: 'Agendamentos hoje', value: '4' },
  { label: 'Briefings pendentes', value: '7' },
  { label: 'Sinal em custódia', value: 'R$ 1.780' },
  { label: 'Clientes ativos', value: '19' },
];

const PROXIMOS_ATENDIMENTOS = [
  { id: '1', cliente: 'Marina C.', horario: '10:30', estilo: 'Fine Line Floral' },
  { id: '2', cliente: 'Gustavo R.', horario: '13:00', estilo: 'Blackwork Manga' },
  { id: '3', cliente: 'Bruna F.', horario: '16:15', estilo: 'Realismo Retrato' },
];

export function DashboardArtista({ perfil, onLogout }: PropsDashboardArtista) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hiText}>Studio mode</Text>
            <Text style={styles.title}>Dashboard do tatuador</Text>
            <Text style={styles.subtitle}>{perfil.nomeExibicao}</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        <View style={styles.kpiGrid}>
          {KPI.map((item) => (
            <View key={item.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atalhos rápidos</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionText}>Novo agendamento</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionText}>Nova anamnese</Text>
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionText}>Controle de sinal</Text>
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionText}>Gerenciar portfólio</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos atendimentos</Text>
          <View style={styles.listWrap}>
            {PROXIMOS_ATENDIMENTOS.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View>
                  <Text style={styles.clientText}>{item.cliente}</Text>
                  <Text style={styles.itemStyle}>{item.estilo}</Text>
                </View>
                <Text style={styles.slotText}>{item.horario}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 14,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hiText: {
    color: '#8a8a8a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  title: {
    color: '#f3c21a',
    fontSize: 26,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#121212',
  },
  logoutText: {
    color: '#fff',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    backgroundColor: '#101010',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  kpiLabel: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  kpiValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    backgroundColor: '#101010',
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#f3c21a',
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  listWrap: {
    gap: 8,
  },
  itemRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#171717',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  itemStyle: {
    color: '#9ca3af',
    fontSize: 11,
  },
  slotText: {
    color: '#f3c21a',
    fontWeight: '900',
    fontSize: 13,
  },
});
