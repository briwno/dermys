import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { definirModoTemaGlobal, type ModoTema } from './tema-store';

const CHAVE_STORAGE = '@dermys/modo-tema';

interface ValorContextoTema {
  modo: ModoTema;
  modoClaro: boolean;
  alternarModo: () => void;
  definirModo: (modo: ModoTema) => void;
}

const ContextoTema = createContext<ValorContextoTema | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTema>('escuro');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(CHAVE_STORAGE)
      .then((salvo) => {
        if (!ativo) return;
        if (salvo === 'claro' || salvo === 'escuro') {
          definirModoTemaGlobal(salvo);
          setModo(salvo);
        }
      })
      .catch(() => {
        // mantém o modo escuro padrão
      })
      .finally(() => {
        if (ativo) setCarregado(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const definirModo = useCallback((novo: ModoTema) => {
    // Atualiza o valor global ANTES da re-renderização
    definirModoTemaGlobal(novo);
    setModo(novo);
    AsyncStorage.setItem(CHAVE_STORAGE, novo).catch(() => {
      // persistência é opcional
    });
  }, []);

  const alternarModo = useCallback(() => {
    definirModo(modo === 'claro' ? 'escuro' : 'claro');
  }, [definirModo, modo]);

  const valor = useMemo<ValorContextoTema>(
    () => ({ modo, modoClaro: modo === 'claro', alternarModo, definirModo }),
    [modo, alternarModo, definirModo]
  );

  if (!carregado) return null;

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

/**
 * Acessa o tema atual. Componentes que chamam este hook re-renderizam
 * (junto com seus filhos) quando o modo muda.
 */
export function useTheme(): ValorContextoTema {
  const ctx = useContext(ContextoTema);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
