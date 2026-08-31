import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { USAR_MOCK_AUTH } from '@/constants/feature-flags';

const urlEnv = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chaveAnonEnv = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const ehRuntimeServidor = typeof window === 'undefined';

const obterValorString = (valor: string | undefined, padrao: string) => {
  if (typeof valor === 'string' && valor.trim().length > 0) {
    return valor;
  }

  return padrao;
};

const estadoArmazenamentoServidor = new Map<string, string>();
const armazenamentoServidor = {
  getItem: async (chave: string) => {
    const valor = estadoArmazenamentoServidor.get(chave);
    if (typeof valor === 'string' && valor.length > 0) {
      return valor;
    }
    return null;
  },
  setItem: async (chave: string, valor: string) => {
    estadoArmazenamentoServidor.set(chave, valor);
  },
  removeItem: async (chave: string) => {
    estadoArmazenamentoServidor.delete(chave);
  },
};

const temUrlSupabase = typeof urlEnv === 'string' && urlEnv.trim().length > 0;
const temChaveAnon = typeof chaveAnonEnv === 'string' && chaveAnonEnv.trim().length > 0;

let deveUsarFallback = false;
if (USAR_MOCK_AUTH) {
  if (!temUrlSupabase) {
    deveUsarFallback = true;
  } else if (!temChaveAnon) {
    deveUsarFallback = true;
  }
}

let urlSupabase = obterValorString(urlEnv, '');
if (deveUsarFallback) {
  urlSupabase = 'https://mock.supabase.local';
}

let chaveAnonSupabase = obterValorString(chaveAnonEnv, '');
if (deveUsarFallback) {
  chaveAnonSupabase = 'mock-anon-key';
}

if (!USAR_MOCK_AUTH) {
  const urlValida = typeof urlSupabase === 'string' && urlSupabase.trim().length > 0;
  const chaveValida = typeof chaveAnonSupabase === 'string' && chaveAnonSupabase.trim().length > 0;

  if (!urlValida) {
    throw new Error(
      'Supabase nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  if (!chaveValida) {
    throw new Error(
      'Supabase nao configurado. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
}

export const supabase = createClient(urlSupabase, chaveAnonSupabase, {
  auth: {
    storage: ehRuntimeServidor ? armazenamentoServidor : AsyncStorage,
    autoRefreshToken: !ehRuntimeServidor,
    persistSession: !ehRuntimeServidor,
    detectSessionInUrl: !ehRuntimeServidor,
  },
});