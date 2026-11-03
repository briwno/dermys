import { ds } from '@/theme/design-system';
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
import { createThemedStyles, tc } from '@/theme';

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
    if (faixaAlerta === 'CRITICO_100') return tc('#ef4444'); // Vermelho
    if (faixaAlerta === 'ALERTA_85') return tc('#f97316'); // Laranja
    if (faixaAlerta === 'ALERTA_70') return tc(ds.cores.destaque); // Amarelo
    return tc('#10b981'); // Verde seguro
  };

  const getAlertaInfo = () => {
    switch (faixaAlerta) {
      case 'CRITICO_100':
        return {
          titulo: 'Limite de Faturamento Excedido!',
          mensagem:
            'Você atingiu 100% do teto do MEI (R$ 81.000,00). Consulte seu contador para transição ao Simples Nacional (ME).',
          corFundo: tc('rgba(239, 68, 68, 0.15)'),
          corBorda: tc('rgba(239, 68, 68, 0.4)'),
          corTexto: tc('#ef4444'),
          icone: AlertTriangle,
        };
      case 'ALERTA_85':
        return {
          titulo: 'Atenção: 85% do Teto MEI Atingido',
          mensagem:
            'Você está próximo do limite anual. Planeje a regularização do seu enquadramento para evitar multas tributárias.',
          corFundo: tc('rgba(249, 115, 22, 0.15)'),
          corBorda: tc('rgba(249, 115, 22, 0.4)'),
          corTexto: tc('#f97316'),
          icone: AlertTriangle,
        };
      case 'ALERTA_70':
        return {
          titulo: 'Alerta: 70% do Teto Atingido',
          mensagem:
            'Seu faturamento acumulado já consumiu mais de 70% do limite de R$ 81.000,00 neste ano-calendário.',
          corFundo: tc('rgba(243, 194, 26, 0.12)'),
          corBorda: tc('rgba(243, 194, 26, 0.35)'),
          corTexto: tc(ds.cores.destaque),
          icone: Info,
        };
      case 'NORMAL':
      default:
        return {
          titulo: 'Situação Fiscal Regular',
          mensagem:
            'Seu faturamento anual está dentro da faixa segura do MEI. Emita suas notas com tranquilidade.',
          corFundo: tc('rgba(16, 185, 129, 0.1)'),
          corBorda: tc('rgba(16, 185, 129, 0.3)'),
          corTexto: tc('#10b981'),
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
          <TrendingUp size={18} color={tc(ds.cores.destaque)} />
          <Text style={styles.title}>Seu limite MEI</Text>
        </View>

        <Pressable style={styles.btnDasn} onPress={onAbrirDasn}>
          <FileSpreadsheet size={13} color={tc('#111')} />
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
          <Text style={styles.statVal}>{faturamentoAcumuladoAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Saldo Disponível no Teto</Text>
          <Text style={[styles.statVal, { color: tc('#10b981') }]}>
            {saldoRestanteTeto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

const styles = createThemedStyles({
  container: {
    backgroundColor: ds.cores.superficie,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '800',
    flexShrink: 1,
    lineHeight: 26,
  },
  btnDasn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ds.cores.destaque,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: ds.alvo.controle,
    borderRadius: ds.raio.controle,
    justifyContent: 'center',
  },
  btnDasnText: {
    color: '#111',
    fontSize: ds.fonte.controle,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  meterContainer: {
    backgroundColor: ds.cores.elevada,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 12,
    gap: 8,
  },
  meterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterTitle: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '700',
    lineHeight: 23,
    flexShrink: 1,
  },
  meterPercent: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  track: {
    height: 12,
    backgroundColor: ds.cores.interacao,
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
    backgroundColor: ds.cores.fundo,
  },
  markerLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markerSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: ds.cores.elevada,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 10,
    gap: 2,
  },
  statLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    textTransform: 'none',
    lineHeight: 17,
  },
  statVal: {
    color: ds.cores.texto,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
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
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  alertMsg: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
});
