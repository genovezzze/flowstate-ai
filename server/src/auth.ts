import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import { pool } from './db.js';

const env = process.env;

// Apple ID tokens from the native "Sign in with Apple" sheet.
// In Expo Go the token audience is Expo Go's bundle id, in our own build it's com.flowstate.app.
const APPLE_AUDIENCES = [env.APPLE_BUNDLE_ID ?? 'com.flowstate.app', 'host.exp.Exponent'];

export const auth = betterAuth({
  appName: 'FlowState',
  database: pool,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
    apple: {
      clientId: env.APPLE_SERVICE_ID ?? env.APPLE_BUNDLE_ID ?? 'com.flowstate.app',
      clientSecret: env.APPLE_CLIENT_SECRET ?? '',
      appBundleIdentifier: env.APPLE_BUNDLE_ID ?? 'com.flowstate.app',
      audience: APPLE_AUDIENCES,
    },
  },
  user: { deleteUser: { enabled: true } },
  // bearer: web clients can't read the Set-Cookie header, so they authenticate
  // with an Authorization: Bearer token instead (also avoids Safari's
  // third-party cookie blocking for the cross-domain web build).
  plugins: [expo(), bearer()],
  trustedOrigins: [
    'flowstate://',
    // Expo Go during development
    'exp://',
    'exp://**',
    'http://localhost:8081',
    'https://appleid.apple.com',
    // Web build (Expo web) deployed on Vercel — testers open it in the browser.
    'https://flowstate-web-five.vercel.app',
    ...(env.EXTRA_TRUSTED_ORIGINS ? env.EXTRA_TRUSTED_ORIGINS.split(',') : []),
  ],
});

export type Session = typeof auth.$Infer.Session;
