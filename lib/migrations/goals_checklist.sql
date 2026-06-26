-- #10 Goals + daily recruiting checklist.
-- Adds daily target columns to `goals` and an opportunity-share tally to `daily_activity`.

alter table public.goals
  add column if not exists daily_dials    int not null default 0,
  add column if not exists daily_contacts int not null default 0,
  add column if not exists daily_shares   int not null default 0;

alter table public.daily_activity
  add column if not exists shares int not null default 0;
