-- Allow customers to insert tips for their own jobs
create policy "tips_insert_customer" on public.tips for insert with check (
  exists (
    select 1 from public.jobs j
    join public.customers c on c.id = j.customer_id
    where j.id = job_id and c.profile_id = auth.uid()
  )
);
