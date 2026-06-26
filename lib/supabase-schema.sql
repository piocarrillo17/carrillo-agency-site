-- Run this in Supabase → SQL Editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null default 'agent' check (role in ('agent', 'manager'))
);

create table entries (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references profiles(id) on delete cascade not null,
  agent_name text not null,
  year int not null,
  month int not null check (month between 1 and 12),
  apps_written int default 0,
  submitted_ap numeric(12,2) default 0,
  approved_ap numeric(12,2) default 0,
  issued_ap numeric(12,2) default 0,
  advance_pay numeric(12,2) default 0,
  mo_expenses numeric(12,2) default 0,
  mo_net numeric(12,2) default 0,
  deposits numeric(12,2) default 0,
  adv_owed numeric(12,2) default 0,
  dials int default 0,
  hours_talked numeric(6,2) default 0,
  created_at timestamptz default now(),
  unique(agent_id, year, month)
);

-- Row Level Security
alter table profiles enable row level security;
alter table entries enable row level security;

-- Profiles: users can read all, update only their own
create policy "profiles_read_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Entries: agents can read all (for leaderboard), insert/update only their own
create policy "entries_read_all" on entries for select using (true);
create policy "entries_insert_own" on entries for insert with check (auth.uid() = agent_id);
create policy "entries_update_own" on entries for update using (auth.uid() = agent_id);
