-- Per-agent dialing style: 1 = single, 2 = double, 3 = triple dial.
-- Controls how many dispositions advance a lead one pipeline bucket.
alter table public.profiles
  add column if not exists dial_mode int not null default 1;
