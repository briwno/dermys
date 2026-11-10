import type { MensagemChat, TipoCardMensagem } from '@/types/chat';

/** As etapas de uma reserva não podem bloquear o próximo pedido na mesma conversa. */
export function obterFluxoAtendimento(mensagens: MensagemChat[]) {
  const ultimo = (lista: MensagemChat[], tipo: TipoCardMensagem) =>
    [...lista].reverse().find(m => m.tipo_mensagem === tipo);
  const ultimoBriefing = ultimo(mensagens, 'briefing');
  const inicio = ultimoBriefing ? mensagens.indexOf(ultimoBriefing) : 0;
  const agendamentoId = ultimoBriefing
    ? ultimoBriefing.card_payload?.agendamentoId
    : [...mensagens].reverse().find(m => m.card_payload?.agendamentoId)?.card_payload?.agendamentoId;
  const mensagensDoAtendimento = mensagens.filter((m, indice) => {
    const id = m.card_payload?.agendamentoId;
    return id && agendamentoId ? id === agendamentoId : indice >= inicio;
  });
  const ultimaProposta = ultimo(mensagensDoAtendimento, 'quote');
  const ultimoSinal = ultimo(mensagensDoAtendimento, 'deposit_confirmed');
  const ultimaSessaoConcluida = ultimo(mensagensDoAtendimento, 'session_completed');
  return {
    agendamentoId, ultimoBriefing, ultimaProposta, ultimoSinal, ultimaSessaoConcluida,
    temAnamneseAssinada: mensagensDoAtendimento.some(m =>
      m.conteudo?.includes('Ficha de Anamnese & Saúde assinada') ||
      m.conteudo?.includes('Ficha de Saúde assinada')),
    podePropor: Boolean(ultimoBriefing && !ultimaProposta && !ultimoSinal && !ultimaSessaoConcluida),
  };
}
