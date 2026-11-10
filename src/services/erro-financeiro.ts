export function erroFinanceiro(erro: unknown, padrao: string): Error {
  const codigo = (erro as { code?: string } | null)?.code;
  if (codigo === '42501' || codigo === 'PGRST301' || codigo === 'PGRST302' || codigo === 'PGRST303') {
    return new Error('A sessão desta conta não permite registrar o pagamento. Entre novamente na conta de teste e tente outra vez.');
  }
  if (codigo === '23503') {
    return new Error('Esta reserva ou um dos perfis foi removido. Abra o pedido atual no chat para continuar.');
  }
  return new Error(padrao);
}
