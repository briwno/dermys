import { supabase } from '@/services/supabase';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export const AUTH_REDIRECT_URL =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'https://dermys.vercel.app';

export function extrairParametrosDeUrl(url: string): Record<string, string> {
  const query = url.split('?')[1]?.split('#')[0] || '';
  const hash = url.split('#')[1] || '';
  return Object.fromEntries(new URLSearchParams(`${query}&${hash}`).entries());
}

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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user || null;
}

export async function iniciarLoginGoogle() {
  let redirectTo: string;
  let localAppUrl: string | undefined;

  if (Platform.OS === 'web') {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : AUTH_REDIRECT_URL;
    redirectTo = `${origin.replace(/\/+$/, '')}/auth/callback`;
  } else {
    localAppUrl = Linking.createURL('/auth/callback');
    const baseUrl = (process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'https://dermys.vercel.app').replace(
      /\/+$/,
      '',
    );
    const baseRedirect = baseUrl.endsWith('/auth/callback') ? baseUrl : `${baseUrl}/auth/callback`;
    redirectTo = `${baseRedirect}?app_url=${encodeURIComponent(localAppUrl)}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('Não foi possível iniciar o login com Google.');

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.href = data.url;
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, localAppUrl);

  if (result.type === 'success' && result.url) {
    return await processarRetornoOAuthUrl(result.url);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user || null;
}