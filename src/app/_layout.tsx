import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
