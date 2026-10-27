import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@dermys:persona_teste:v1';
let selecionada: string | null = null;
let revisao = 0;
let gravacao: Promise<void> = Promise.resolve();

export const obterPersonaTeste = () => selecionada;
export const obterRevisaoPersona = () => revisao;

export async function selecionarPersonaTeste(id: string | null) {
  selecionada = id;
  revisao++;
  gravacao = gravacao.catch(() => {}).then(() => id ? AsyncStorage.setItem(CHAVE, id) : AsyncStorage.removeItem(CHAVE));
  await gravacao;
}

export function deveCarregarPerfilAuth(evento: string, userId: string | undefined, carregadoId: string | null) {
  return !selecionada && !!userId && evento !== 'TOKEN_REFRESHED' && evento !== 'INITIAL_SESSION' &&
    (evento === 'USER_UPDATED' || carregadoId !== userId);
}

export async function restaurarPersonaTeste(idsPermitidos: string[]) {
  const versao = revisao;
  const salvo = await AsyncStorage.getItem(CHAVE);
  if (versao === revisao) selecionada = salvo && idsPermitidos.includes(salvo) ? salvo : null;
  return selecionada;
}
