-- App split: record when a policy is split between agents (take-home %), and a
-- mirror copy for an in-system partner. apv stores each agent's CREDITED share;
-- gross_ap keeps the full app premium for editing/display.
alter table policy_log add column if not exists is_split boolean default false;
alter table policy_log add column if not exists split_percent integer;
alter table policy_log add column if not exists split_with_name text;
alter table policy_log add column if not exists split_with_id uuid;
alter table policy_log add column if not exists gross_ap numeric;
alter table policy_log add column if not exists split_group uuid;
