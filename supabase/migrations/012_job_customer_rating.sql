-- Customer confirms visit complete + star rating (portal).
alter table public.jobs
  add column if not exists customer_approved_at timestamptz,
  add column if not exists customer_rating smallint,
  add column if not exists customer_review text;

alter table public.jobs
  drop constraint if exists jobs_customer_rating_check;

alter table public.jobs
  add constraint jobs_customer_rating_check
  check (customer_rating is null or (customer_rating >= 1 and customer_rating <= 5));

comment on column public.jobs.customer_approved_at is 'When the homeowner confirmed the visit complete in the portal.';
comment on column public.jobs.customer_rating is '1–5 stars from the customer after the visit.';
comment on column public.jobs.customer_review is 'Optional short feedback from the customer.';
