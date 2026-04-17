-- Capture first/last touch acquisition data for neighborhood-level demand reporting.

alter table public.customers
  add column if not exists first_touch_utm_source text,
  add column if not exists first_touch_utm_medium text,
  add column if not exists first_touch_utm_campaign text,
  add column if not exists first_touch_utm_content text,
  add column if not exists first_touch_utm_term text,
  add column if not exists first_touch_referrer_url text,
  add column if not exists first_touch_referrer_host text,
  add column if not exists first_touch_landing_path text,
  add column if not exists last_touch_utm_source text,
  add column if not exists last_touch_utm_medium text,
  add column if not exists last_touch_utm_campaign text,
  add column if not exists last_touch_utm_content text,
  add column if not exists last_touch_utm_term text,
  add column if not exists last_touch_referrer_url text,
  add column if not exists last_touch_referrer_host text,
  add column if not exists last_touch_landing_path text,
  add column if not exists attribution_first_seen_at timestamptz,
  add column if not exists attribution_last_seen_at timestamptz;

alter table public.jobs
  add column if not exists checkout_started_at timestamptz,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists referrer_host text,
  add column if not exists landing_path text;

comment on column public.jobs.utm_source is
  'Campaign UTM source captured at checkout start.';
comment on column public.jobs.referrer_host is
  'Referrer domain captured at checkout start.';

create or replace view public.neighborhood_demand_weekly as
select
  date_trunc('week', j.created_at)::date as week_start,
  coalesce(nullif(trim(j.city), ''), 'Unknown') as city,
  coalesce(nullif(trim(j.state), ''), 'Unknown') as state,
  coalesce(nullif(trim(j.zip), ''), 'Unknown') as zip,
  coalesce(nullif(trim(j.utm_source), ''), '(direct)') as utm_source,
  coalesce(nullif(trim(j.utm_medium), ''), '(none)') as utm_medium,
  coalesce(nullif(trim(j.utm_campaign), ''), '(none)') as utm_campaign,
  count(*)::int as bookings_count,
  sum(j.price_cents)::bigint as booked_revenue_cents,
  avg(j.price_cents)::numeric(12, 2) as avg_ticket_cents,
  sum(case when j.status = 'completed' then 1 else 0 end)::int as completed_count,
  sum(case when j.status = 'cancelled' then 1 else 0 end)::int as cancelled_count
from public.jobs j
group by 1, 2, 3, 4, 5, 6, 7;
