-- Customer ETA alerts: one-time "crew nearby" notification per job.

alter table public.jobs
  add column if not exists customer_eta_notified_at timestamptz;

alter table public.jobs
  add column if not exists customer_eta_notified_miles double precision;

comment on column public.jobs.customer_eta_notified_at is
  'When customer was notified that crew is nearby.';
comment on column public.jobs.customer_eta_notified_miles is
  'Approx straight-line distance in miles at notify time.';

insert into public.sms_templates (template_key, title, body, is_active)
values (
  'customer_crew_nearby',
  'Customer: crew nearby',
  '{{brand}} update: your cleaning crew is about {{distance_miles}} miles away and heading to {{address}}. Reply if access details changed.',
  true
)
on conflict (template_key) do update
set title = excluded.title,
    body = excluded.body,
    is_active = excluded.is_active;
