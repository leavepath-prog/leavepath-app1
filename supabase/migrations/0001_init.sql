-- LeavePath V1 schema
-- Run with `supabase db push` or paste into the SQL editor.

-- ───────────────────────── profiles ─────────────────────────
-- One row per auth user, created automatically on sign-up. Lets the
-- Stripe webhook find an existing user by email.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── pending_checkouts ─────────────────────────
-- Intake answers saved before payment. Service role only (no policies).
create table if not exists public.pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  intake jsonb not null,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

alter table public.pending_checkouts enable row level security;

-- ───────────────────────── plans ─────────────────────────
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  intake jsonb not null,
  -- Slider / sandbox overrides (leave length, savings pot, KIT days...)
  scenario jsonb not null default '{}'::jsonb,
  -- Timeline checkboxes: { "task-id": true }
  task_checks jsonb not null default '{}'::jsonb,
  paid boolean not null default false,
  stripe_session_id text unique,
  amount_paid integer,
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_user_id_idx on public.plans (user_id, created_at desc);

alter table public.plans enable row level security;

create policy "Users can read their own plans"
  on public.plans for select
  using (auth.uid() = user_id);

create policy "Users can update their own plans"
  on public.plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Signed-in users may only change these columns. `paid`, `user_id`,
-- `stripe_session_id` and amounts can only be written by the service role
-- (the Stripe webhook), so nobody can unlock a plan without paying.
revoke update on public.plans from authenticated, anon;
grant update (intake, scenario, task_checks, updated_at) on public.plans to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute function public.touch_updated_at();
