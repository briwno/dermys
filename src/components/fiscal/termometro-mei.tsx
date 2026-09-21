import type { MetricasFiscaisArtista } from '@/types/fiscal';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  Info,
  TrendingUp,
} from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface PropsTermometroMei {
  metricas: MetricasFiscaisArtista;
  onAbrirDasn: () => void;
}

export function TermometroMei({ metricas, onAbrirDasn }: PropsTermometroMei) {
  const {
    tetoMeiAnual,
    faturamentoAcumuladoAno,
    percentualTetoMei,
    faixaAlerta,
    saldoRestanteTeto,
  } = metricas;

  const getCorBarra = () => {
    if (faixaAlerta === 'CRITICO_100') return '#ef4444'; // Vermelho
    if (faixaAlerta === 'ALERTA_85') return '#f97316'; // Laranja
    if (faixaAlerta === 'ALERTA_70') return '#f3c21a'; // Amarelo
    return '#10b981'; // Verde seguro
  };

  const getAlertaInfo = () => {
    switch (faixaAlerta) {
      case 'CRITICO_100':
        return {
          titulo: 'Limite de Faturamento Excedido!',
          mensagem:
            'Você atingiu 100% do teto do MEI (R$ 81.000,00). Consulte seu contador para transição ao Simples Nacional (ME).',
          corFundo: 'rgba(239, 68, 68, 0.15)',
          corBorda: 'rgba(239, 68, 68, 0.4)',
          corTexto: '#ef4444',
          icone: AlertTriangle,
        };
      case 'ALERTA_85':
        return {
          titulo: 'Atenção: 85% do Teto MEI Atingido',
          mensagem:
            'Você está próximo do limite anual. Planeje a regularização do seu enquadramento para evitar multas tributárias.',
          corFundo: 'rgba(249, 115, 22, 0.15)',
          corBorda: 'rgba(249, 115, 22, 0.4)',
          corTexto: '#f97316',
          icone: AlertTriangle,
        };
      case 'ALERTA_70':
        return {
          titulo: 'Alerta: 70% do Teto Atingido',
          mensagem:
            'Seu faturamento acumulado já consumiu mais de 70% do limite de R$ 81.000,00 neste ano-calendário.',
          corFundo: 'rgba(243, 194, 26, 0.12)',
          corBorda: 'rgba(243, 194, 26, 0.35)',
          corTexto: '#f3c21a',
          icone: Info,
        };
      case 'NORMAL':
      default:
        return {
          titulo: 'Situação Fiscal Regular',
          mensagem:
            'Seu faturamento anual está dentro da faixa segura do MEI. Emita suas notas com tranquilidade.',
          corFundo: 'rgba(16, 185, 129, 0.1)',
          corBorda: 'rgba(16, 185, 129, 0.3)',
          corTexto: '#10b981',
          icone: CheckCircle2,
        };
    }
  };

  const alerta = getAlertaInfo();
  const IconeAlerta = alerta.icone;

  return (
    <View style={styles.container}>
      {/* Header com Botão DASN */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TrendingUp size={18} color="#f3c21a" />
          <Text style={styles.title}>Termômetro Fiscal & Teto MEI</Text>
        </View>

        <Pressable style={styles.btnDasn} onPress={onAbrirDasn}>
          <FileSpreadsheet size={13} color="#111" />
          <Text style={styles.btnDasnText}>Relatório DASN</Text>
        </Pressable>
      </View>

      {/* Barra de Progresso com Marcadores */}
      <View style={styles.meterContainer}>
        <View style={styles.meterHeaderRow}>
          <Text style={styles.meterTitle}>Teto Anual: R$ {tetoMeiAnual.toLocaleString('pt-BR')}</Text>
          <Text style={[styles.meterPercent, { color: getCorBarra() }]}>{percentualTetoMei}%</Text>
        </View>

        {/* Trilho da Barra */}
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, percentualTetoMei)}%`,
                backgroundColor: getCorBarra(),
              },
            ]}
          />
          {/* Marcadores de Alerta */}
          <View style={[styles.marker, { left: '70%' }]} />
          <View style={[styles.marker, { left: '85%' }]} />
        </View>

        {/* Legenda dos Marcadores */}
        <View style={styles.markerLabelsRow}>
          <Text style={styles.markerSub}>0%</Text>
          <Text style={styles.markerSub}>70% (Alerta)</Text>
          <Text style={styles.markerSub}>85% (Crítico)</Text>
          <Text style={styles.markerSub}>100%</Text>
        </View>
      </View>

      {/* Grid de Valores */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Faturamento no Ano</Text>
          <Text style={styles.statVal}>R$ {faturamentoAcumuladoAno.toFixed(2)}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Saldo Disponível no Teto</Text>
          <Text style={[styles.statVal, { color: '#10b981' }]}>
            R$ {saldoRestanteTeto.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Caixa de Alerta Dinâmica */}
      <View
        style={[
          styles.alertBox,
          { backgroundColor: alerta.corFundo, borderColor: alerta.corBorda },
        ]}
      >
        <IconeAlerta size={16} color={alerta.corTexto} style={{ marginTop: 2 }} />
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, { color: alerta.corTexto }]}>{alerta.titulo}</Text>
          <Text style={styles.alertMsg}>{alerta.mensagem}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnDasn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnDasnText: {
    color: '#111',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meterContainer: {
    backgroundColor: '#151515',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 12,
    gap: 8,
  },
  meterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterTitle: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '700',
  },
  meterPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  track: {
    height: 12,
    backgroundColor: '#262626',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#0a0a0a',
  },
  markerLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markerSub: {
    color: '#6b7280',
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    padding: 10,
    gap: 2,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  alertMsg: {
    color: '#d1d5db',
    fontSize: 11,
    lineHeight: 15,
  },
});
