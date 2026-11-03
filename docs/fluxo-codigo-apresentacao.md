# Dermys — fluxo, arquivos e código para o vídeo

Material de apoio ao roteiro de cinco minutos. Em cada etapa, mostre primeiro a tela real e depois apenas o trecho indicado, com o caminho do arquivo visível no editor. As inserções de código substituem parte do tempo das capturas; não aumentam a duração total.

## Fluxo geral

Cliente: Explore → perfil do artista → briefing → conversa e orçamento → reserva e sinal simulado.

Artista: agenda → ficha vinculada à sessão → atendimento → conclusão e quitação simulada.

Encerramento: cliente consulta recibo e cuidados; artista acompanha receitas, custos e resultado na DRE.

## Ordem de gravação

| Tempo | O que mostrar |
|---|---|
| 00:00–00:40 | Slides 1 e 2: projeto e tecnologias |
| 00:40–01:20 | Confluence e Jira, em consulta |
| 01:20–01:35 | Estrutura do repositório; explicar que as próximas etapas mostrarão o código correspondente |
| 01:35–01:55 | Slide 3: problema e solução |
| 01:55–04:40 | Fluxo real intercalado com os trechos abaixo |
| 04:40–05:00 | Retorno à capa e encerramento |

## 1. Descoberta do artista

**Tempo:** 01:55–02:30 · reserve cerca de 7 segundos para o código.

**Na tela:** Mariana pesquisa um estilo no Explore e abre o perfil de Camila.

**Arquivo:** [src/telas/cliente/inicio-tab.tsx](../src/telas/cliente/inicio-tab.tsx#L352) · linhas 352–358.

```tsx
    // Filtro por tag de estilo
    if (tagSelecionada !== 'Todos') {
      resultado = resultado.filter(
        (item) => normalizarBusca(item.estilo).includes(normalizarBusca(tagSelecionada))
      );
    }
    if (somenteSalvos) resultado = resultado.filter(item => curtidos[item.id]);
```

O filtro aplica o estilo selecionado e permite exibir apenas os artistas salvos. A interface usa esse resultado para montar o feed.

**Fala sugerida:** “A escolha do estilo altera os artistas apresentados no feed.”

## 2. Pedido e conversa

**Tempo:** 02:30–03:10 · primeira inserção de código, cerca de 6 segundos.

**Na tela:** Mostre o formulário com ideia, referências, tamanho e local do corpo; depois abra o card recebido no chat.

**Arquivo:** [src/services/chat-service.ts](../src/services/chat-service.ts#L478) · linhas 478–485.

```tsx
  static async enviarBriefing(
    remetenteId: string,
    destinatarioId: string,
    payload: CardBriefingPayload
  ): Promise<MensagemChat | null> {
    const payloadStr = `[DERMYS_CARD:${JSON.stringify({ tipo: 'briefing', payload })}]`;
    return await this.enviarMensagem(remetenteId, destinatarioId, payloadStr);
  }
```

O serviço recebe o briefing estruturado, identifica o tipo do card e envia a mensagem. O formulário chama esse serviço em src/telas/cliente/modal-reserva.tsx:509.

**Fala sugerida:** “O pedido vira uma mensagem estruturada, mantendo as informações do projeto na conversa.”

## 3. Confirmação do sinal

**Tempo:** 02:30–03:10 · segunda inserção, cerca de 7 segundos.

**Na tela:** Mostre o sinal simulado de R$ 180 e a reserva passando para confirmada.

**Arquivo:** [src/services/mercadopago.ts](../src/services/mercadopago.ts#L200) · linhas 200–203.

```tsx
export async function confirmarSinalSimulado(agendamentoId: string, dataHorario?: string) {
  const { data: transacoes, error } = await supabase.from('transacoes_financeiras').update({ status: 'CUSTODIA' })
    .eq('agendamento_id', agendamentoId).eq('tipo', 'SINAL').eq('status', 'PENDENTE').select('id');
  if (error) throw new Error('Não foi possível aprovar o sinal simulado.');
```

A aprovação simulada busca o sinal pendente daquele agendamento e altera sua situação para custódia. Na linha 208, a reserva recebe sinal_pago=true e status=confirmado. Este arquivo representa uma simulação; o nome não comprova integração com um provedor real.

**Fala sugerida:** “O sinal fica em custódia e confirma a reserva. Ele ainda não representa receita do serviço na DRE.”

## 4. Ficha e atendimento

**Tempo:** 03:10–03:45 · cerca de 7 segundos para o código.

**Na tela:** Troque para Camila e mostre a ficha fictícia vinculada ao agendamento e a sessão na agenda.

**Arquivo:** [src/telas/cliente/agendamentos-tab.tsx](../src/telas/cliente/agendamentos-tab.tsx#L240) · linhas 240–252.

```tsx
      // Salva ou atualiza a ficha vinculada ao agendamento
      await supabase.from('fichas_anamnese').insert({
        agendamento_id: agendamentoParaAnamnese.id,
        cliente_id: perfil?.id || perfil?.uid || session?.user?.id,
        artista_id: agendamentoParaAnamnese.artistaId,
        alergias: alergiasTexto,
        doencas_cronicas: condicoesTexto,
        medicamentos: usaAnticoagulante ? 'Anticoagulante relatado' : 'Nenhum',
        observacoes,
        assinado: true,
        tem_alerta_saude: temAlerta,
        data_assinatura: new Date().toISOString(),
      });
```

A ficha referencia o agendamento, o cliente e o artista e registra assinatura e indicação de alerta. Este trecho mostra o vínculo de dados; não é uma auditoria da validação ou das permissões.

**Fala sugerida:** “A ficha fica ligada à sessão, permitindo consultar o preenchimento e os alertas durante o atendimento.”

## 5. Conclusão e quitação

**Tempo:** 03:45–04:20 · primeira inserção, cerca de 6 segundos.

**Na tela:** Mostre os R$ 420 restantes e a sessão concluída na visão da artista.

**Arquivo:** [src/telas/artista/agenda-tab.tsx](../src/telas/artista/agenda-tab.tsx#L291) · linhas 291–300.

```tsx
      if (session?.user || demoAtiva()) {
        const cobranca = await criarCobrancaFinal({
          agendamentoId: itemFinalizando.id,
          artistaId: artistaId,
          clienteId: itemFinalizando.clienteId,
          valorFinal: precoFinal,
          valorSinalJaPago: itemFinalizando.valorSinal,
          metodo: metodoPagamentoFinal,
          artistaNome: perfil.nomeExibicao || perfil.nome_exibicao || 'Tatuador Dermys',
        });
```

A tela chama a cobrança final passando o valor total e o sinal já pago. O cálculo do saldo fica em src/services/mercadopago.ts:223; a atualização da sessão para concluído fica em src/telas/artista/agenda-tab.tsx:307.

**Fala sugerida:** “Na quitação, o sistema considera o sinal já pago para calcular o saldo restante.”

## 6. Resultado na DRE

**Tempo:** 03:45–04:20 · segunda inserção, cerca de 7 segundos.

**Na tela:** Abra a DRE na aba financeira de Camila. Mostre receita, custos e resultado do período.

**Arquivo:** [src/services/dre.ts](../src/services/dre.ts#L30) · linhas 30–35.

```tsx
  const receitaLiquida = v.receitaBruta - v.deducoes;
  const lucroBruto = receitaLiquida - v.custos;
  const operacional = lucroBruto - v.vendas - v.administrativas - v.depreciacao;
  const antesTributos = operacional + v.receitasFinanceiras - v.despesasFinanceiras;
  const liquido = antesTributos - v.tributosLucro;
  const margem = (valor: number) => receitaLiquida > 0 ? valor / receitaLiquida * 100 : null;
```

Este é o cálculo central da DRE. Os valores nesta parte já foram convertidos para centavos nas linhas 22–29. A apresentação visual fica em src/components/fiscal/dre-painel.tsx. O cenário inclui outros atendimentos; R$ 600 de receita e R$ 90 de materiais são apenas o efeito adicional desta jornada.

**Fala sugerida:** “As receitas, deduções, custos e despesas formam o resultado do período.”

## 7. Recibo e cuidados

**Tempo:** 04:20–04:40 · cerca de 5 segundos para o código.

**Na tela:** Volte para Mariana, abra o recibo demonstrativo e o Guia Pós-Tattoo.

**Arquivo:** [src/telas/cliente/agendamentos-tab.tsx](../src/telas/cliente/agendamentos-tab.tsx#L283) · linhas 283–286.

```tsx
  const abrirGuiaAftercare = (artistaNome: string) => {
    setArtistaAftercareNome(artistaNome);
    setAftercareAberto(true);
  };
```

A ação seleciona o nome do artista e abre o guia. O conteúdo visual fica em src/components/aftercare-modal.tsx:20. A montagem do recibo começa em src/telas/cliente/agendamentos-tab.tsx:307.

**Fala sugerida:** “Depois da sessão, o cliente pode consultar o documento demonstrativo e abrir as orientações de cuidado.”

## Controle da apresentação

O painel que prepara os estados do cenário está em src/components/debug/apresentacao-painel.tsx. A sequência dos sete passos está em src/services/apresentacao-store.ts:118; o avanço começa na linha 128.

Esse arquivo prepara dados locais para a demonstração. Para explicar a implementação do produto, priorize os arquivos de tela e serviço apresentados acima. Ao usar o botão de avanço, diga que está preparando a próxima etapa do cenário.

## Legibilidade na gravação

- Abra apenas um arquivo por vez, com fonte ampliada e entre 6 e 13 linhas visíveis.
- Deixe o caminho do arquivo visível e destaque o bloco que está explicando.
- Mostre primeiro o resultado no app e depois a regra correspondente.
- Use dados fictícios e mantenha a indicação de simulação nos pagamentos e documentos.
- Os trechos foram extraídos dos arquivos locais; não equivalem a uma gravação ou a novos testes do aplicativo.
