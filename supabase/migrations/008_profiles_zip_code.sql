-- ZIP from signup (user_metadata) — used with teams.zip_code for automatic crew matching in Hiring.
alter table public.profiles
  add column if not exists zip_code text;

comment on column public.profiles.zip_code is 'Optional ZIP from signup (raw_user_meta_data.zip_code); used to match crews by route.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, zip_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(trim(new.raw_user_meta_data->>'zip_code'), '')
  );

  -- Crew first (team assigned)
  if exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status in ('onboarded', 'hired')
      and a.crew_team_id is not null
  ) then
    update public.profiles
    set role = 'cleaner'
    where id = new.id;

    insert into public.cleaners (profile_id, team_id)
    select new.id, a.crew_team_id
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status in ('onboarded', 'hired')
      and a.crew_team_id is not null
    limit 1
    on conflict (profile_id) do update
    set team_id = excluded.team_id;

  -- Owner / admin (no crew row)
  elsif exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status in ('onboarded', 'hired')
      and a.app_access_role = 'admin'
  ) then
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;

  return new;
end;
$$;
