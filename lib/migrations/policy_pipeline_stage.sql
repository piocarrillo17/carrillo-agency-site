-- Manual pipeline stage for policy clients (drag between post-sale columns)
alter table policy_log add column if not exists pipeline_stage text;
