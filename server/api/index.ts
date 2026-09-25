// Vercel serverless entry (Node runtime — `pg` needs Node's TCP sockets).
// getRequestListener adapts Hono's fetch handler to Node's (req, res) that
// Vercel invokes; hono/vercel's `handle` is Edge-only and hangs here.
import { getRequestListener } from '@hono/node-server';
import app from '../src/index.js';

export const config = { runtime: 'nodejs' };

export default getRequestListener(app.fetch);
