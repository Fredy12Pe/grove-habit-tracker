-- Fixes `delete_own_account` (see 20260807190000_delete_own_account.sql), which failed with:
-- "Direct deletion from storage tables is not allowed. Use the Storage API instead."
--
-- Supabase's storage engine added a statement-level trigger on `storage.objects` that
-- rejects plain `DELETE` statements to prevent orphaned files in the storage backend
-- (https://github.com/supabase/storage/pull/817). Since this function only removes the
-- *database row* for avatar objects the user already owns (RLS-scoped to their own
-- folder), not the backing file directly, it's safe to opt back into direct deletes for
-- this transaction via `storage.allow_delete_query`.

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

  -- Local to this transaction only; required for direct SQL deletes on storage.objects.
  perform set_config('storage.allow_delete_query', 'true', true);

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
