create table if not exists public.job_claim_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  cleaner_id uuid not null references public.cleaners (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_claim_events_created
  on public.job_claim_events (created_at desc);

create index if not exists idx_job_claim_events_job
  on public.job_claim_events (job_id);

alter table public.job_claim_events enable row level security;

drop policy if exists "job_claim_events_admin_select" on public.job_claim_events;
create policy "job_claim_events_admin_select" on public.job_claim_events
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

comment on table public.job_claim_events is
  'Audit trail when a crew claims an unassigned scheduled job from the field app.';
