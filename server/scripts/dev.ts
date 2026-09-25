// Local dev server: npm run dev  → http://localhost:3000
import { serve } from '@hono/node-server';
import app from '../src/index.js';

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' });
console.log(`FlowState API on http://localhost:${port}`);
