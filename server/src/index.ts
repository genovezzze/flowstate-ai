import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { auth, type Session } from './auth.js';
import { pool } from './db.js';
import { askClaude } from './coach.js';

type Vars = { user: Session['user'] };
const app = new Hono<{ Variables: Vars }>();

app.use(
  '/api/*',
  cors({
    origin: (o) => (o && /^(http:\/\/localhost:\d+|https:\/\/.*\.vercel\.app)$/.test(o) ? o : null),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'expo-origin'],
    // set-auth-token: bearer plugin returns the session token here so the web
    // client can store it (JS cannot read Set-Cookie in a browser).
    exposeHeaders: ['set-auth-token'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.get('/', (c) => c.text('FlowState API'));
app.get('/api/health', (c) => c.json({ ok: true }));

// Better Auth: sign-up / sign-in / social / session / delete-user …
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// Everything below needs a signed-in user.
async function requireUser(c: Context<{ Variables: Vars }>, next: () => Promise<void>) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', session.user);
  await next();
}
app.use('/api/sync', requireUser);
app.use('/api/coach', requireUser);

// ---------- Sync ----------

app.get('/api/sync', async (c) => {
  const uid = c.get('user').id;
  const [settings, periods, sessions, coach] = await Promise.all([
    pool.query('select onboarded, profile, cycle, consents from user_settings where user_id = $1', [uid]),
    pool.query(
      "select to_char(start_date,'YYYY-MM-DD') as start, to_char(end_date,'YYYY-MM-DD') as \"end\" from period_logs where user_id = $1 order by start_date",
      [uid],
    ),
    pool.query('select data from sessions where user_id = $1 order by date', [uid]),
    pool.query(
      'select id, role, content, created_at as at from coach_messages where user_id = $1 order by created_at desc limit 200',
      [uid],
    ),
  ]);
  return c.json({
    settings: settings.rows[0] ?? null,
    periods: periods.rows.map((p) => (p.end ? p : { start: p.start })),
    sessions: sessions.rows.map((r) => r.data),
    coach: coach.rows.reverse(),
  });
});

type SyncBody = {
  settings?: { onboarded: boolean; profile: unknown; cycle: unknown; consents: unknown };
  periods?: { start: string; end?: string }[];
  sessions?: { id: string; date: string; status: string }[];
  coach?: { id: string; role: 'user' | 'assistant'; content: string; at: string }[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

app.put('/api/sync', async (c) => {
  const uid = c.get('user').id;
  const body = (await c.req.json().catch(() => null)) as SyncBody | null;
  if (!body) return c.json({ error: 'bad json' }, 400);

  const client = await pool.connect();
  try {
    await client.query('begin');

    if (body.settings) {
      const s = body.settings;
      await client.query(
        `insert into user_settings (user_id, onboarded, profile, cycle, consents, updated_at)
         values ($1,$2,$3,$4,$5,now())
         on conflict (user_id) do update set onboarded=$2, profile=$3, cycle=$4, consents=$5, updated_at=now()`,
        [uid, !!s.onboarded, JSON.stringify(s.profile ?? null), JSON.stringify(s.cycle ?? null), JSON.stringify(s.consents ?? null)],
      );
    }

    if (body.periods) {
      const periods = body.periods.filter((p) => ISO.test(p.start) && (!p.end || ISO.test(p.end))).slice(0, 500);
      await client.query('delete from period_logs where user_id = $1', [uid]);
      for (const p of periods)
        await client.query('insert into period_logs (user_id, start_date, end_date) values ($1,$2,$3) on conflict do nothing', [
          uid,
          p.start,
          p.end ?? null,
        ]);
    }

    if (body.sessions) {
      for (const s of body.sessions.slice(0, 200)) {
        if (!s?.id || !ISO.test(s.date)) continue;
        await client.query(
          `insert into sessions (id, user_id, date, status, data, updated_at) values ($1,$2,$3,$4,$5,now())
           on conflict (user_id, id) do update set date=$3, status=$4, data=$5, updated_at=now()`,
          [String(s.id).slice(0, 64), uid, s.date, s.status, JSON.stringify(s)],
        );
      }
    }

    if (body.coach) {
      for (const m of body.coach.slice(-200)) {
        if (!m?.id || (m.role !== 'user' && m.role !== 'assistant')) continue;
        await client.query(
          'insert into coach_messages (id, user_id, role, content, created_at) values ($1,$2,$3,$4,$5) on conflict do nothing',
          [String(m.id).slice(0, 64), uid, m.role, String(m.content).slice(0, 4000), m.at ?? new Date().toISOString()],
        );
      }
    }

    await client.query('commit');
    return c.json({ ok: true });
  } catch (e) {
    await client.query('rollback');
    console.error(e);
    return c.json({ error: 'sync failed' }, 500);
  } finally {
    client.release();
  }
});

// Clear chat history (the app's trash button)
app.delete('/api/sync/coach', requireUser, async (c) => {
  await pool.query('delete from coach_messages where user_id = $1', [c.get('user').id]);
  return c.json({ ok: true });
});

// ---------- Coach (Claude) ----------

const DAILY_LIMIT = Number(process.env.COACH_DAILY_LIMIT ?? 30);

app.post('/api/coach', async (c) => {
  const uid = c.get('user').id;
  const body = (await c.req.json().catch(() => null)) as { messages?: { role: string; content: string }[]; context?: string } | null;
  if (!body?.messages?.length) return c.json({ error: 'no messages' }, 400);

  const usage = await pool.query(
    `insert into coach_usage (user_id, day, count) values ($1, current_date, 1)
     on conflict (user_id, day) do update set count = coach_usage.count + 1 returning count`,
    [uid],
  );
  if (usage.rows[0].count > DAILY_LIMIT) return c.json({ error: 'daily limit reached' }, 429);

  if (!process.env.ANTHROPIC_API_KEY) return c.json({ error: 'AI not configured' }, 503);
  try {
    const reply = await askClaude(body.messages, body.context ?? '');
    return c.json({ reply });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'upstream error' }, 502);
  }
});

export default app;
