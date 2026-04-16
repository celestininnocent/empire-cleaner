alter table public.time_entries
  add column if not exists base_commission_cents integer,
  add column if not exists quality_bonus_cents integer not null default 0,
  add column if not exists on_time_bonus_cents integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_entries_base_commission_nonnegative'
  ) then
    alter table public.time_entries
      add constraint time_entries_base_commission_nonnegative
      check (base_commission_cents is null or base_commission_cents >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_entries_quality_bonus_nonnegative'
  ) then
    alter table public.time_entries
      add constraint time_entries_quality_bonus_nonnegative
      check (quality_bonus_cents >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'time_entries_on_time_bonus_nonnegative'
  ) then
    alter table public.time_entries
      add constraint time_entries_on_time_bonus_nonnegative
      check (on_time_bonus_cents >= 0);
  end if;
end $$;

alter table public.crew_payouts
  add column if not exists base_cents integer,
  add column if not exists quality_bonus_cents integer not null default 0,
  add column if not exists on_time_bonus_cents integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crew_payouts_base_nonnegative'
  ) then
    alter table public.crew_payouts
      add constraint crew_payouts_base_nonnegative
      check (base_cents is null or base_cents >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crew_payouts_quality_bonus_nonnegative'
  ) then
    alter table public.crew_payouts
      add constraint crew_payouts_quality_bonus_nonnegative
      check (quality_bonus_cents >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crew_payouts_on_time_bonus_nonnegative'
  ) then
    alter table public.crew_payouts
      add constraint crew_payouts_on_time_bonus_nonnegative
      check (on_time_bonus_cents >= 0);
  end if;
end $$;

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

  insert into public.crew_payouts (
    time_entry_id,
    cleaner_id,
    amount_cents,
    base_cents,
    quality_bonus_cents,
    on_time_bonus_cents,
    currency,
    status
  )
  values (
    new.id,
    new.cleaner_id,
    new.commission_cents,
    coalesce(new.base_commission_cents, new.commission_cents),
    coalesce(new.quality_bonus_cents, 0),
    coalesce(new.on_time_bonus_cents, 0),
    'usd',
    'pending'
  )
  on conflict (time_entry_id) do update
  set amount_cents = excluded.amount_cents,
      base_cents = excluded.base_cents,
      quality_bonus_cents = excluded.quality_bonus_cents,
      on_time_bonus_cents = excluded.on_time_bonus_cents;

  return new;
end;
$$;
