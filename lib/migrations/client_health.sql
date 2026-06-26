-- Client health tracking on each policy: status, flag reason, start date, remaining chargeback.
alter table public.policy_log
  add column if not exists client_status text not null default 'Active',
  add column if not exists flag_reason text,
  add column if not exists policy_start_date date,
  add column if not exists chargeback_remaining numeric not null default 0;
