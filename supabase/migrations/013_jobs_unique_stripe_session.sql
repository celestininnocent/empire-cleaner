-- Prevent duplicate jobs if Stripe retries `checkout.session.completed` (belt + suspenders with app check).
create unique index if not exists idx_jobs_stripe_checkout_session_id_unique
  on public.jobs (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
