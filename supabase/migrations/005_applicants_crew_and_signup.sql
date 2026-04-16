-- Track which team an approved hire should join; used by owner "Approve for crew" + signup hook.
alter table public.applicants
  add column if not exists crew_team_id uuid references public.teams (id) on delete set null;

comment on column public.applicants.crew_team_id is 'When set with status onboarded, new signups with this email become cleaners on this team.';

-- After profile insert, if this email was approved for a crew, attach cleaner row + role.
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
  end if;

  return new;
end;
$$;
