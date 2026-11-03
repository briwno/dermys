import { ds } from '@/theme/design-system';
import { supabase } from '@/services/data-client';
import type { PerfilUsuario } from '@/types/auth';
import { Calendar, Clock, DollarSign, FileCheck2, FileText, ShieldCheck, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, tc } from '@/theme';

interface PropsDashboardTab {
  perfil: PerfilUsuario;
}

interface AtendimentoItem {
  id: string;
  cliente: string;
  horario: string;
  estilo: string;
}

export function ArtistaDashboardTab({ perfil }: PropsDashboardTab) {
  const [atendimentos, setAtendimentos] = useState<AtendimentoItem[]>([]);
  const [totalAgendamentos, setTotalAgendamentos] = useState<number>(0);
  const [sinalCustodiaTotal, setSinalCustodiaTotal] = useState<number>(0);
  const [faturamentoMes, setFaturamentoMes] = useState<number>(0);
  const [carregando, setCarregando] = useState(true);

  const artistaId = perfil.id || perfil.uid;

  useEffect(() => {
    carregarDadosStudio();
  }, [artistaId]);

  const carregarDadosStudio = async () => {
    if (!artistaId) return;
    setCarregando(true);
    try {
      // 1. Carrega agendamentos
      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select(`
          id,
          data_horario,
          estilo,
          valor_sinal,
          status,
          cliente:profiles!agendamentos_cliente_id_fkey(nome_exibicao)
        `)
        .eq('artista_id', artistaId);

      if (agendamentosData) {
        setTotalAgendamentos(agendamentosData.length);

        const formatados: AtendimentoItem[] = agendamentosData
          .filter((item: any) => item.status !== 'cancelado')
          .slice(0, 4)
          .map((item: any) => {
            const d = item.data_horario ? new Date(item.data_horario) : new Date();
            const horaStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return {
              id: item.id,
              cliente: item.cliente?.nome_exibicao || 'Cliente Dermys',
              horario: `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • ${horaStr}`,
              estilo: item.estilo || 'Estilo Autoral',
            };
          });
        setAtendimentos(formatados);
      }

      // 2. Carrega métricas financeiras de transacoes_financeiras
      const { data: transacoesData } = await supabase
        .from('transacoes_financeiras')
        .select('valor_bruto, valor_liquido, status, tipo')
        .eq('artista_id', artistaId);

      if (transacoesData) {
        const custodia = transacoesData
          .filter((t: any) => t.status === 'CUSTODIA')
          .reduce((acc: number, t: any) => acc + Number(t.valor_bruto || 0), 0);

        const totalMes = transacoesData
          .filter((t: any) => t.status === 'LIBERADO' || t.status === 'APROVADO')
          .reduce((acc: number, t: any) => acc + Number(t.valor_liquido || 0), 0);

        setSinalCustodiaTotal(custodia);
        setFaturamentoMes(totalMes);
      }
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  const KPI = [
    { label: 'Faturamento Líquido', value: `R$ ${faturamentoMes.toFixed(2)}`, icon: TrendingUp, color: tc('#10b981') },
    { label: 'Sinais em Custódia (MP)', value: `R$ ${sinalCustodiaTotal.toFixed(2)}`, icon: ShieldCheck, color: tc('#3b82f6') },
    { label: 'Agendamentos Ativos', value: String(totalAgendamentos), icon: Calendar, color: tc(ds.cores.destaque) },
    { label: 'Status Fiscal (MEI)', value: 'Regular', icon: FileCheck2, color: tc(ds.cores.destaque) },
  ];

  return (
    <View style={styles.container}>
      {/* Grid de KPIs */}
      <View style={styles.kpiGrid}>
        {KPI.map((item) => {
          const IconComp = item.icon;
          return (
            <View key={item.label} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>{item.label}</Text>
                <IconComp size={14} color={item.color} />
              </View>
              <Text style={styles.kpiValue}>{item.value}</Text>
            </View>
          );
        })}
      </View>

      {/* Banner de Proteção Mercado Pago */}
      <View style={styles.protectionBanner}>
        <View style={styles.shieldWrap}>
          <ShieldCheck size={20} color={tc('#10b981')} />
        </View>
        <View style={styles.protectionInfo}>
          <Text style={styles.protectionTitle}>Garantia de Comparecimento Ativa</Text>
          <Text style={styles.protectionText}>
            Todos os agendamentos exigem pagamento prévio de sinal com custódia e emissão de recibo.
          </Text>
        </View>
      </View>

      {/* Próximos Atendimentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos atendimentos</Text>
        <View style={styles.listWrap}>
          {carregando ? (
            <ActivityIndicator color={tc(ds.cores.destaque)} style={{ marginVertical: 10 }} />
          ) : atendimentos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum atendimento agendado no momento.</Text>
          ) : (
            atendimentos.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.clientText}>{item.cliente}</Text>
                  <Text style={styles.itemStyle}>{item.estilo}</Text>
                </View>
                <View style={styles.timeRow}>
                  <Clock size={12} color={tc(ds.cores.destaque)} />
                  <Text style={styles.slotText}>{item.horario}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const styles = createThemedStyles({
  container: {
    gap: ds.espaco.padrao,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 130,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    backgroundColor: ds.cores.superficie,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 8,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '700',
    lineHeight: 17,
    flexShrink: 1,
  },
  kpiValue: {
    color: ds.cores.texto,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    flexShrink: 1,
  },
  protectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ds.cores.superficie,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 12,
    gap: 12,
  },
  shieldWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  protectionInfo: {
    flex: 1,
    gap: 2,
  },
  protectionTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  protectionText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  section: {
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    backgroundColor: ds.cores.superficie,
    padding: ds.espaco.padrao,
    gap: 10,
  },
  sectionTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.secao,
    fontWeight: '800',
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 26,
    flexShrink: 1,
  },
  listWrap: {
    gap: 8,
  },
  itemRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    backgroundColor: ds.cores.elevada,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  clientText: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  itemStyle: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    color: ds.cores.destaque,
    fontWeight: '800',
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  emptyText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    textAlign: 'center',
    paddingVertical: 10,
    lineHeight: 20,
    flexShrink: 1,
  },
});
