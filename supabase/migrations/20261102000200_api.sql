-- WP05: columns and tables the edge functions need.

-- Engine state per player (source of truth for the engine); normalised tables are written alongside.
alter table players add column state jsonb;

alter table plaques add column day int;

-- Stored responses for idempotent requests.
create table request_log (
  player_id uuid not null references players (id) on delete cascade,
  request_id text not null,
  response jsonb not null,
  ts timestamptz not null default now(),
  primary key (player_id, request_id)
);

-- File order of case content (rooms[0] is the start room).
do $$
declare t text;
begin
  foreach t in array array[
    'case_rooms','case_npcs','case_facts','case_statements','case_sources',
    'case_puzzles','case_items','case_events','case_questions','case_newspaper_templates','case_prolog'
  ] loop
    execute format('alter table %I add column seq bigint generated always as identity', t);
  end loop;
end $$;

alter table request_log enable row level security;
revoke all on table request_log from anon, authenticated;
