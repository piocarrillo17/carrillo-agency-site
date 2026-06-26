-- Agent contract level (comp %). Manager keeps the spread between their level and the agent's.
alter table public.profiles
  add column if not exists contract_level int not null default 80;
