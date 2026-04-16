-- Customers can read cleaner profiles assigned to their jobs
create policy "profiles_read_job_cleaners" on public.profiles for select using (
  exists (
    select 1
    from public.cleaners cl
    join public.jobs j on j.team_id = cl.team_id
    join public.customers cu on cu.id = j.customer_id
    where cl.profile_id = profiles.id
      and cu.profile_id = auth.uid()
  )
);
