-- Date-range leaderboard stats (Today/Week/Month/YTD) with richer metrics.
create or replace function leaderboard_stats(p_start date, p_end date)
returns table (
  agent_id uuid, agent_name text,
  apps bigint, submitted_ap numeric, issued_ap numeric, policies bigint,
  dials bigint, contacts bigint, appts bigint, sales bigint
)
language sql security definer set search_path = public as $$
  with pol as (
    select agent_id,
      count(*) filter (where status in ('Submitted','Approved','Issued')) as apps,
      coalesce(sum(apv) filter (where status in ('Submitted','Approved','Issued')),0) as submitted_ap,
      coalesce(sum(apv) filter (where status in ('Approved','Issued')),0) as issued_ap,
      count(*) filter (where status in ('Approved','Issued')) as policies
    from policy_log where date_written between p_start and p_end group by agent_id
  ),
  act as (
    select agent_id,
      coalesce(sum(dials),0) as dials, coalesce(sum(contacts),0) as contacts,
      coalesce(sum(appts),0) as appts, coalesce(sum(sales),0) as sales
    from daily_activity where date between p_start and p_end group by agent_id
  )
  select pr.id, pr.name,
    coalesce(pol.apps,0)::bigint, coalesce(pol.submitted_ap,0)::numeric, coalesce(pol.issued_ap,0)::numeric, coalesce(pol.policies,0)::bigint,
    coalesce(act.dials,0)::bigint, coalesce(act.contacts,0)::bigint, coalesce(act.appts,0)::bigint, coalesce(act.sales,0)::bigint
  from profiles pr
  left join pol on pol.agent_id = pr.id
  left join act on act.agent_id = pr.id
  where coalesce(pol.apps,0) > 0 or coalesce(act.dials,0) > 0;
$$;
grant execute on function leaderboard_stats(date, date) to authenticated, anon;
