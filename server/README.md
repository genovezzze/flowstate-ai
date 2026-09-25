# FlowState API (Vercel + Neon + Better Auth)

Hono server: login (email, Apple, Google), sync of app data to Neon Postgres, and the AI coach (Claude).

## 1. Neon
1. neon.com → New project → region **AWS Europe Central 1 (Frankfurt)** (EU data, GDPR).
2. Connect → choose **Pooled connection** → copy the connection string.

## 2. Local setup
```bash
cd server
npm install
copy .env.example .env      # Windows (cp on Mac/Linux) → fill in DATABASE_URL, BETTER_AUTH_SECRET
npm run migrate             # creates all tables in Neon
npm run dev                 # http://localhost:3000/api/health → {"ok":true}
```

## 3. Deploy to Vercel
```bash
npm i -g vercel
vercel                      # first time: link project, root = server
```
In Vercel → Project → Settings → Environment Variables add everything from `.env`
(set `BETTER_AUTH_URL` to the Vercel URL, e.g. `https://flowstate-api.vercel.app`), then `vercel --prod`.

In the app folder create `.env` with `EXPO_PUBLIC_API_URL=https://flowstate-api.vercel.app` and restart Expo.

## 4. Google sign-in
Google Cloud Console → APIs & Services → Credentials → OAuth client ID → **Web application**.
Authorized redirect URI: `https://<your-vercel-url>/api/auth/callback/google`.
Put the client id/secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## 5. Sign in with Apple
Works on iPhone with the native Apple sheet — no secret needed for this flow.
`APPLE_BUNDLE_ID=com.flowstate.app`. For App Store builds enable "Sign in with Apple" for the bundle id in the Apple Developer account.

## Endpoints
| Method | Path | |
|---|---|---|
| GET/POST | `/api/auth/*` | Better Auth (sign-up, sign-in, social, session, delete-user) |
| GET / PUT | `/api/sync` | pull / push profile, cycle, periods, sessions, coach chat |
| DELETE | `/api/sync/coach` | clear chat |
| POST | `/api/coach` | AI coach (30 messages/day per user) |

Deleting an account removes all her rows (`on delete cascade`).
