import { Pool } from 'pg';

// Neon: use the *pooled* connection string (host contains "-pooler"), region eu-central-1 (Frankfurt).
// Small pool — each Vercel function instance keeps its own.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 10_000,
});
