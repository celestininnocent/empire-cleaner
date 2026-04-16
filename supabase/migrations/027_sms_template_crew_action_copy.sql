update public.sms_templates
set body = '{{brand}}: New {{service_tier}} {{property_type}} stop on {{when}} at {{address}}. {{notes_snippet}}Open Crew app now for checklist, photos, and navigation.'
where template_key = 'crew_job_assigned';

update public.sms_templates
set body = '{{brand}}: Claimable {{service_tier}} {{property_type}} stop on {{when}} at {{address}}. Open Crew app now to claim and start navigation.'
where template_key = 'crew_job_unclaimed';
