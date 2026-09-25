// Vercel serverless entry — routes every request into the Hono app.
// Node runtime (not Edge): the `pg` Pool needs Node's TCP sockets.
import { handle } from 'hono/vercel';
import app from '../src/index.js';

export const config = { runtime: 'nodejs' };

export default handle(app);
