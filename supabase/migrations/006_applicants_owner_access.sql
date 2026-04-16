-- cleaner = crew app; admin = owner tools (after you approve in Hiring).
alter table public.applicants
  add column if not exists app_access_role text
  constraint applicants_app_access_role_check
  check (app_access_role is null or app_access_role in ('cleaner', 'admin'));

comment on column public.applicants.app_access_role is 'Set on approve: cleaner (crew) or admin (owner).';

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

  -- Crew first (team assigned)
  if exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status = 'onboarded'
      and a.crew_team_id is not null
  ) then
    update public.profiles
    set role = 'cleaner'
    where id = new.id;

    insert into public.cleaners (profile_id, team_id)
    select new.id, a.crew_team_id
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status = 'onboarded'
      and a.crew_team_id is not null
    limit 1
    on conflict (profile_id) do update
    set team_id = excluded.team_id;

  -- Owner / admin (no crew row)
  elsif exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status = 'onboarded'
      and a.app_access_role = 'admin'
  ) then
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;

  return new;
end;
$$;
