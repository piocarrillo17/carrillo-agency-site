-- Lead ROI tracking: enrich the existing expenses table so a "Lead Cost" entry
-- can record how many leads the spend bought (weekly standing order) and the vendor.
-- A weekly lead order = one Lead Cost expense with a lead_count.

alter table expenses add column if not exists lead_count integer;
alter table expenses add column if not exists vendor text;
