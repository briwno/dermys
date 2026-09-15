import { supabase } from '@/services/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export const AUTH_REDIRECT_URL =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'https://vercel-redirect-silk-six.vercel.app';

// 1. Extração compacta unificando ?query e #hash em 3 linhas
export function extrairParametrosDeUrl(url: string): Record<string, string> {
  const query = url.split('?')[1]?.split('#')[0] || '';
  const hash = url.split('#')[1] || '';
  return Object.fromEntries(new URLSearchParams(`${query}&${hash}`).entries());
}

// 2. Processa PKCE (code) ou Implicit Flow (tokens)
export async function processarRetornoOAuthUrl(url: string) {
  if (!url) return null;
  const { code, access_token, refresh_token } = extrairParametrosDeUrl(url);

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.user;
  }

  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.user;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// 3. Inicia OAuth com detecção dinâmica (Expo Go ou App Nativo)
export async function iniciarLoginGoogle() {
  const localAppUrl = Linking.createURL('/auth/callback');
  const redirectTo = `${AUTH_REDIRECT_URL}?app_url=${encodeURIComponent(localAppUrl)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Falha ao gerar URL de autenticação.');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.href = data.url;
    return null;
  }

  // O browser escuta a mesma URL gerada para o ambiente atual (exp:// ou dermys://)
  const result = await WebBrowser.openAuthSessionAsync(data.url, localAppUrl);

  if (result.type === 'success' && result.url) {
    return await processarRetornoOAuthUrl(result.url);
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}