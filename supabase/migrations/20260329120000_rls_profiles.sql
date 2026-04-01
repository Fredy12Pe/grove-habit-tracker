-- Run this in the Supabase SQL editor (or via `supabase db push`) after enabling the CLI project.
-- Creates a minimal `profiles` table and RLS policies so user-scoped data is protected by `auth.uid()`.
-- App onboarding state is stored in `auth.users.user_metadata` (see app code); this table is for future rows keyed by user id.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using ((select auth.uid()) = id);

-- Optional: create a profile row when a new auth user is created (uncomment if you use profiles from the client).
-- create or replace function public.handle_new_user()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- begin
--   insert into public.profiles (id) values (new.id);
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
