-- Phase 2 SMS: templates, outbound queue/retries, inbound + delivery tracking.

create table if not exists public.sms_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  title text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('outbound', 'inbound')),
  routing_kind text not null default 'system'
    check (routing_kind in ('system', 'crew', 'customer')),
  template_key text,
  body text not null,
  to_phone text,
  from_phone text,
  profile_id uuid references public.profiles (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  status text not null
    check (status in ('queued', 'processing', 'sent', 'delivered', 'failed', 'received')),
  twilio_message_sid text unique,
  retry_count integer not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sms_messages_status_retry
  on public.sms_messages (status, next_attempt_at, retry_count);
create index if not exists idx_sms_messages_profile_created
  on public.sms_messages (profile_id, created_at desc);
create index if not exists idx_sms_messages_twilio_sid
  on public.sms_messages (twilio_message_sid);

create or replace function public.sms_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sms_templates_updated_at on public.sms_templates;
create trigger trg_sms_templates_updated_at
before update on public.sms_templates
for each row execute function public.sms_set_updated_at();

drop trigger if exists trg_sms_messages_updated_at on public.sms_messages;
create trigger trg_sms_messages_updated_at
before update on public.sms_messages
for each row execute function public.sms_set_updated_at();

alter table public.sms_templates enable row level security;
alter table public.sms_messages enable row level security;

create policy "sms_templates_admin_all" on public.sms_templates
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "sms_messages_select_own_or_admin" on public.sms_messages
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or profile_id = auth.uid()
);

create policy "sms_messages_admin_all" on public.sms_messages
for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

insert into public.sms_templates (template_key, title, body, is_active)
values
  ('crew_job_assigned', 'Crew: new job assigned', '{{brand}}: New stop assigned for {{when}} at {{address}}. Open Crew app for checklist + notes.', true),
  ('inbound_crew_ack', 'Auto-reply to crew inbound text', '{{brand}}: Got your message and posted it to your crew thread.', true),
  ('inbound_customer_ack', 'Auto-reply to customer inbound text', '{{brand}}: Thanks for texting us. Dispatch received your note and will follow up if needed.', true)
on conflict (template_key) do update
set title = excluded.title,
    body = excluded.body,
    is_active = excluded.is_active;
