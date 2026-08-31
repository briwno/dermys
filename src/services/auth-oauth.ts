import { supabase } from '@/services/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export function extrairParametrosDeUrl(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  try {
    // 1. Extrair query params (?a=b&c=d)
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      const queryString = url.slice(queryIndex + 1).split('#')[0];
      const pairs = queryString.split('&');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }

    // 2. Extrair hash params (#a=b&c=d)
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hashString = url.slice(hashIndex + 1);
      const pairs = hashString.split('&');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }
  } catch {
    // silencioso
  }

  return params;
}

export async function processarRetornoOAuthUrl(url: string) {
  if (!url) return null;

  const params = extrairParametrosDeUrl(url);

  // Caso 1: PKCE com 'code'
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.user;
  }

  // Caso 2: Implicit Flow com 'access_token' e 'refresh_token'
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.user;
  }

  // Caso 3: Verificar se sessão já foi atualizada
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function iniciarLoginGoogle() {
  const redirectTo = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.location.origin : Linking.createURL('/'))
    : Linking.createURL('/');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Não foi possível obter URL de autenticação.');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.location.href = data.url;
    }
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    return await processarRetornoOAuthUrl(result.url);
  }

  // Tenta checar sessão se o browser fechou
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}
