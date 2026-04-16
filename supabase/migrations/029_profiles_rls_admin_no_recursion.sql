-- profiles_admin_all queried public.profiles inside a policy ON public.profiles,
-- which re-entered RLS and triggered "infinite recursion detected in policy".
-- SECURITY DEFINER read bypasses RLS for the role check only.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

comment on function public.is_admin() is
  'True when the JWT subject has role admin; bypasses profiles RLS to avoid policy recursion.';

grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles_admin_all" on public.profiles;

create policy "profiles_admin_all" on public.profiles for all using (public.is_admin());
