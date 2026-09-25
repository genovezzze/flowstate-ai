-- FlowState app tables (Better Auth creates "user", "session", "account", "verification").
-- Deleting a user cascades to all of her data (GDPR "delete account").

create table if not exists user_settings (
  user_id    text primary key references "user"(id) on delete cascade,
  onboarded  boolean not null default false,
  profile    jsonb,
  cycle      jsonb,
  consents   jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists period_logs (
  user_id    text not null references "user"(id) on delete cascade,
  start_date date not null,
  end_date   date,
  primary key (user_id, start_date)
);

create table if not exists sessions (
  id         text not null,
  user_id    text not null references "user"(id) on delete cascade,
  date       date not null,
  status     text not null check (status in ('planned','in_progress','done','skipped')),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists sessions_user_date on sessions (user_id, date desc);

create table if not exists coach_messages (
  id         text not null,
  user_id    text not null references "user"(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists coach_usage (
  user_id text not null references "user"(id) on delete cascade,
  day     date not null,
  count   int  not null default 0,
  primary key (user_id, day)
);
