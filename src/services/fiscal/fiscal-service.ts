import { obterAdaptadorFiscal } from './adapters';
import { calcularSplitFiscal } from '@/services/split/split-service';
import { supabase } from '@/services/supabase';
import type {
  FaixaAlertaTetoMei,
  ItemRelatorioMensalDASN,
  MetricasFiscaisArtista,
  NotaFiscalRegistro,
  PerfilFiscal,
  RelatorioDASN,
  SolicitacaoEmissaoNfse,
  StatusNotaFiscal,
} from '@/types/fiscal';

const TETO_MEI_ANUAL = 81000;

export const FiscalService = {
  /**
   * Obtém o perfil fiscal cadastrado ou gera um rascunho com dados do perfil de usuário
   */
  async obterOuCriarPerfilFiscal(artistaId: string, perfilBase?: any): Promise<PerfilFiscal> {
    try {
      const { data, error } = await supabase
        .from('fiscal_profiles')
        .select('*')
        .eq('artist_id', artistaId)
        .maybeSingle();

      if (data && !error) {
        return {
          id: data.id,
          artist_id: data.artist_id,
          tipo_pessoa: data.tipo_pessoa || 'PJ',
          regime_tributario: data.regime_tributario || 'MEI',
          cpf_cnpj: data.cpf_cnpj || '',
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          inscricao_municipal: data.inscricao_municipal || '',
          cnae_padrao: data.cnae_padrao || '9609-2/06',
          codigo_tributacao_municipio: data.codigo_tributacao_municipio || '06.01',
          aliquota_iss: Number(data.aliquota_iss || 0),
          provedor_emissao: data.provedor_emissao || 'simulado',
          provedor_api_key: data.provedor_api_key || '',
          provedor_ambiente: data.provedor_ambiente || 'homologacao',
          certificado_a1_url: data.certificado_a1_url || '',
          certificado_a1_validade: data.certificado_a1_validade,
          emissao_automatica: data.emissao_automatica ?? true,
          email_notificacao_fiscal: data.email_notificacao_fiscal || '',
          telefone_notificacao_fiscal: data.telefone_notificacao_fiscal || '',
          criado_em: data.criado_em,
          atualizado_em: data.atualizado_em,
        };
      }
    } catch {
      // continua para fallback
    }

    // Se não existir, constrói rascunho inicial
    const nome = perfilBase?.nome_exibicao || perfilBase?.nomeExibicao || 'Artista Tatuador';
    const doc = perfilBase?.cpf_cnpj || '54.321.987/0001-23';

    return {
      artist_id: artistaId,
      tipo_pessoa: 'PJ',
      regime_tributario: 'MEI',
      cpf_cnpj: doc,
      razao_social: `${nome.toUpperCase()} TATTOO ART`,
      nome_fantasia: perfilBase?.nome_estudio || 'Estúdio Particular',
      inscricao_municipal: '12345678',
      cnae_padrao: '9609-2/06',
      codigo_tributacao_municipio: '06.01',
      aliquota_iss: 0,
      provedor_emissao: 'simulado',
      provedor_ambiente: 'homologacao',
      emissao_automatica: true,
      email_notificacao_fiscal: perfilBase?.email || '',
      telefone_notificacao_fiscal: perfilBase?.telefone || '',
    };
  },

  /**
   * Salva ou atualiza os dados do perfil fiscal no Supabase
   */
  async salvarPerfilFiscal(perfil: PerfilFiscal): Promise<PerfilFiscal> {
    const payload = {
      artist_id: perfil.artist_id,
      tipo_pessoa: perfil.tipo_pessoa,
      regime_tributario: perfil.regime_tributario,
      cpf_cnpj: perfil.cpf_cnpj,
      razao_social: perfil.razao_social,
      nome_fantasia: perfil.nome_fantasia,
      inscricao_municipal: perfil.inscricao_municipal,
      cnae_padrao: perfil.cnae_padrao,
      codigo_tributacao_municipio: perfil.codigo_tributacao_municipio,
      aliquota_iss: perfil.aliquota_iss,
      provedor_emissao: perfil.provedor_emissao,
      provedor_api_key: perfil.provedor_api_key,
      provedor_ambiente: perfil.provedor_ambiente,
      certificado_a1_url: perfil.certificado_a1_url,
      certificado_a1_validade: perfil.certificado_a1_validade,
      emissao_automatica: perfil.emissao_automatica,
      email_notificacao_fiscal: perfil.email_notificacao_fiscal,
      telefone_notificacao_fiscal: perfil.telefone_notificacao_fiscal,
      atualizado_em: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('fiscal_profiles')
      .upsert(payload, { onConflict: 'artist_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar configurações fiscais: ${error.message}`);
    }

    return {
      ...perfil,
      id: data.id,
      atualizado_em: data.atualizado_em,
    };
  },

  /**
   * Emite uma NFS-e ou Recibo Simples usando o provedor configurado
   */
  async emitirNotaFiscal(solicitacao: SolicitacaoEmissaoNfse): Promise<NotaFiscalRegistro> {
    const perfilFiscal = await this.obterOuCriarPerfilFiscal(solicitacao.artistaId);
    const provedor = obterAdaptadorFiscal(perfilFiscal.provedor_emissao);

    const tipoDoc = solicitacao.tipoDocumento || 'NFSE';
    const cnaeFinal = solicitacao.cnae || perfilFiscal.cnae_padrao || '9609-2/06';
    const codTribFinal = solicitacao.codigoTributacao || perfilFiscal.codigo_tributacao_municipio || '06.01';
    const aliquotaIss = Number(solicitacao.aliquotaIss ?? perfilFiscal.aliquota_iss ?? 0);

    // Se houver split configurado, calcula segregação fiscal
    const splitCalculado = solicitacao.split || calcularSplitFiscal({
      valorTotal: solicitacao.valorServico,
      taxaPlataformaPercent: 10,
    }).dadosSplit;

    const prestadorDados = {
      razaoSocial: perfilFiscal.razao_social,
      nomeFantasia: perfilFiscal.nome_fantasia,
      cpfCnpj: perfilFiscal.cpf_cnpj,
      inscricaoMunicipal: perfilFiscal.inscricao_municipal,
      cnae: cnaeFinal,
      codigoTributacaoMunicipio: codTribFinal,
      aliquotaIss,
    };

    let resultadoProvedor;
    if (tipoDoc === 'RECIBO_SIMPLES') {
      const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
      const numRecibo = `REC-${new Date().getFullYear()}-${hash}`;
      const codVerif = `AUT-${Date.now().toString(16).toUpperCase()}-${hash}`;

      resultadoProvedor = {
        sucesso: true,
        status: 'AUTORIZADA' as StatusNotaFiscal,
        numeroDocumento: numRecibo,
        codigoVerificacao: codVerif,
        provedorId: `REC-${Date.now()}`,
        urlPdf: `https://dermys.app/api/fiscal/recibo/${numRecibo}`,
        urlXml: undefined,
      };
    } else {
      resultadoProvedor = await provedor.emitirNfse({
        perfilFiscal,
        prestador: prestadorDados,
        tomador: solicitacao.tomador,
        valorServico: solicitacao.valorServico,
        valorDeducoes: 0,
        aliquotaIss,
        descricaoServico: solicitacao.descricaoServico,
        cnae: cnaeFinal,
        codigoTributacaoMunicipio: codTribFinal,
        referenciaExternaId: solicitacao.agendamentoId || `DERM-${Date.now()}`,
      });
    }

    const valorIss = Number(((solicitacao.valorServico * aliquotaIss) / 100).toFixed(2));
    const valorLiquido = Number((solicitacao.valorServico - valorIss).toFixed(2));

    const registroParaInserir = {
      fiscal_profile_id: perfilFiscal.id,
      artista_id: solicitacao.artistaId,
      cliente_id: solicitacao.clienteId,
      agendamento_id: solicitacao.agendamentoId,
      transacao_id: solicitacao.transacaoId,
      tipo_documento: tipoDoc,
      numero_documento: resultadoProvedor.numeroDocumento || `TEMP-${Date.now()}`,
      codigo_verificacao: resultadoProvedor.codigoVerificacao || '',
      status: resultadoProvedor.status,
      valor_servicos: solicitacao.valorServico,
      valor_deducoes: 0,
      valor_iss: valorIss,
      aliquota_iss: aliquotaIss,
      valor_liquido: valorLiquido,
      descricao_servico: solicitacao.descricaoServico,
      cnae: cnaeFinal,
      codigo_tributacao_municipio: codTribFinal,
      dados_tomador: solicitacao.tomador,
      dados_prestador: prestadorDados,
      dados_split: splitCalculado,
      url_pdf: resultadoProvedor.urlPdf,
      url_xml: resultadoProvedor.urlXml,
      mensagem_erro: resultadoProvedor.mensagemErro,
      provedor: perfilFiscal.provedor_emissao,
      provedor_id: resultadoProvedor.provedorId,
      emitida_em: resultadoProvedor.status === 'AUTORIZADA' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('notas_fiscais')
      .insert(registroParaInserir)
      .select()
      .single();

    if (error) {
      console.warn('[FiscalService] Erro ao salvar nota no banco:', error);
      // Retorna objeto local para não travar o fluxo caso haja falha de gravação
      return {
        id: `LOCAL-${Date.now()}`,
        ...registroParaInserir,
        criado_em: new Date().toISOString(),
      } as NotaFiscalRegistro;
    }

    return {
      id: data.id,
      fiscal_profile_id: data.fiscal_profile_id,
      artista_id: data.artista_id,
      cliente_id: data.cliente_id,
      agendamento_id: data.agendamento_id,
      transacao_id: data.transacao_id,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      codigo_verificacao: data.codigo_verificacao,
      status: data.status,
      valor_servicos: Number(data.valor_servicos),
      valor_deducoes: Number(data.valor_deducoes),
      valor_iss: Number(data.valor_iss),
      aliquota_iss: Number(data.aliquota_iss),
      valor_liquido: Number(data.valor_liquido),
      descricao_servico: data.descricao_servico,
      cnae: data.cnae,
      codigo_tributacao_municipio: data.codigo_tributacao_municipio,
      dados_tomador: data.dados_tomador,
      dados_prestador: data.dados_prestador,
      dados_split: data.dados_split,
      url_pdf: data.url_pdf,
      url_xml: data.url_xml,
      mensagem_erro: data.mensagem_erro,
      provedor: data.provedor,
      provedor_id: data.provedor_id,
      emitida_em: data.emitida_em,
      cancelada_em: data.cancelada_em,
      criado_em: data.criado_em,
      atualizado_em: data.atualizado_em,
    };
  },

  /**
   * Lista notas fiscais emitidas pelo artista com filtros opcionais
   */
  async listarNotasFiscais(
    artistaId: string,
    filtroStatus?: StatusNotaFiscal | 'TODAS'
  ): Promise<NotaFiscalRegistro[]> {
    try {
      let query = supabase
        .from('notas_fiscais')
        .select('*')
        .eq('artista_id', artistaId)
        .order('criado_em', { ascending: false });

      if (filtroStatus && filtroStatus !== 'TODAS') {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;

      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          fiscal_profile_id: item.fiscal_profile_id,
          artista_id: item.artista_id,
          cliente_id: item.cliente_id,
          agendamento_id: item.agendamento_id,
          transacao_id: item.transacao_id,
          tipo_documento: item.tipo_documento,
          numero_documento: item.numero_documento,
          codigo_verificacao: item.codigo_verificacao,
          status: item.status,
          valor_servicos: Number(item.valor_servicos),
          valor_deducoes: Number(item.valor_deducoes),
          valor_iss: Number(item.valor_iss),
          aliquota_iss: Number(item.aliquota_iss),
          valor_liquido: Number(item.valor_liquido),
          descricao_servico: item.descricao_servico,
          cnae: item.cnae,
          codigo_tributacao_municipio: item.codigo_tributacao_municipio,
          dados_tomador: item.dados_tomador || {},
          dados_prestador: item.dados_prestador || {},
          dados_split: item.dados_split,
          url_pdf: item.url_pdf,
          url_xml: item.url_xml,
          mensagem_erro: item.mensagem_erro,
          provedor: item.provedor,
          provedor_id: item.provedor_id,
          emitida_em: item.emitida_em,
          cancelada_em: item.cancelada_em,
          criado_em: item.criado_em,
          atualizado_em: item.atualizado_em,
        }));
      }
    } catch (err) {
      console.warn('[FiscalService] Erro ao listar notas:', err);
    }

    return [];
  },

  /**
   * Cancela uma nota fiscal autorizada
   */
  async cancelarNotaFiscal(notaId: string, motivo: string): Promise<boolean> {
    try {
      const { data: nota } = await supabase
        .from('notas_fiscais')
        .select('*, fiscal_profiles(*)')
        .eq('id', notaId)
        .single();

      if (!nota) return false;

      if (nota.provedor && nota.provedor_id && nota.fiscal_profiles) {
        const provedor = obterAdaptadorFiscal(nota.provedor);
        await provedor.cancelarNfse(nota.provedor_id, motivo, nota.fiscal_profiles);
      }

      await supabase
        .from('notas_fiscais')
        .update({
          status: 'CANCELADA',
          cancelada_em: new Date().toISOString(),
          mensagem_erro: `Cancelada: ${motivo}`,
        })
        .eq('id', notaId);

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Calcula métricas de faturamento acumulado e teto do MEI (R$ 81.000,00)
   */
  async calcularMetricasFiscaisETetoMei(artistaId: string): Promise<MetricasFiscaisArtista> {
    const anoAtual = new Date().getFullYear();
    const inicioAno = new Date(anoAtual, 0, 1).toISOString();
    const inicioMes = new Date(anoAtual, new Date().getMonth(), 1).toISOString();

    let faturamentoAno = 0;
    let faturamentoMes = 0;
    let totalEmitidas = 0;
    let totalAutorizadas = 0;
    let totalProcessando = 0;
    let totalRejeitadas = 0;
    let totalCanceladas = 0;

    try {
      const { data: notas } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('artista_id', artistaId)
        .gte('criado_em', inicioAno);

      if (notas && notas.length > 0) {
        totalEmitidas = notas.length;
        notas.forEach((n: any) => {
          const valor = Number(n.valor_servicos || 0);
          if (n.status === 'AUTORIZADA') {
            totalAutorizadas++;
            faturamentoAno += valor;
            if (n.criado_em >= inicioMes) {
              faturamentoMes += valor;
            }
          } else if (n.status === 'PROCESSANDO') {
            totalProcessando++;
          } else if (n.status === 'REJEITADA') {
            totalRejeitadas++;
          } else if (n.status === 'CANCELADA') {
            totalCanceladas++;
          }
        });
      }

      // Se não houver notas suficientes ainda, adicionamos o faturamento das transações financeiras
      if (faturamentoAno === 0) {
        const { data: transacoes } = await supabase
          .from('transacoes_financeiras')
          .select('valor_bruto, criado_em, status')
          .eq('artista_id', artistaId)
          .in('status', ['APROVADO', 'LIBERADO', 'CUSTODIA'])
          .gte('criado_em', inicioAno);

        if (transacoes && transacoes.length > 0) {
          transacoes.forEach((t: any) => {
            const val = Number(t.valor_bruto || 0);
            faturamentoAno += val;
            if (t.criado_em >= inicioMes) {
              faturamentoMes += val;
            }
          });
        }
      }
    } catch (err) {
      console.warn('[FiscalService] Erro ao calcular métricas:', err);
    }

    const percentualTeto = Math.min(100, Math.round((faturamentoAno / TETO_MEI_ANUAL) * 100));
    const saldoRestante = Math.max(0, TETO_MEI_ANUAL - faturamentoAno);

    let faixaAlerta: FaixaAlertaTetoMei = 'NORMAL';
    if (percentualTeto >= 100) {
      faixaAlerta = 'CRITICO_100';
    } else if (percentualTeto >= 85) {
      faixaAlerta = 'ALERTA_85';
    } else if (percentualTeto >= 70) {
      faixaAlerta = 'ALERTA_70';
    }

    return {
      tetoMeiAnual: TETO_MEI_ANUAL,
      faturamentoAcumuladoAno: faturamentoAno,
      faturamentoMes,
      percentualTetoMei: percentualTeto,
      faixaAlerta,
      saldoRestanteTeto: saldoRestante,
      totalNotasEmitidas: totalEmitidas,
      totalAutorizadas,
      totalProcessando,
      totalRejeitadas,
      totalCanceladas,
    };
  },

  /**
   * Gera relatório estruturado para Declaração Anual do Simples Nacional (DASN-SIMEI)
   */
  async gerarRelatorioDASN(artistaId: string, ano: number = new Date().getFullYear()): Promise<RelatorioDASN> {
    const nomesMeses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const meses: ItemRelatorioMensalDASN[] = nomesMeses.map((nome, idx) => ({
      mesNumero: idx + 1,
      mesNome: nome,
      receitaBrutaServicos: 0,
      receitaComRetencao: 0,
      deducoes: 0,
      receitaLiquida: 0,
      totalNotas: 0,
    }));

    const perfil = await this.obterOuCriarPerfilFiscal(artistaId);

    try {
      const inicioAno = new Date(ano, 0, 1).toISOString();
      const fimAno = new Date(ano, 11, 31, 23, 59, 59).toISOString();

      const { data: notas } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('artista_id', artistaId)
        .eq('status', 'AUTORIZADA')
        .gte('criado_em', inicioAno)
        .lte('criado_em', fimAno);

      if (notas && notas.length > 0) {
        notas.forEach((n: any) => {
          const d = new Date(n.criado_em);
          const mesIdx = d.getMonth();
          const valor = Number(n.valor_servicos || 0);
          const retencao = Number(n.valor_iss || 0);

          meses[mesIdx].receitaBrutaServicos += valor;
          meses[mesIdx].receitaComRetencao += retencao;
          meses[mesIdx].receitaLiquida += valor - retencao;
          meses[mesIdx].totalNotas++;
        });
      }
    } catch (err) {
      console.warn('[FiscalService] Erro ao gerar DASN:', err);
    }

    const faturamentoTotalAno = meses.reduce((acc, m) => acc + m.receitaBrutaServicos, 0);
    const percentualUtilizado = Math.min(100, Math.round((faturamentoTotalAno / TETO_MEI_ANUAL) * 100));

    return {
      ano,
      razaoSocial: perfil.razao_social,
      cnpj: perfil.cpf_cnpj,
      tetoAnual: TETO_MEI_ANUAL,
      faturamentoTotalAno,
      percentualUtilizado,
      meses,
      geradoEm: new Date().toISOString(),
    };
  },

  /**
   * Gera link direto de WhatsApp com mensagem formatada e links do documento
   */
  gerarLinkCompartilhamentoWhatsApp(nota: NotaFiscalRegistro): string {
    const nomeCliente = nota.dados_tomador?.nome || 'Cliente';
    const tel = nota.dados_tomador?.telefone?.replace(/\D/g, '') || '';
    const tipo = nota.tipo_documento === 'RECIBO_SIMPLES' ? 'Recibo' : 'Nota Fiscal de Serviço (NFS-e)';

    const texto =
      `Olá, ${nomeCliente}! Segue seu documento fiscal da sua sessão no Dermys Tattoo:\n\n` +
      `📄 *${tipo}*: Nº ${nota.numero_documento}\n` +
      `🔒 *Autenticação*: ${nota.codigo_verificacao}\n` +
      `💰 *Valor*: R$ ${nota.valor_servicos?.toFixed(2)}\n` +
      `📅 *Emissão*: ${new Date(nota.criado_em).toLocaleDateString('pt-BR')}\n\n` +
      (nota.url_pdf ? `📥 *Baixar PDF*: ${nota.url_pdf}\n` : '') +
      `Obrigado por tatuar conosco!`;

    const telParam = tel.length >= 10 ? `phone=55${tel}&` : '';
    return `https://api.whatsapp.com/send?${telParam}text=${encodeURIComponent(texto)}`;
  },
};
