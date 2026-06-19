-- Draft App — Supabase schema
-- Run this in your project's SQL editor (or via the MCP apply_migration tool).
--
-- v1 keeps the whole draft (teams + picks) in a single row as JSONB so the app
-- can stay simple. When you want realtime multiplayer, split teams/picks into
-- their own tables and subscribe to changes.

create table if not exists public.drafts (
  id          uuid primary key default gen_random_uuid(),
  code        text        not null unique,
  name        text        not null,
  category_id text        not null,
  mode        text        not null default 'snake',
  rounds      int         not null default 3,
  teams       jsonb       not null default '[]'::jsonb,
  picks       jsonb       not null default '[]'::jsonb,
  votes       jsonb       not null default '[]'::jsonb,
  status      text        not null default 'active',
  created_at  timestamptz not null default now()
);

-- Short join code (e.g. "K7QX") so friends can hop into the same draft.
create index if not exists drafts_code_idx on public.drafts (code);

-- Owner of the draft (the signed-in creator). Lets "Your drafts" follow your
-- account across devices. Null for guest-created drafts. Safe to re-run.
alter table public.drafts add column if not exists owner_id uuid default auth.uid();
create index if not exists drafts_owner_idx on public.drafts (owner_id);

-- "Best team" votes gathered after a draft completes. Safe to re-run.
alter table public.drafts add column if not exists votes jsonb not null default '[]'::jsonb;

-- Enable Row Level Security.
alter table public.drafts enable row level security;

-- This is a friends-with-the-link party app: anyone with a draft's code needs to
-- read AND write it (to make live picks), so read/write stay open. Accounts add
-- ownership (owner_id) so each person sees *their* drafts — they don't lock the
-- table down. Tighten later if you ever want private drafts.
drop policy if exists "public read"   on public.drafts;
drop policy if exists "public insert" on public.drafts;
drop policy if exists "public update" on public.drafts;
drop policy if exists "public delete" on public.drafts;

create policy "public read"   on public.drafts for select using (true);
create policy "public insert" on public.drafts for insert with check (true);
create policy "public update" on public.drafts for update using (true) with check (true);
create policy "public delete" on public.drafts for delete using (true);

-- Broadcast row changes so every phone in a draft updates live.
alter publication supabase_realtime add table public.drafts;
