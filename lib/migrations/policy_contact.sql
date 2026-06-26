-- Store the client's phone & email on the policy (prefilled from the application PDF).
alter table public.policy_log
  add column if not exists client_phone text,
  add column if not exists client_email text;
