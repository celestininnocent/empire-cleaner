-- Hardening for projects where `handle_new_user` was updated before all profile/applicant columns existed.
-- Prevents "Database error saving new user" on auth signup.

alter table public.profiles
  add column if not exists zip_code text;

alter table public.profiles
  add column if not exists phone text;

alter table public.applicants
  add column if not exists crew_team_id uuid references public.teams (id) on delete set null;

alter table public.applicants
  add column if not exists app_access_role text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, zip_code, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(trim(new.raw_user_meta_data->>'zip_code'), ''),
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  );

  if exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status::text in ('onboarded', 'hired')
      and a.crew_team_id is not null
  ) then
    update public.profiles
    set role = 'cleaner'
    where id = new.id;

    insert into public.cleaners (profile_id, team_id)
    select new.id, a.crew_team_id
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status::text in ('onboarded', 'hired')
      and a.crew_team_id is not null
    limit 1
    on conflict (profile_id) do update
    set team_id = excluded.team_id;

  elsif exists (
    select 1
    from public.applicants a
    where lower(trim(a.email)) = lower(trim(new.email))
      and a.status::text in ('onboarded', 'hired')
      and a.app_access_role = 'admin'
  ) then
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates profile from auth user metadata (name/zip/phone) and links approved hires to cleaner/admin roles.';
