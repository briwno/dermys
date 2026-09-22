import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isServer = typeof window === 'undefined';

// Storage em memória seguro para SSR / Prerendering no Node.js (Vercel Build)
const memoryStorage = new Map<string, string>();
const serverStorage = {
  getItem: async (key: string) => memoryStorage.get(key) || null,
  setItem: async (key: string, value: string) => {
    memoryStorage.set(key, value);
  },
  removeItem: async (key: string) => {
    memoryStorage.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isServer ? serverStorage : AsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: Platform.OS === 'web' && !isServer,
  },
});