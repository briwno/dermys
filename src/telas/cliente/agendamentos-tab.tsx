import { supabase } from '@/services/supabase';
import { Calendar, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export interface ItemAgendamento {
  id: string;
  artistaNome: string;
  estudioNome: string;
  data: string;
  horario: string;
  estilo: string;
  status: 'confirmado' | 'pendente' | 'concluido';
  valorTotal: number;
}

export function ClienteAgendamentosTab() {
  const [agendamentos, setAgendamentos] = useState<ItemAgendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
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
          valor_total,
          artista:profiles!agendamentos_artista_id_fkey(nome_exibicao, nome_estudio)
        `)
        .eq('cliente_id', session.user.id);

      if (!error && data && data.length > 0) {
        const formatados: ItemAgendamento[] = data.map((item: any) => {
          const d = item.data_horario ? new Date(item.data_horario) : new Date();
          const dataStr = d.toLocaleDateString('pt-BR');
          const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return {
            id: item.id,
            artistaNome: item.artista?.nome_exibicao || 'Artista',
            estudioNome: item.artista?.nome_estudio || 'Estúdio',
            data: dataStr,
            horario: horaStr,
            estilo: item.estilo || 'Fine Line',
            status: item.status || 'pendente',
            valorTotal: Number(item.valor_total || 0),
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
      <Text style={styles.sectionTitle}>Seus Agendamentos</Text>

      {carregando ? (
        <ActivityIndicator color="#f3c21a" style={{ marginTop: 20 }} />
      ) : agendamentos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Você ainda não possui agendamentos marcados.</Text>
        </View>
      ) : (
        agendamentos.map((item) => {
          const isConfirmado = item.status === 'confirmado';

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.artistName}>{item.artistaNome}</Text>
                  <Text style={styles.studioName}>{item.estudioNome}</Text>
                </View>
                <View style={[styles.statusBadge, isConfirmado ? styles.badgeOn : styles.badgePending]}>
                  <Text style={[styles.statusText, isConfirmado ? styles.statusTextOn : styles.statusTextPending]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={13} color="#f3c21a" />
                <Text style={styles.infoText}>{item.data} às {item.horario}</Text>
              </View>

              <View style={styles.infoRow}>
                <Sparkles size={13} color="#f3c21a" />
                <Text style={styles.infoText}>Estilo: {item.estilo}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.footerLabel}>Valor Total:</Text>
                <Text style={styles.footerVal}>R$ {item.valorTotal}</Text>
              </View>
            </View>
          );
        })
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
  artistName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  studioName: {
    color: '#9ca3af',
    fontSize: 11,
  },
  statusBadge: {
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
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextOn: {
    color: '#10b981',
  },
  statusTextPending: {
    color: '#f3c21a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1d1d1d',
    paddingTop: 8,
    marginTop: 4,
  },
  footerLabel: {
    color: '#9ca3af',
    fontSize: 11,
  },
  footerVal: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '900',
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
