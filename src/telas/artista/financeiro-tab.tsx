import { ConfigFiscalModal } from '@/components/fiscal/config-fiscal-modal';
import { DetalhesNotaModal } from '@/components/fiscal/detalhes-nota-modal';
import { EmissaoNfseModal } from '@/components/fiscal/emissao-nfse-modal';
import { RelatorioDasnModal } from '@/components/fiscal/relatorio-dasn-modal';
import { RelatorioFiscalPdfModal } from '@/components/fiscal/relatorio-fiscal-pdf-modal';
import { TermometroMei } from '@/components/fiscal/termometro-mei';
import { ReciboFiscalModal } from '@/components/recibo-fiscal-modal';
import { FiscalService } from '@/services/fiscal/fiscal-service';
import { gerarReciboFiscal } from '@/services/mercadopago';
import { supabase } from '@/services/supabase';
import type { PerfilUsuario } from '@/types/auth';
import type { ReciboFiscal, TransacaoFinanceira } from '@/types/financeiro';
import type {
  MetricasFiscaisArtista,
  NotaFiscalRegistro,
  PerfilFiscal,
  StatusNotaFiscal,
} from '@/types/fiscal';
import {
  AlertCircle,
  ArrowDownLeft,
  Check,
  Clock,
  FileCheck2,
  FileText,
  PieChart,
  Plus,
  QrCode,
  Settings,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface PropsFinanceiroTab {
  perfil: PerfilUsuario;
}

export function ArtistaFinanceiroTab({ perfil }: PropsFinanceiroTab) {
  const artistaId = perfil.id || perfil.uid || '';

  // Estados de dados
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscalRegistro[]>([]);
  const [perfilFiscal, setPerfilFiscal] = useState<PerfilFiscal | null>(null);
  const [metricasFiscais, setMetricasFiscais] = useState<MetricasFiscaisArtista>({
    tetoMeiAnual: 81000,
    faturamentoAcumuladoAno: 0,
    faturamentoMes: 0,
    percentualTetoMei: 0,
    faixaAlerta: 'NORMAL',
    saldoRestanteTeto: 81000,
    totalNotasEmitidas: 0,
    totalAutorizadas: 0,
    totalProcessando: 0,
    totalRejeitadas: 0,
    totalCanceladas: 0,
  });

  const [carregando, setCarregando] = useState(true);
  const [secaoAtiva, setSecaoAtiva] = useState<'NOTAS_FISCAIS' | 'TRANSACOES'>('NOTAS_FISCAIS');
  const [filtroTransacoes, setFiltroTransacoes] = useState<
    'TODOS' | 'CUSTODIA' | 'LIBERADO' | 'SINAIS'
  >('TODOS');
  const [filtroNotas, setFiltroNotas] = useState<StatusNotaFiscal | 'TODAS'>('TODAS');

  // Modais
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [modalEmissaoAberto, setModalEmissaoAberto] = useState(false);
  const [modalDasnAberto, setModalDasnAberto] = useState(false);
  const [modalPdfAberto, setModalPdfAberto] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscalRegistro | null>(null);
  const [modalDetalhesNotaAberto, setModalDetalhesNotaAberto] = useState(false);

  const [reciboSelecionado, setReciboSelecionado] = useState<ReciboFiscal | null>(null);
  const [modalReciboAberto, setModalReciboAberto] = useState(false);

  // Configurações de PIX e Sinal
  const [chavePix, setChavePix] = useState(perfil.chave_pix || 'pix@tatuador.com.br');
  const [percentualSinal, setPercentualSinal] = useState(String(perfil.percentual_sinal || 30));
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [salvoFeedback, setSalvoFeedback] = useState(false);

  useEffect(() => {
    if (artistaId) {
      carregarTudo();
    }
  }, [artistaId]);

  const carregarTudo = async () => {
    if (!artistaId) return;
    setCarregando(true);
    try {
      await Promise.all([
        carregarPerfilFiscal(),
        carregarNotasFiscais(),
        carregarTransacoes(),
        carregarMetricas(),
      ]);
    } catch {
      // silencioso
    } finally {
      setCarregando(false);
    }
  };

  const carregarPerfilFiscal = async () => {
    try {
      const p = await FiscalService.obterOuCriarPerfilFiscal(artistaId, perfil);
      setPerfilFiscal(p);
    } catch {
      // continua
    }
  };

  const carregarNotasFiscais = async () => {
    try {
      const notas = await FiscalService.listarNotasFiscais(artistaId);
      setNotasFiscais(notas);
    } catch {
      // continua
    }
  };

  const carregarMetricas = async () => {
    try {
      const m = await FiscalService.calcularMetricasFiscaisETetoMei(artistaId);
      setMetricasFiscais(m);
    } catch {
      // continua
    }
  };

  const carregarTransacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          cliente:profiles!transacoes_financeiras_cliente_id_fkey(nome_exibicao)
        `)
        .eq('artista_id', artistaId)
        .order('criado_em', { ascending: false });

      if (!error && data) {
        const formatados: TransacaoFinanceira[] = data.map((t: any) => ({
          ...t,
          cliente_nome: t.cliente?.nome_exibicao || 'Cliente Dermys',
        }));
        setTransacoes(formatados);
      }
    } catch {
      // continua
    }
  };

  const salvarConfiguracoesCobranca = async () => {
    if (!artistaId) return;
    setSalvandoConfig(true);
    try {
      await supabase
        .from('profiles')
        .update({
          chave_pix: chavePix,
          percentual_sinal: Number(percentualSinal) || 30,
        })
        .eq('id', artistaId);

      setSalvoFeedback(true);
      setTimeout(() => setSalvoFeedback(false), 2500);
    } catch {
      // silencioso
    } finally {
      setSalvandoConfig(false);
    }
  };

  // Cálculos consolidados
  const saldoLiberado = transacoes
    .filter((t) => t.status === 'LIBERADO' || t.status === 'APROVADO')
    .reduce((acc, t) => acc + Number(t.valor_liquido || 0), 0);

  const saldoCustodia = transacoes
    .filter((t) => t.status === 'CUSTODIA')
    .reduce((acc, t) => acc + Number(t.valor_bruto || 0), 0);

  const faturamentoBrutoMes = transacoes.reduce((acc, t) => acc + Number(t.valor_bruto || 0), 0);
  const totalTaxasMP = transacoes.reduce((acc, t) => acc + Number(t.taxa_mercado_pago || 0), 0);
  const faturamentoLiquido = faturamentoBrutoMes - totalTaxasMP;

  const transacoesFiltradas = transacoes.filter((t) => {
    if (filtroTransacoes === 'TODOS') return true;
    if (filtroTransacoes === 'CUSTODIA') return t.status === 'CUSTODIA';
    if (filtroTransacoes === 'LIBERADO') return t.status === 'LIBERADO' || t.status === 'APROVADO';
    if (filtroTransacoes === 'SINAIS') return t.tipo === 'SINAL';
    return true;
  });

  const notasFiltradas = notasFiscais.filter((n) => {
    if (filtroNotas === 'TODAS') return true;
    return n.status === filtroNotas;
  });

  const abrirReciboTransacao = (item: TransacaoFinanceira) => {
    const rec = gerarReciboFiscal({
      agendamentoId: item.agendamento_id || item.id,
      artistaNome: perfil.nome_exibicao || perfil.nomeExibicao || 'Artista',
      artistaDocumento: perfilFiscal?.cpf_cnpj || perfil.cpf_cnpj || '54.321.987/0001-23',
      artistaEstudio: perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio Particular',
      clienteNome: item.cliente_nome || 'Cliente Dermys',
      descricaoServico: item.descricao || 'Tatuagem Artística Autoral',
      estilo: 'Fine Line / Autoral',
      valorSinal: item.tipo === 'SINAL' ? item.valor_bruto : 150,
      valorFinal: item.valor_bruto,
      formaPagamento: item.forma_pagamento || 'PIX Mercado Pago',
      regimeTributario: (perfilFiscal?.regime_tributario as any) || 'MEI',
    });
    setReciboSelecionado(rec);
    setModalReciboAberto(true);
  };

  const abrirDetalhesNota = (nota: NotaFiscalRegistro) => {
    setNotaSelecionada(nota);
    setModalDetalhesNotaAberto(true);
  };

  return (
    <View style={styles.container}>
      {/* Cards de Saldo Principal */}
      <View style={styles.cardsRow}>
        <View style={[styles.cardHighlight, styles.cardHalf]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardHighlightLabel}>Saldo Disponível</Text>
            <Wallet size={15} color="#f3c21a" />
          </View>
          <Text style={styles.cardHighlightValue}>R$ {saldoLiberado.toFixed(2)}</Text>
          <Text style={styles.cardSubText}>Liberado Mercado Pago</Text>
        </View>

        <View style={[styles.cardHighlight, styles.cardHalf, styles.cardCustodia]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardCustodiaLabel}>Em Custódia</Text>
            <ShieldCheck size={15} color="#3b82f6" />
          </View>
          <Text style={styles.cardCustodiaValue}>R$ {saldoCustodia.toFixed(2)}</Text>
          <Text style={styles.cardSubText}>Sinais de reservas futuras</Text>
        </View>
      </View>

      {/* Barra de Ações do Módulo Fiscal */}
      <View style={styles.fiscalActionsRow}>
        <Pressable
          style={[styles.fiscalActionBtn, styles.fiscalActionBtnPrimary]}
          onPress={() => setModalEmissaoAberto(true)}
        >
          <Plus size={15} color="#111" />
          <Text style={styles.fiscalActionBtnPrimaryText}>Emitir Nota / Recibo</Text>
        </Pressable>

        <Pressable
          style={styles.fiscalActionBtn}
          onPress={() => setModalPdfAberto(true)}
        >
          <FileText size={15} color="#f3c21a" />
          <Text style={styles.fiscalActionBtnText}>Relatório em PDF</Text>
        </Pressable>

        <Pressable
          style={styles.fiscalActionBtn}
          onPress={() => setModalConfigAberto(true)}
        >
          <Settings size={15} color="#aaa" />
          <Text style={styles.fiscalActionBtnText}>Dados Fiscais</Text>
        </Pressable>
      </View>

      {/* Termômetro Fiscal do Teto MEI */}
      <TermometroMei
        metricas={metricasFiscais}
        onAbrirDasn={() => setModalDasnAberto(true)}
      />

      {/* Toggle de Seções: Notas Fiscais vs Extrato MP */}
      <View style={styles.sectionToggleWrap}>
        <Pressable
          style={[
            styles.sectionToggleBtn,
            secaoAtiva === 'NOTAS_FISCAIS' && styles.sectionToggleBtnActive,
          ]}
          onPress={() => setSecaoAtiva('NOTAS_FISCAIS')}
        >
          <FileCheck2
            size={14}
            color={secaoAtiva === 'NOTAS_FISCAIS' ? '#111' : '#888'}
          />
          <Text
            style={[
              styles.sectionToggleBtnText,
              secaoAtiva === 'NOTAS_FISCAIS' && styles.sectionToggleBtnTextActive,
            ]}
          >
            Notas Fiscais ({notasFiscais.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.sectionToggleBtn,
            secaoAtiva === 'TRANSACOES' && styles.sectionToggleBtnActive,
          ]}
          onPress={() => setSecaoAtiva('TRANSACOES')}
        >
          <PieChart
            size={14}
            color={secaoAtiva === 'TRANSACOES' ? '#111' : '#888'}
          />
          <Text
            style={[
              styles.sectionToggleBtnText,
              secaoAtiva === 'TRANSACOES' && styles.sectionToggleBtnTextActive,
            ]}
          >
            Extrato de Cobranças ({transacoes.length})
          </Text>
        </Pressable>
      </View>

      {/* Conteúdo da Seção 1: Histórico de Notas Fiscais (NFS-e & Recibos) */}
      {secaoAtiva === 'NOTAS_FISCAIS' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FileCheck2 size={16} color="#f3c21a" />
            <Text style={styles.sectionTitle}>Histórico de Documentos Fiscais</Text>
          </View>

          {/* Filtros de Status de Notas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { id: 'TODAS', label: 'Todas' },
              { id: 'AUTORIZADA', label: 'Autorizadas' },
              { id: 'PROCESSANDO', label: 'Processando' },
              { id: 'REJEITADA', label: 'Rejeitadas' },
              { id: 'CANCELADA', label: 'Canceladas' },
            ].map((f) => {
              const ativo = filtroNotas === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFiltroNotas(f.id as any)}
                  style={[styles.filterTag, ativo ? styles.filterTagActive : styles.filterTagIdle]}
                >
                  <Text style={[styles.filterTagText, ativo && styles.filterTagTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Lista de Notas Fiscais */}
          {carregando ? (
            <ActivityIndicator color="#f3c21a" style={{ marginVertical: 20 }} />
          ) : notasFiltradas.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nenhuma nota fiscal encontrada</Text>
              <Text style={styles.emptySub}>
                {filtroNotas === 'TODAS'
                  ? 'Você ainda não emitiu notas fiscais. Clique no botão acima para emitir sua primeira NFS-e.'
                  : `Nenhuma nota com status "${filtroNotas}".`}
              </Text>
            </View>
          ) : (
            <View style={styles.transacoesList}>
              {notasFiltradas.map((nota) => {
                const isAut = nota.status === 'AUTORIZADA';
                const isProc = nota.status === 'PROCESSANDO';
                const isRej = nota.status === 'REJEITADA';

                return (
                  <Pressable
                    key={nota.id}
                    style={styles.transacaoItem}
                    onPress={() => abrirDetalhesNota(nota)}
                  >
                    <View style={styles.transacaoIconWrap}>
                      {isAut ? (
                        <ShieldCheck size={18} color="#10b981" />
                      ) : isProc ? (
                        <Clock size={18} color="#f3c21a" />
                      ) : isRej ? (
                        <AlertCircle size={18} color="#ef4444" />
                      ) : (
                        <XCircle size={18} color="#888" />
                      )}
                    </View>

                    <View style={styles.transacaoInfo}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.transacaoCliente}>
                          {nota.dados_tomador?.nome || 'Cliente Final'}
                        </Text>
                        <Text style={styles.notaTipoPill}>
                          {nota.tipo_documento === 'RECIBO_SIMPLES' ? 'RECIBO' : 'NFS-E'}
                        </Text>
                      </View>

                      <Text style={styles.transacaoDesc}>
                        Nº {nota.numero_documento} • {nota.descricao_servico}
                      </Text>

                      <View style={styles.transacaoBadgeRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            isAut
                              ? styles.badgeLiberado
                              : isProc
                              ? styles.badgePendente
                              : isRej
                              ? styles.badgeRejeitado
                              : styles.badgeCancelado,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isAut
                                ? styles.badgeLiberadoText
                                : isProc
                                ? styles.badgePendenteText
                                : isRej
                                ? styles.badgeRejeitadoText
                                : styles.badgeCanceladoText,
                            ]}
                          >
                            {nota.status}
                          </Text>
                        </View>
                        <Text style={styles.transacaoData}>
                          {new Date(nota.criado_em).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transacaoValores}>
                      <Text style={styles.valorBrutoText}>
                        R$ {Number(nota.valor_servicos).toFixed(2)}
                      </Text>
                      <Text style={styles.verReciboBtnText}>Ver Detalhes</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Conteúdo da Seção 2: Extrato de Transações Mercado Pago */}
      {secaoAtiva === 'TRANSACOES' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <PieChart size={16} color="#f3c21a" />
            <Text style={styles.sectionTitle}>Extrato de Transações</Text>
          </View>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {[
              { id: 'TODOS', label: 'Tudo' },
              { id: 'CUSTODIA', label: 'Em Custódia' },
              { id: 'LIBERADO', label: 'Liberados' },
              { id: 'SINAIS', label: 'Sinais MP' },
            ].map((f) => {
              const ativo = filtroTransacoes === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFiltroTransacoes(f.id as any)}
                  style={[styles.filterTag, ativo ? styles.filterTagActive : styles.filterTagIdle]}
                >
                  <Text style={[styles.filterTagText, ativo && styles.filterTagTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Lista de Transações */}
          {carregando ? (
            <ActivityIndicator color="#f3c21a" style={{ marginVertical: 20 }} />
          ) : transacoesFiltradas.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nenhuma transação nesta categoria</Text>
              <Text style={styles.emptySub}>
                Transações liquidadas via PIX ou Cartão aparecerão listadas aqui.
              </Text>
            </View>
          ) : (
            <View style={styles.transacoesList}>
              {transacoesFiltradas.map((t) => {
                const isCustodia = t.status === 'CUSTODIA';
                const isLiberado = t.status === 'LIBERADO' || t.status === 'APROVADO';

                return (
                  <Pressable
                    key={t.id}
                    style={styles.transacaoItem}
                    onPress={() => abrirReciboTransacao(t)}
                  >
                    <View style={styles.transacaoIconWrap}>
                      {isCustodia ? (
                        <ShieldCheck size={18} color="#3b82f6" />
                      ) : (
                        <ArrowDownLeft size={18} color="#10b981" />
                      )}
                    </View>

                    <View style={styles.transacaoInfo}>
                      <Text style={styles.transacaoCliente}>{t.cliente_nome}</Text>
                      <Text style={styles.transacaoDesc}>
                        {t.descricao || 'Procedimento Tattoo'}
                      </Text>
                      <View style={styles.transacaoBadgeRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            isCustodia
                              ? styles.badgeCustodia
                              : isLiberado
                              ? styles.badgeLiberado
                              : styles.badgePendente,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isCustodia
                                ? styles.badgeCustodiaText
                                : isLiberado
                                ? styles.badgeLiberadoText
                                : styles.badgePendenteText,
                            ]}
                          >
                            {t.status}
                          </Text>
                        </View>
                        <Text style={styles.transacaoData}>
                          {new Date(t.criado_em).toLocaleDateString('pt-BR')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transacaoValores}>
                      <Text style={styles.valorBrutoText}>
                        R$ {Number(t.valor_bruto).toFixed(2)}
                      </Text>
                      {t.taxa_mercado_pago > 0 && (
                        <Text style={styles.taxaMpText}>
                          Taxa: -R$ {Number(t.taxa_mercado_pago).toFixed(2)}
                        </Text>
                      )}
                      <Text style={styles.verReciboBtnText}>Ver Recibo</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Configurações de Pagamento e Chave PIX */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <QrCode size={16} color="#f3c21a" />
          <Text style={styles.sectionTitle}>Chave PIX & Sinal de Reserva</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Chave PIX para Recebimentos</Text>
          <TextInput
            value={chavePix}
            onChangeText={setChavePix}
            placeholder="Ex: CPF, CNPJ, E-mail ou Telefone"
            placeholderTextColor="#666"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>% de Sinal Padrão</Text>
          <TextInput
            value={percentualSinal}
            onChangeText={setPercentualSinal}
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor="#666"
            style={styles.input}
          />
        </View>

        <Pressable
          style={styles.saveBtn}
          onPress={salvarConfiguracoesCobranca}
          disabled={salvandoConfig}
        >
          {salvandoConfig ? (
            <ActivityIndicator color="#111" size="small" />
          ) : salvoFeedback ? (
            <>
              <Check size={16} color="#111" />
              <Text style={styles.saveBtnText}>Parâmetros Salvos!</Text>
            </>
          ) : (
            <Text style={styles.saveBtnText}>Salvar Parâmetros</Text>
          )}
        </Pressable>
      </View>

      {/* Modais Fiscais & Financeiros */}
      {perfilFiscal && (
        <ConfigFiscalModal
          visivel={modalConfigAberto}
          perfilFiscal={perfilFiscal}
          onSalvar={(atualizado) => {
            setPerfilFiscal(atualizado);
            carregarMetricas();
          }}
          onClose={() => setModalConfigAberto(false)}
        />
      )}

      <EmissaoNfseModal
        visivel={modalEmissaoAberto}
        artistaId={artistaId}
        perfilFiscal={perfilFiscal || undefined}
        onSucesso={(novaNota) => {
          setNotasFiscais((prev) => [novaNota, ...prev]);
          carregarMetricas();
          abrirDetalhesNota(novaNota);
        }}
        onClose={() => setModalEmissaoAberto(false)}
      />

      <DetalhesNotaModal
        visivel={modalDetalhesNotaAberto}
        nota={notaSelecionada}
        onNotaAtualizada={(atualizada) => {
          setNotasFiscais((prev) =>
            prev.map((n) => (n.id === atualizada.id ? atualizada : n))
          );
          carregarMetricas();
        }}
        onClose={() => setModalDetalhesNotaAberto(false)}
      />

      <RelatorioDasnModal
        visivel={modalDasnAberto}
        artistaId={artistaId}
        onClose={() => setModalDasnAberto(false)}
      />

      <RelatorioFiscalPdfModal
        visivel={modalPdfAberto}
        perfil={perfil}
        perfilFiscal={perfilFiscal}
        metricas={metricasFiscais}
        notasFiscais={notasFiscais}
        transacoes={transacoes}
        onClose={() => setModalPdfAberto(false)}
      />

      <ReciboFiscalModal
        visivel={modalReciboAberto}
        recibo={reciboSelecionado}
        onClose={() => setModalReciboAberto(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardHalf: {
    flex: 1,
  },
  cardHighlight: {
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    padding: 14,
    gap: 4,
  },
  cardCustodia: {
    borderColor: 'rgba(59, 130, 246, 0.25)',
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHighlightLabel: {
    color: '#f3c21a',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardCustodiaLabel: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardHighlightValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  cardCustodiaValue: {
    color: '#93c5fd',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  cardSubText: {
    color: '#6b7280',
    fontSize: 10,
  },
  fiscalActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fiscalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  fiscalActionBtnPrimary: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  fiscalActionBtnPrimaryText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  fiscalActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    gap: 4,
  },
  sectionToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sectionToggleBtnActive: {
    backgroundColor: '#f3c21a',
  },
  sectionToggleBtnText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionToggleBtnTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#101010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterTagIdle: {
    backgroundColor: '#161616',
    borderColor: '#242424',
  },
  filterTagActive: {
    backgroundColor: '#262626',
    borderColor: '#f3c21a',
  },
  filterTagText: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
  },
  filterTagTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  transacoesList: {
    gap: 8,
  },
  transacaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    padding: 10,
    gap: 10,
  },
  transacaoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transacaoInfo: {
    flex: 1,
    gap: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transacaoCliente: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  notaTipoPill: {
    color: '#888',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: '#1f1f1f',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  transacaoDesc: {
    color: '#777',
    fontSize: 10,
  },
  transacaoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeLiberado: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  badgeLiberadoText: {
    color: '#10b981',
  },
  badgePendente: {
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
  },
  badgePendenteText: {
    color: '#f3c21a',
  },
  badgeRejeitado: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  badgeRejeitadoText: {
    color: '#ef4444',
  },
  badgeCancelado: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  badgeCanceladoText: {
    color: '#6b7280',
  },
  badgeCustodia: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  badgeCustodiaText: {
    color: '#60a5fa',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  transacaoData: {
    color: '#666',
    fontSize: 9,
  },
  transacaoValores: {
    alignItems: 'flex-end',
    gap: 2,
  },
  valorBrutoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  taxaMpText: {
    color: '#ef4444',
    fontSize: 9,
  },
  verReciboBtnText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '700',
  },
  emptyWrap: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySub: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#161616',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    borderRadius: 8,
    paddingVertical: 9,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
});
