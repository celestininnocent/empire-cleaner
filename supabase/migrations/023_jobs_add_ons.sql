-- Store selected booking add-ons for each job.

alter table public.jobs
  add column if not exists add_on_ids text[] not null default '{}';
