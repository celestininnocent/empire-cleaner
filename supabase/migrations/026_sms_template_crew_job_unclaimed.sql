insert into public.sms_templates (template_key, title, body, is_active)
values (
  'crew_job_unclaimed',
  'Crew: claimable job available',
  '{{brand}}: Unclaimed stop available {{when}} at {{address}} ({{service_tier}} · {{property_type}}). Open Crew app to claim it.',
  true
)
on conflict (template_key) do update
set title = excluded.title,
    body = excluded.body,
    is_active = excluded.is_active;
