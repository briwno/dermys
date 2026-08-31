import { supabase } from '@/services/supabase';
import { Calendar } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export interface ItemAgenda {
  id: string;
  cliente: string;
  data: string;
  horario: string;
  estilo: string;
  status: string;
  sinal: string;
}

export function ArtistaAgendaTab() {
  const [agendamentos, setAgendamentos] = useState<ItemAgenda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarAgenda();
  }, []);

  const carregarAgenda = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_horario,
          estilo,
          status,
          valor_sinal,
          cliente:profiles!agendamentos_cliente_id_fkey(nome_exibicao)
        `)
        .eq('artista_id', session.user.id);

      if (!error && data) {
        const formatados: ItemAgenda[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
          const dataStr = d.toLocaleDateString('pt-BR');
          const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return {
            id: item.id,
            cliente: item.cliente?.nome_exibicao || 'Cliente',
            data: dataStr,
            horario: horaStr,
            estilo: item.estilo || 'Estilo Autoral',
            status: item.status || 'pendente',
            sinal: `R$ ${item.valor_sinal || 0}`,
          };
        });
        setAgendamentos(formatados);
      }
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Agenda de Atendimentos</Text>

      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginTop: 20 }} />
      ) : agendamentos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nenhum atendimento na sua agenda no momento.</Text>
        </View>
      ) : (
        agendamentos.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.clientName}>{item.cliente}</Text>
                <Text style={styles.styleText}>{item.estilo}</Text>
              </View>
              <View style={[styles.badge, item.status === 'confirmado' ? styles.badgeOn : styles.badgePending]}>
                <Text style={[styles.badgeText, item.status === 'confirmado' ? styles.badgeTextOn : styles.badgeTextPending]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.timeRow}>
              <Calendar size={13} color="#f3c21a" />
              <Text style={styles.timeText}>{item.data} às {item.horario}</Text>
              <Text style={styles.sinalText}>Sinal: {item.sinal}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    backgroundColor: '#101010',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  styleText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgePending: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextOn: {
    color: '#10b981',
  },
  badgeTextPending: {
    color: '#f3c21a',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  sinalText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
  },
});
