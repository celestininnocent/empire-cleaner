-- Post-checkout onboarding notes captured on customer profile.

alter table public.customers
  add column if not exists access_notes text,
  add column if not exists pets_notes text,
  add column if not exists parking_notes text,
  add column if not exists onboarding_completed_at timestamptz;
