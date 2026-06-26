-- Lead vendor/type chip (Digital Lighthouse, Calling Bees, etc.)
alter table leads add column if not exists lead_type text;
