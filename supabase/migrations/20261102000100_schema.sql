-- WP01: all tables from docs/06. Access only via Edge Functions (service role).
-- RLS is enabled on every table and NO policies exist => anon/authenticated see nothing.

-- ---------- case content (imported by tools/load-case) ----------
-- Generic shape: one row per content item, validated by Zod before import.
create table case_meta (
  case_id text primary key,
  title text not null,
  start_date date not null,
  data jsonb not null -- windows, categories, night
);

create table case_solution ( -- SPOILER
  case_id text primary key references case_meta (case_id) on delete cascade,
  solution jsonb not null,
  world jsonb not null,
  proof_questions jsonb not null
);

do $$
declare t text;
begin
  foreach t in array array[
    'case_rooms','case_npcs','case_facts','case_statements','case_sources',
    'case_puzzles','case_items','case_events','case_questions','case_newspaper_templates','case_prolog'
  ] loop
    execute format(
      'create table %I (
         case_id text not null references case_meta (case_id) on delete cascade,
         id text not null,
         data jsonb not null,
         primary key (case_id, id)
       )', t);
  end loop;
end $$;

-- ---------- game state ----------
create table games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  profile text not null check (profile in ('family', 'friends')),
  start_date date not null,
  config jsonb not null default '{}',
  case_id text not null references case_meta (case_id)
);

create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games (id) on delete cascade,
  name text not null,
  avatar text,
  is_duo boolean not null default false,
  settings jsonb not null default '{}',
  next_day int not null default 1 check (next_day between 1 and 25)
);
create index on players (game_id);

create table player_days (
  player_id uuid not null references players (id) on delete cascade,
  day int not null check (day between 1 and 24),
  room_id text,
  actions_used int not null default 0 check (actions_used >= 0),
  finished_at timestamptz,
  next_room_id text,
  primary key (player_id, day)
);

create table discoveries (
  player_id uuid not null references players (id) on delete cascade,
  source_id text not null,
  item_id text not null, -- fact or statement id
  day int not null,
  ts timestamptz not null default now(),
  unique (player_id, item_id)
);

create table inventory (
  player_id uuid not null references players (id) on delete cascade,
  item_id text not null,
  from_day int not null,
  primary key (player_id, item_id)
);

create table puzzle_state (
  player_id uuid not null references players (id) on delete cascade,
  puzzle_id text not null,
  attempts int not null default 0,
  hints_used int not null default 0 check (hints_used between 0 and 2),
  solved_at timestamptz,
  primary key (player_id, puzzle_id)
);

create table daily_answers (
  player_id uuid not null references players (id) on delete cascade,
  day int not null,
  question_id text not null,
  correct boolean not null,
  hint_used boolean not null default false,
  primary key (player_id, day)
);

create table daily_puzzles (
  player_id uuid not null references players (id) on delete cascade,
  day int not null,
  type text not null,
  level text not null,
  solved boolean not null default false,
  hint_used boolean not null default false,
  primary key (player_id, day)
);

create table theory (
  player_id uuid not null references players (id) on delete cascade,
  category text not null check (category in ('who', 'accomplice', 'when', 'where')),
  value text,
  updated_at timestamptz not null default now(),
  history jsonb not null default '[]',
  primary key (player_id, category)
);

create table accusations (
  player_id uuid primary key references players (id) on delete cascade,
  answers jsonb not null,
  proof_answers jsonb not null,
  submitted_at timestamptz not null default now(),
  early boolean not null default false
);

-- Points are only a ledger; total = sum. Unique (kind, ref) prevents double awards.
create table score_ledger (
  id bigint generated always as identity primary key,
  player_id uuid not null references players (id) on delete cascade,
  kind text not null,
  ref text not null,
  points int not null check (points >= 0), -- invariant: no negative points
  day int,
  ts timestamptz not null default now(),
  unique (player_id, kind, ref)
);
create index on score_ledger (player_id);

create table plaques ( -- first discoverer: unique insert decides
  source_id text primary key,
  player_id uuid not null references players (id) on delete cascade,
  ts timestamptz not null default now(),
  title text not null
);

create table newspaper (
  game_id uuid not null references games (id) on delete cascade,
  day int not null check (day between 1 and 24),
  content jsonb not null,
  generated_at timestamptz not null default now(),
  primary key (game_id, day)
);

create table admin_log (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  action text not null,
  details jsonb not null default '{}'
);

-- ---------- lock everything ----------
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('revoke all on table public.%I from anon, authenticated', r.tablename);
  end loop;
end $$;
