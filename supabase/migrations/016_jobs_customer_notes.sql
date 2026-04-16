-- Free-form instructions from the customer at booking (gate codes, pets, focus areas, etc.)
alter table public.jobs
  add column if not exists customer_notes text;

comment on column public.jobs.customer_notes is 'Optional customer instructions from booking; max ~500 chars in app to fit Stripe metadata.';
