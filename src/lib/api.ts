/**
 * Backend client (Vercel API + Neon + Better Auth).
 * If EXPO_PUBLIC_API_URL is not set the app runs fully offline (no login, local data only).
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export const backendEnabled = API_URL.length > 0;

// expo-secure-store is native-only; on web fall back to localStorage.
const webStorage = {
  getItem: (k: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItem: (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
  getItemAsync: async (k: string) => (typeof localStorage === 'undefined' ? null : localStorage.getItem(k)),
  setItemAsync: async (k: string, v: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(k, v);
  },
};

export const authClient = createAuthClient({
  baseURL: API_URL || 'http://localhost:3000',
  plugins: [
    expoClient({
      scheme: 'flowstate',
      storagePrefix: 'flowstate',
      storage: (Platform.OS === 'web' ? webStorage : SecureStore) as typeof SecureStore,
    }),
  ],
});

/** fetch() to our API with the Better Auth session cookie attached. */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const cookie = Platform.OS === 'web' ? '' : await authClient.getCookie();
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers ?? {}),
    },
  });
}
