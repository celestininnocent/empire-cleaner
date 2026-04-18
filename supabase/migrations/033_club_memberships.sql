-- Empire Club memberships (subscription / loyalty layer).
-- Tracks Stripe subscription state separately from recurring_schedules.

create table if not exists public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('basic', 'preferred')),
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_club_memberships_status on public.club_memberships (status);

create or replace function public.set_updated_at_club_memberships()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_club_memberships on public.club_memberships;
create trigger trg_set_updated_at_club_memberships
before update on public.club_memberships
for each row execute function public.set_updated_at_club_memberships();

alter table public.club_memberships enable row level security;

create policy "club_memberships_select_own_or_admin" on public.club_memberships
for select using (
  profile_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "club_memberships_admin_all" on public.club_memberships
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

