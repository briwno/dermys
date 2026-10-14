import { StyleSheet } from 'react-native';

import { converterParaClaro } from './cores';

export type ModoTema = 'escuro' | 'claro';

/**
 * Modo atual mantido em nível de módulo para que estilos criados com
 * `createThemedStyles` e cores envolvidas por `tc()` resolvam o valor certo
 * durante a renderização. O `ThemeProvider` atualiza este valor antes de
 * disparar a re-renderização da árvore.
 */
let modoAtual: ModoTema = 'escuro';

export function getModoTema(): ModoTema {
  return modoAtual;
}

export function definirModoTemaGlobal(modo: ModoTema): void {
  modoAtual = modo;
}

/** Retorna a cor adequada ao tema atual (a cor informada é a da paleta escura). */
export function tc(corEscura: string): string {
  return modoAtual === 'claro' ? converterParaClaro(corEscura) : corEscura;
}

const PROPS_SEM_CONVERSAO = new Set(['shadowColor']);

type EstiloGenerico = Record<string, unknown>;

function converterEstilo(estilo: EstiloGenerico): EstiloGenerico {
  const saida: EstiloGenerico = {};
  for (const [chave, valor] of Object.entries(estilo)) {
    if (
      typeof valor === 'string' &&
      /color$/i.test(chave) &&
      !PROPS_SEM_CONVERSAO.has(chave)
    ) {
      saida[chave] = converterParaClaro(valor);
    } else {
      saida[chave] = valor;
    }
  }
  return saida;
}

/**
 * Substituto de `StyleSheet.create` com suporte a tema.
 * Recebe os estilos da paleta escura e gera automaticamente a versão clara.
 * Cada propriedade do objeto retornado resolve o estilo do modo atual.
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  estilos: T & StyleSheet.NamedStyles<any>
): T {
  const escuro = StyleSheet.create(estilos);
  let claro: T | null = null;

  const obterClaro = (): T => {
    if (!claro) {
      const convertido: Record<string, EstiloGenerico> = {};
      for (const [nome, estilo] of Object.entries(estilos as Record<string, EstiloGenerico>)) {
        convertido[nome] = converterEstilo(estilo);
      }
      claro = StyleSheet.create(convertido as unknown as T & StyleSheet.NamedStyles<any>);
    }
    return claro;
  };

  const resultado = {} as T;
  for (const nome of Object.keys(estilos) as (keyof T)[]) {
    Object.defineProperty(resultado, nome, {
      enumerable: true,
      get: () => (modoAtual === 'claro' ? obterClaro()[nome] : escuro[nome]),
    });
  }
  return resultado;
}
