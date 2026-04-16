-- Crew ↔ dispatch notes: cleaners on a team can post; admins can read (owner dashboard).
create table public.crew_dispatch_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index idx_crew_dispatch_team_created on public.crew_dispatch_messages (team_id, created_at desc);

comment on table public.crew_dispatch_messages is 'Short messages from field crew to dispatch/owners, scoped by team.';

alter table public.crew_dispatch_messages enable row level security;

create policy "crew_dispatch_select_team_or_admin" on public.crew_dispatch_messages for select using (
  exists (
    select 1
    from public.cleaners c
    where c.profile_id = auth.uid()
      and c.team_id = crew_dispatch_messages.team_id
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "crew_dispatch_insert_own_team" on public.crew_dispatch_messages for insert with check (
  profile_id = auth.uid()
  and exists (
    select 1
    from public.cleaners c
    where c.profile_id = auth.uid()
      and c.team_id = crew_dispatch_messages.team_id
  )
);
