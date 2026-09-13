-- Run once in the Supabase SQL Editor before enabling password changes on Vercel.
-- Dedicated single-owner credential table. Never put credentials in public.prompts.
begin;
create table if not exists public.workspace_credentials (
  id text primary key check (id = 'owner'),
  password_hash text not null,
  version uuid not null,
  updated_at timestamptz not null default now()
);
alter table public.workspace_credentials enable row level security;
revoke all on table public.workspace_credentials from public, anon, authenticated;
grant select, insert, update on table public.workspace_credentials to service_role;
commit;
-- The server initializes the singleton from APP_PASSWORD as a salted scrypt hash.
-- Subsequent changes use a version check, preventing concurrent lost updates.
