// Usage: npm run migrate   (reads DATABASE_URL etc. from .env)
import { readFileSync } from 'node:fs';
import { getMigrations } from 'better-auth/db/migration';
import { auth } from '../src/auth.js';
import { pool } from '../src/db.js';

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);
if (toBeCreated.length || toBeAdded.length) {
  console.log('Better Auth tables:', [...toBeCreated, ...toBeAdded].map((t) => t.table).join(', '));
  await runMigrations();
} else console.log('Better Auth tables up to date');

await pool.query(readFileSync(new URL('../sql/app.sql', import.meta.url), 'utf8'));
console.log('App tables up to date');
await pool.end();
