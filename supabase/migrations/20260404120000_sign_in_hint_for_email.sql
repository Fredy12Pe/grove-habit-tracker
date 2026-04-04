-- Lets the app route "already registered" sign-ups to the correct sign-in method.
-- Returns the user's first-linked identity provider (email, apple, google, …) from auth.identities.
-- Callable with the anon key; reveals whether an email is registered (tradeoff for UX).

create or replace function public.sign_in_hint_for_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_first text;
  v_all text[];
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return jsonb_build_object('found', false);
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('found', false);
  end if;

  select i.provider into v_first
  from auth.identities i
  where i.user_id = v_user_id
  order by i.created_at asc nulls last
  limit 1;

  select coalesce(
    array_agg(i.provider order by i.created_at asc nulls last),
    array[]::text[]
  )
  into v_all
  from auth.identities i
  where i.user_id = v_user_id;

  return jsonb_build_object(
    'found', true,
    'first_provider', coalesce(v_first, 'email'),
    'providers', to_jsonb(coalesce(v_all, array[]::text[]))
  );
end;
$$;

revoke all on function public.sign_in_hint_for_email(text) from public;
grant execute on function public.sign_in_hint_for_email(text) to anon, authenticated;
