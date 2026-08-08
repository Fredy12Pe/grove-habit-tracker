-- Cloud backup / multi-device sync for habit data (signed-in users only).
-- Guests stay local-only; the app upserts one JSON snapshot per auth user.
--
-- Run via Supabase SQL editor or `supabase db push`.
-- Rows cascade when `auth.users` is deleted (see `delete_own_account`).

create table if not exists public.habit_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  habits jsonb not null default '[]'::jsonb,
  completion_dates jsonb not null default '{}'::jsonb,
  habit_entries jsonb not null default '{}'::jsonb,
  last_reset_date text,
  updated_at timestamptz not null default now()
);

create index if not exists habit_snapshots_updated_at_idx
  on public.habit_snapshots (updated_at desc);

alter table public.habit_snapshots enable row level security;

create policy "habit_snapshots_select_own"
  on public.habit_snapshots
  for select
  using ((select auth.uid()) = user_id);

create policy "habit_snapshots_insert_own"
  on public.habit_snapshots
  for insert
  with check ((select auth.uid()) = user_id);

create policy "habit_snapshots_update_own"
  on public.habit_snapshots
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "habit_snapshots_delete_own"
  on public.habit_snapshots
  for delete
  using ((select auth.uid()) = user_id);

comment on table public.habit_snapshots is
  'Per-user Grove habit store snapshot (habits, completion dates, entries). Local-first client merges then upserts.';
