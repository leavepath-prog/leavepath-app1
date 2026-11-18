-- Free beta support. Safe to run on a database that already has 0001.
-- The plan is only created when the person who owns the email opens the
-- link (see app/dashboard/page.tsx), so typing someone else's email can't
-- put a plan into their account.

alter table public.pending_checkouts
  add column if not exists scenario jsonb not null default '{}'::jsonb,
  add column if not exists claimed_at timestamptz,
  add column if not exists send_welcome boolean not null default false;

-- 'checkout' rows come from Stripe Checkout and are unlocked only by the
-- webhook. 'beta' rows are unlocked by their owner opening the link.
alter table public.pending_checkouts
  add column if not exists source text not null default 'checkout'
  check (source in ('checkout', 'beta'));
