import type { MensagemChat } from '../types/chat';

export function deduplicarListaMensagensParaTeste(lista: MensagemChat[]): MensagemChat[] {
  const mapaUnicas = new Map<string, MensagemChat>();

  for (const m of lista) {
    const agId = m.card_payload?.agendamentoId;
    const chaveCard = agId && m.tipo_mensagem !== 'texto' ? `card_${m.tipo_mensagem}_${agId}` : null;

    let chaveExistente: string | null = null;
    for (const [k, existente] of mapaUnicas.entries()) {
      if (existente.id === m.id) {
        chaveExistente = k;
        break;
      }
      if (
        chaveCard &&
        existente.tipo_mensagem === m.tipo_mensagem &&
        existente.card_payload?.agendamentoId === agId
      ) {
        chaveExistente = k;
        break;
      }
      if (
        existente.tipo_mensagem === 'texto' &&
        m.tipo_mensagem === 'texto' &&
        existente.remetente_id === m.remetente_id &&
        existente.destinatario_id === m.destinatario_id &&
        existente.conteudo.trim() === m.conteudo.trim() &&
        Math.abs(new Date(existente.criado_em).getTime() - new Date(m.criado_em).getTime()) < 4000
      ) {
        chaveExistente = k;
        break;
      }
    }

    if (chaveExistente) {
      const atual = mapaUnicas.get(chaveExistente)!;
      if (new Date(m.criado_em).getTime() >= new Date(atual.criado_em).getTime()) {
        mapaUnicas.set(chaveExistente, m);
      }
    } else {
      const chaveFinal = chaveCard || m.id;
      mapaUnicas.set(chaveFinal, m);
    }
  }

  const resultado = Array.from(mapaUnicas.values());
  resultado.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  return resultado;
}
