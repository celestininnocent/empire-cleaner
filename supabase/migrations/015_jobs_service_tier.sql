-- Service intensity (standard vs deep clean, move-out, post-reno, etc.) — set at booking checkout.
alter table public.jobs
  add column if not exists service_tier text not null default 'standard';

comment on column public.jobs.service_tier is
  'standard | deep_clean | move_in_out | post_renovation — matches app service tier ids';
