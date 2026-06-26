-- Appointment type: Close vs Follow-Up vs Callback
alter table leads add column if not exists appt_type text;
