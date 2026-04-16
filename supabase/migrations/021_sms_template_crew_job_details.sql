-- Include service type and customer notes snippet in crew assignment SMS template.

update public.sms_templates
set body = '{{brand}}: New {{service_tier}} {{property_type}} stop on {{when}} at {{address}}. {{notes_snippet}}Open Crew app for checklist + photos.'
where template_key = 'crew_job_assigned';
