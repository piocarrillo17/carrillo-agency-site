-- Public website visitors do not need access to agent records or reports.
revoke all on table public.profiles, public.achievements from anon;
revoke execute on function public.agent_profile_stats(uuid) from public, anon;
revoke execute on function public.leaderboard_stats(integer) from public, anon;
revoke execute on function public.leaderboard_stats(date,date) from public, anon;
revoke execute on function public.is_manager() from public, anon;
grant execute on function public.agent_profile_stats(uuid), public.leaderboard_stats(integer), public.leaderboard_stats(date,date), public.is_manager() to authenticated;
alter policy profiles_read_all on public.profiles to authenticated;
alter policy achievements_read_all on public.achievements to authenticated;
-- Provision new agents through the trusted administrator, rather than a browser invite code.
revoke insert on public.profiles from authenticated, anon;
create or replace function public.protect_profile_authority()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_manager()
    and (new.role is distinct from old.role or new.manager_id is distinct from old.manager_id) then
    raise exception 'Only a manager may change account authority';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_profile_authority() from public, anon, authenticated;
create trigger protect_profile_authority before update on public.profiles
for each row execute function public.protect_profile_authority();

do $migration$
declare f record;
begin
  for f in select p.oid, p.proname, p.prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('agent_profile_stats','leaderboard_stats')
  loop
    execute format(
      'create or replace function public.%I(%s) returns %s language plpgsql stable security definer set search_path=public as $guard$ #variable_conflict use_column
begin
if not exists (select 1 from public.profiles where id=auth.uid()) then
raise exception ''Agent access required'' using errcode=''42501'';
end if;
return query %s;
end;
$guard$',
      f.proname, pg_get_function_arguments(f.oid), pg_get_function_result(f.oid), regexp_replace(f.prosrc, '[;[:space:]]+$', '')
    );
  end loop;
end
$migration$;
create or replace function public.is_agent()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid()); $$;
revoke execute on function public.is_agent() from public, anon;
grant execute on function public.is_agent() to authenticated;
alter policy profiles_read_all on public.profiles using (public.is_agent());
alter policy achievements_read_all on public.achievements using (public.is_agent());