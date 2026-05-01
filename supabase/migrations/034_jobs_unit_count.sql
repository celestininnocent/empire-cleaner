-- How many identical units this checkout covers (property managers / multi-unit homes).
alter table public.jobs
  add column if not exists unit_count integer not null default 1
    check (unit_count >= 1 and unit_count <= 100);

comment on column public.jobs.unit_count is
  'Number of same-layout units included in price_cents for this booking (1–100).';
