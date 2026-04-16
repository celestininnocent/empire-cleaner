-- Location history for mileage/audit (separate from cleaners.current_lat/current_lng snapshot).

create table if not exists public.cleaner_location_pings (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid not null references public.cleaners (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  source text not null default 'crew_app' check (source in ('crew_app', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists idx_cleaner_location_pings_cleaner_created
  on public.cleaner_location_pings (cleaner_id, created_at desc);

alter table public.cleaner_location_pings enable row level security;

create policy "cleaner_location_pings_select_own_or_admin" on public.cleaner_location_pings
for select using (
  exists (
    select 1 from public.cleaners c
    where c.id = cleaner_location_pings.cleaner_id
      and c.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "cleaner_location_pings_insert_own" on public.cleaner_location_pings
for insert with check (
  exists (
    select 1 from public.cleaners c
    where c.id = cleaner_location_pings.cleaner_id
      and c.profile_id = auth.uid()
  )
);

create policy "cleaner_location_pings_admin_all" on public.cleaner_location_pings
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

