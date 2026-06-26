-- Achievements / badges earned by agents.
-- Each badge is earned once per agent (unique constraint).
-- Readable by the whole agency so teammates can view each other's badges (agent profiles).

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  agent_name text,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique (agent_id, badge_key)
);

alter table public.achievements enable row level security;

-- Everyone in the agency can see all earned badges (for profiles / leaderboard flair)
drop policy if exists achievements_read_all on public.achievements;
create policy achievements_read_all on public.achievements for select using (true);

-- An agent can only insert their own badges
drop policy if exists achievements_insert_own on public.achievements;
create policy achievements_insert_own on public.achievements for insert with check (auth.uid() = agent_id);

create index if not exists achievements_agent_idx on public.achievements(agent_id);
