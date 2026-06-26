-- Lead freshness grade (A new, B-H bonus)
alter table leads add column if not exists lead_grade text;
