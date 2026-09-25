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

const isWeb = Platform.OS === 'web';

// Web can't use the expo (Set-Cookie) session — browsers hide Set-Cookie from
// JS and Safari blocks cross-domain cookies — so on web we keep a Bearer token.
const BEARER_KEY = 'flowstate.bearer';
const getBearer = () => (isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem(BEARER_KEY) : null);
const setBearer = (t: string | null) => {
  if (!isWeb || typeof localStorage === 'undefined') return;
  if (t) localStorage.setItem(BEARER_KEY, t);
  else localStorage.removeItem(BEARER_KEY);
};

export const authClient = createAuthClient({
  baseURL: API_URL || 'http://localhost:3000',
  fetchOptions: isWeb
    ? {
        onRequest: (ctx) => {
          const t = getBearer();
          if (t) ctx.headers.set('Authorization', `Bearer ${t}`);
          return ctx;
        },
        // The bearer plugin returns the fresh token in this response header.
        onSuccess: (ctx) => {
          const t = ctx.response.headers.get('set-auth-token');
          if (t) setBearer(t);
        },
      }
    : undefined,
  plugins: isWeb
    ? []
    : [
        expoClient({
          scheme: 'flowstate',
          storagePrefix: 'flowstate',
          storage: SecureStore,
        }),
      ],
});

/** Clear the stored web session (call on sign-out). */
export function clearWebSession() {
  setBearer(null);
}

/** fetch() to our API with the Better Auth session attached (cookie on native, Bearer on web). */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const cookie = isWeb ? '' : await authClient.getCookie();
  const bearer = getBearer();
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: isWeb ? 'include' : 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}
