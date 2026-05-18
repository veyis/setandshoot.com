-- Foundation schema for setandshoot.com (Hetzner self-hosted Supabase)
-- Apply: pnpm supabase:db-push (requires DATABASE_URL + SSH tunnel or server access)

create table if not exists public.site_meta (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_meta is 'Key/value site configuration readable by the public app';

insert into public.site_meta (key, value)
values ('foundation', '{"version": 1, "project": "setandshoot"}'::jsonb)
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) >= 2),
  email text not null check (position('@' in email) > 1),
  organization text,
  message text not null check (char_length(message) >= 10),
  locale text not null default 'de' check (locale in ('de', 'en'))
);

comment on table public.booking_inquiries is 'Services / booking form submissions (server writes via service role)';

alter table public.site_meta enable row level security;
alter table public.booking_inquiries enable row level security;

create policy "site_meta_public_read"
  on public.site_meta
  for select
  to anon, authenticated
  using (true);

create policy "booking_inquiries_no_public_access"
  on public.booking_inquiries
  for all
  to anon, authenticated
  using (false)
  with check (false);

grant select on public.site_meta to anon, authenticated;
grant all on public.booking_inquiries to service_role;
grant select on public.site_meta to service_role;
