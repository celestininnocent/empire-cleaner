-- Do not auto-create a hardcoded fallback team in claim_crew_access_for_me().
-- Owner must configure at least one team in their real service area first.

create or replace function public.claim_crew_access_for_me()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  em text;
  em_norm text;
  prof_role public.user_role;
  tid uuid;
  app_row public.applicants%rowtype;
  zip_src text;
  n_teams int;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select u.email into em from auth.users u where u.id = uid;
  if em is null or length(trim(em)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'no_email');
  end if;
  em_norm := lower(trim(em));

  if exists (
    select 1 from public.cleaners c
    where c.profile_id = uid and c.team_id is not null
  ) then
    return jsonb_build_object('ok', true, 'linked', true, 'reason', 'already_cleaner');
  end if;

  select p.role into prof_role from public.profiles p where p.id = uid;
  if prof_role = 'admin' then
    return jsonb_build_object('ok', false, 'reason', 'owner_admin');
  end if;

  select * into app_row
  from public.applicants a
  where lower(trim(a.email)) = em_norm
    and a.status in ('onboarded'::public.applicant_status, 'hired'::public.applicant_status)
  order by a.updated_at desc nulls last, a.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'error', 'no_eligible_applicant',
      'reason', 'not_onboarded_or_hired'
    );
  end if;

  tid := null;

  if app_row.app_access_role = 'admin' then
    return jsonb_build_object('ok', false, 'reason', 'applicant_owner');
  end if;

  tid := app_row.crew_team_id;

  if tid is null then
    select count(*)::int into n_teams from public.teams;
    if n_teams = 0 then
      return jsonb_build_object(
        'ok', false,
        'error', 'no_teams_configured',
        'reason', 'owner_setup_required'
      );
    end if;

    zip_src := nullif(trim(app_row.zip_code), '');
    if zip_src is null then
      select nullif(trim(p.zip_code), '') into zip_src from public.profiles p where p.id = uid;
    end if;

    if zip_src is not null then
      select t.id into tid
      from public.teams t
      where public._crew_zip_key(t.zip_code) = public._crew_zip_key(zip_src)
      order by t.id
      limit 1;
    end if;

    if tid is null then
      select t.id into tid from public.teams t order by t.id limit 1;
    end if;

    if tid is null then
      return jsonb_build_object('ok', false, 'error', 'no_team');
    end if;

    update public.applicants
    set crew_team_id = tid,
        app_access_role = 'cleaner'
    where id = app_row.id;
  end if;

  if tid is null then
    return jsonb_build_object('ok', false, 'error', 'no_team_resolved');
  end if;

  update public.profiles
  set role = 'cleaner'
  where id = uid;

  insert into public.cleaners (profile_id, team_id)
  values (uid, tid)
  on conflict (profile_id) do update
  set team_id = excluded.team_id;

  return jsonb_build_object('ok', true, 'linked', true, 'team_id', tid::text);
end;
$$;

comment on function public.claim_crew_access_for_me() is
  'Links auth.uid() to crew only when applicant is onboarded/hired and owner has configured teams. No hardcoded fallback team creation.';
