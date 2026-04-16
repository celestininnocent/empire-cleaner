-- Contractor payouts (Stripe Connect-ready) generated automatically from crew clock-outs.

alter table public.profiles
  add column if not exists stripe_connect_account_id text;

comment on column public.profiles.stripe_connect_account_id is
  'Stripe Connect destination account id (acct_...) for contractor payouts.';

create table if not exists public.crew_payouts (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null unique references public.time_entries (id) on delete cascade,
  cleaner_id uuid not null references public.cleaners (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'paid', 'failed', 'awaiting_destination')),
  stripe_transfer_id text unique,
  failure_reason text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crew_payouts_cleaner on public.crew_payouts (cleaner_id, created_at desc);
create index if not exists idx_crew_payouts_status on public.crew_payouts (status);

create or replace function public.set_updated_at_crew_payouts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_crew_payouts on public.crew_payouts;
create trigger trg_set_updated_at_crew_payouts
before update on public.crew_payouts
for each row execute function public.set_updated_at_crew_payouts();

create or replace function public.queue_crew_payout_from_time_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.clock_out is null or coalesce(new.commission_cents, 0) <= 0 then
    return new;
  end if;

  insert into public.crew_payouts (time_entry_id, cleaner_id, amount_cents, currency, status)
  values (new.id, new.cleaner_id, new.commission_cents, 'usd', 'pending')
  on conflict (time_entry_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_queue_crew_payout_on_clockout on public.time_entries;
create trigger trg_queue_crew_payout_on_clockout
after update on public.time_entries
for each row
when (new.clock_out is not null and old.clock_out is null)
execute function public.queue_crew_payout_from_time_entry();

alter table public.crew_payouts enable row level security;

create policy "crew_payouts_select_own_or_admin" on public.crew_payouts
for select using (
  exists (
    select 1
    from public.cleaners c
    where c.id = crew_payouts.cleaner_id and c.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "crew_payouts_admin_all" on public.crew_payouts
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

