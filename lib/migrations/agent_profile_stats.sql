-- Aggregate profile stats for any agent, safe to expose agency-wide.
-- SECURITY DEFINER: bypasses row-level security but returns ONLY aggregate
-- numbers (no client names, no policy details) — same pattern as leaderboard_stats.

create or replace function public.agent_profile_stats(p_agent_id uuid)
returns table (
  total_apps    bigint,
  total_issued  bigint,
  submitted_ap  numeric,
  issued_ap     numeric,
  best_week_ap  numeric,
  best_month_ap numeric,
  total_dials   bigint
)
language sql
security definer
stable
set search_path = public
as $$
  with pol as (
    select * from policy_log where agent_id = p_agent_id
  )
  select
    (select count(*) from pol)::bigint,
    (select count(*) from pol where status in ('Approved','Issued'))::bigint,
    (select coalesce(sum(apv),0) from pol where status in ('Submitted','Approved','Issued')),
    (select coalesce(sum(apv),0) from pol where status in ('Approved','Issued')),
    (select coalesce(max(wk),0) from (
        select sum(apv) wk from pol
        where status in ('Submitted','Approved','Issued') and date_written is not null
        group by date_trunc('week', date_written)
     ) w),
    (select coalesce(max(mo),0) from (
        select sum(apv) mo from pol
        where status in ('Submitted','Approved','Issued')
        group by year, month
     ) m),
    (select coalesce(sum(dials),0) from daily_activity where agent_id = p_agent_id)::bigint;
$$;

grant execute on function public.agent_profile_stats(uuid) to authenticated;
