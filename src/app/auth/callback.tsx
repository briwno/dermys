import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { extrairParametrosDeUrl, processarRetornoOAuthUrl } from '@/services/auth-oauth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        if (typeof window !== 'undefined' && window.location?.href) {
          const currentHref = window.location.href;
          const params = extrairParametrosDeUrl(currentHref);

          // Se a autenticação foi iniciada por um app mobile e contém o parâmetro `app_url`
          if (params.app_url) {
            try {
              const targetUrl = new URL(params.app_url);
              const currentSearch = new URLSearchParams(window.location.search);
              currentSearch.delete('app_url');

              // Repassa todos os parâmetros de busca para o deep link do app
              currentSearch.forEach((value, key) => {
                targetUrl.searchParams.set(key, value);
              });

              // Repassa o hash com tokens se existir
              if (window.location.hash) {
                targetUrl.hash = window.location.hash;
              }

              window.location.href = targetUrl.toString();
              return;
            } catch (err) {
              console.warn('Erro ao redirecionar para app_url:', err);
            }
          }

          // Fluxo web padrão (localhost ou dermys.vercel.app)
          await processarRetornoOAuthUrl(currentHref);
        } else {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            await processarRetornoOAuthUrl(initialUrl);
          }
        }
      } catch (err) {
        console.error('Erro ao processar callback de autenticação:', err);
      } finally {
        router.replace('/');
      }
    }

    handleCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#f3c21a" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070707',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

