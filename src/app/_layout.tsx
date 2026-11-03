import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';

import { ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Silencia erros caso já tenha sido ocultada
    });
    if (Platform.OS === 'web') return;
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => { sub.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);

  return (
    <SafeAreaProvider><ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider></SafeAreaProvider>
  );
}
