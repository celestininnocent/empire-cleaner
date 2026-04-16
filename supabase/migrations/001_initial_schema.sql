-- Empire Cleaner — initial schema (run in Supabase SQL editor or CLI)
-- Requires: auth.users (Supabase Auth)

create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'cleaner', 'admin');
create type public.applicant_status as enum ('applied', 'interview', 'background_checked', 'onboarded', 'rejected');
create type public.billing_frequency as enum ('weekly', 'biweekly', 'monthly');
create type public.job_status as enum ('scheduled', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Profile per auth user
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Two-person teams; base location used for routing
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zip_code text not null,
  base_lat double precision not null,
  base_lng double precision not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  address_line text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table public.cleaners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  bio text,
  photo_url text,
  current_lat double precision,
  current_lng double precision,
  last_location_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  zip_code text,
  status public.applicant_status not null default 'applied',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  stripe_subscription_id text unique,
  frequency public.billing_frequency not null,
  day_of_week integer,
  is_active boolean not null default true,
  next_service_at timestamptz,
  created_at timestamptz not null default now(),
  constraint recurring_schedules_customer_stripe_unique unique (customer_id, stripe_subscription_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  recurring_schedule_id uuid references public.recurring_schedules (id) on delete set null,
  status public.job_status not null default 'scheduled',
  scheduled_start timestamptz not null,
  scheduled_end timestamptz,
  price_cents integer not null check (price_cents >= 0),
  bedrooms integer not null default 1 check (bedrooms >= 0),
  bathrooms integer not null default 1 check (bathrooms >= 0),
  square_footage integer not null default 1000 check (square_footage > 0),
  address_line text not null,
  city text,
  state text,
  zip text not null,
  lat double precision,
  lng double precision,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

create table public.job_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  room_key text not null,
  label text not null,
  requires_photo boolean not null default false,
  completed_at timestamptz,
  photo_url text,
  unique (job_id, room_key)
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  cleaner_id uuid not null references public.cleaners (id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  commission_cents integer,
  created_at timestamptz not null default now()
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index idx_jobs_customer on public.jobs (customer_id);
create index idx_jobs_team on public.jobs (team_id);
create index idx_jobs_scheduled on public.jobs (scheduled_start);
create index idx_jobs_zip on public.jobs (zip);
create index idx_teams_zip on public.teams (zip_code);
create index idx_cleaners_team on public.cleaners (team_id);
create index idx_recurring_customer on public.recurring_schedules (customer_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.cleaners enable row level security;
alter table public.teams enable row level security;
alter table public.jobs enable row level security;
alter table public.job_checklist_items enable row level security;
alter table public.recurring_schedules enable row level security;
alter table public.time_entries enable row level security;
alter table public.tips enable row level security;
alter table public.applicants enable row level security;

-- Profiles: users read/update own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Admin full access (service role bypasses RLS; app uses user JWT for admin check in app layer too)
create policy "profiles_admin_all" on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "customers_own" on public.customers for all using (
  profile_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "customers_insert_self" on public.customers for insert with check (profile_id = auth.uid());

create policy "cleaners_own" on public.cleaners for select using (
  profile_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'cleaner'))
);

create policy "cleaners_update_own" on public.cleaners for update using (profile_id = auth.uid());

create policy "teams_read" on public.teams for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'cleaner'))
  or exists (select 1 from public.cleaners c where c.profile_id = auth.uid() and c.team_id = teams.id)
);

create policy "teams_admin" on public.teams for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "jobs_select_customer" on public.jobs for select using (
  exists (
    select 1 from public.customers c
    where c.id = jobs.customer_id and c.profile_id = auth.uid()
  )
);

create policy "jobs_insert_customer" on public.jobs for insert with check (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.profile_id = auth.uid()
  )
);

create policy "jobs_update_customer" on public.jobs for update using (
  exists (
    select 1 from public.customers c
    where c.id = jobs.customer_id and c.profile_id = auth.uid()
  )
);

create policy "jobs_admin_cleaner" on public.jobs for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1 from public.cleaners c
    where c.team_id = jobs.team_id and c.profile_id = auth.uid()
  )
);

create policy "checklist_job_access" on public.job_checklist_items for all using (
  exists (
    select 1 from public.jobs j
    join public.customers cu on cu.id = j.customer_id
    where j.id = job_checklist_items.job_id
    and (cu.profile_id = auth.uid()
      or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin')
      or exists (select 1 from public.cleaners cl where cl.team_id = j.team_id and cl.profile_id = auth.uid()))
  )
);

create policy "recurring_customer" on public.recurring_schedules for all using (
  exists (
    select 1 from public.customers c
    where c.id = recurring_schedules.customer_id and c.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "time_entries_access" on public.time_entries for all using (
  exists (select 1 from public.cleaners c where c.id = time_entries.cleaner_id and c.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "tips_access" on public.tips for all using (
  exists (
    select 1 from public.jobs j
    join public.customers cu on cu.id = j.customer_id
    where j.id = tips.job_id and cu.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "applicants_admin" on public.applicants for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Storage bucket for checklist photos (create bucket in dashboard named checklist-photos)
-- Policies added separately if using Storage API

comment on table public.teams is '2-person cleaning teams; base_lat/lng for dispatch';
comment on table public.recurring_schedules is 'Stripe subscription id links recurring billing to schedule';
comment on table public.time_entries is 'Clock-in/out; commission_cents = share of 20% job pool per cleaner';
