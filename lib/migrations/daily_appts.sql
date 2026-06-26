-- Daily appointment target for the Goals & Daily Plan checklist.
alter table public.goals
  add column if not exists daily_appts int not null default 0;
