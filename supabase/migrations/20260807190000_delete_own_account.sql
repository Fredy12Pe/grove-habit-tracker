-- Lets an authenticated user permanently delete their own account and data
-- (required for App Store review guideline 5.1.1(v): apps that support account
-- creation must also offer in-app account deletion).
--
-- `security definer` lets this run with the function owner's (postgres) privileges,
-- which can delete from `auth.users`; callers only ever affect their own row via auth.uid().
-- `public.profiles` and `public.habit_snapshots` cascade automatically
-- (both reference auth.users(id) on delete cascade).
--
-- Note: mobile clients may see a transport error ("network connection was lost")
-- after a successful delete because invalidating the JWT aborts the HTTP response.
-- The app treats that as success when the user no longer exists.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Avatar objects live under a folder named with the user's UUID (see avatars_storage.sql).
  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = v_uid::text;

  -- Removing the auth user cascades profile + habit_snapshots and invalidates sessions.
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
