import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { processarRetornoOAuthUrl } from '@/services/auth-oauth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        if (typeof window !== 'undefined' && window.location?.href) {
          await processarRetornoOAuthUrl(window.location.href);
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
