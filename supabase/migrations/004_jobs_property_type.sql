-- Property / site type for each job (home, office, retail, etc.)
alter table public.jobs
  add column if not exists property_type text not null default 'residential';

comment on column public.jobs.property_type is 'residential | office | retail | gym | medical | other_commercial';
