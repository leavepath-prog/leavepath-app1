# LeavePath: interactive parental leave plan (V1)

This is the mobile-first, logged-in web app for **leavepath.co.uk**. It replaces the Google Sheet and PDF.

How it works for a customer:

1. They answer the intake wizard.
2. They see a free verdict, with the rest of their dashboard blurred.
3. They pay once with Stripe Checkout.
4. They get a magic link by email. It opens their personalised **LeavePath Plan Dashboard**, and they can use a new link to log back in from any device.

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Supabase (Postgres, Row Level Security, passwordless magic links) and Stripe Checkout with webhooks. There are no UI libraries: the styling is plain CSS design tokens in `app/globals.css`.

---

## What's where

```
lib/
  leaveCalculator.ts   Calculation engine (pure, no I/O): tax/NI, SMP/ShPP, policy bands,
                       month-by-month cashflow, Child Benefit + HICBC, funded hours, Tax-Free
                       Childcare, £100k cliff + pension fix, KIT/holiday boosts, the 4 working
                       patterns, phases and the verdict
  rates.ts             2026/27 HMRC & statutory rates (mirrors the HMRC_Rates_2026_28 tab)
  dates.ts             Whole-day UTC date maths (no time-zone drift)
  types.ts             Intake + Scenario types, labels, defaults
  letter.ts            Statutory flexible working request letter
  tasks.ts             Money / HR / childcare checklist per phase (stable ids)
  sanitizeIntake.ts    Server-side clamping/whitelisting of anything the browser sends
  supabase/            browser.ts, server.ts (RLS as user), admin.ts (service role), middleware.ts
  stripe.ts            Stripe client + SITE_URL
  __tests__/           Unit tests for the engine (node:test)

components/
  ui.tsx               Card, Pill, Slider, Toggle, Segmented, MoneyInput
  dashboard/           Dashboard shell + Overview, Timeline, Return, Flex Letter, PrintSnapshot
  intake/              8-step intake wizard (saves to localStorage as you go)

app/
  page.tsx                     Landing
  start/                       Intake wizard
  preview/                     Locked/blurred preview + email + "Unlock" → Stripe
  checkout/success/            "Check your inbox" + resend link
  login/                       Magic-link sign-in
  auth/confirm/route.ts        Verifies the magic-link token hash, sets the session
  auth/signout/route.ts
  dashboard/                   Paid dashboard (server loads plan; client autosaves)
  api/checkout/route.ts        Saves pending intake, creates the Stripe Checkout Session
  api/stripe/webhook/route.ts  checkout.session.completed → user + paid plan + magic link
  api/plan/route.ts            PATCH slider state + timeline checkboxes (RLS-protected)

supabase/
  migrations/0001_init.sql     profiles, pending_checkouts, plans + RLS + column grants
  templates/magic_link.html    Branded magic-link email (token-hash link, works cross-device)
middleware.ts                  Session refresh + /dashboard guard
```

---

## Setup (about 20 minutes)

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project, then fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
2. Run `supabase/migrations/0001_init.sql`, using the SQL editor or `supabase db push`.
3. Go to **Authentication → URL Configuration**:
   - Set the Site URL to `https://leavepath.co.uk` (`http://localhost:3000` locally).
   - Add `/auth/confirm` and `/dashboard` to the redirect allow list.
4. Go to **Authentication → Emails → Magic Link** and paste `supabase/templates/magic_link.html` in as the template body.
   - **This step is required.** The link must go to `/auth/confirm?token_hash=…`.
   - The webhook sends the link from the server, so there's no browser code verifier for the default PKCE link to use.
5. Go to **Authentication → Providers → Email** and keep Email enabled.
   - Leave "Allow new users to sign up" on: the webhook creates users with the admin API either way.
   - The login page uses `shouldCreateUser: false`, so only paying customers get accounts.
6. For production, add your own SMTP provider (Resend, Postmark, etc.). Supabase's built-in email is heavily rate-limited.

### 3. Stripe

1. Create a product, "LeavePath Plan", with a **one-off price**. Put its ID in `STRIPE_PRICE_ID`.
2. Put your secret key in `STRIPE_SECRET_KEY`.
3. To test the webhook locally:

   ```bash
   npm run stripe:listen   # prints whsec_… → STRIPE_WEBHOOK_SECRET
   npm run dev
   ```

4. In production, add a webhook endpoint at `https://leavepath.co.uk/api/stripe/webhook`. Subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`.

### 4. Run and test

```bash
npm run dev          # http://localhost:3000
npm test             # engine unit tests (16)
npm run typecheck
```

To test a purchase, use the test card `4242 4242 4242 4242` with any future date and any CVC.

### 5. Deploy

On Vercel:

1. Import the repo.
2. Add the same environment variables, with `NEXT_PUBLIC_SITE_URL=https://leavepath.co.uk`.
3. Point the domain at the project.

---

## Payment and access flow

```
/start (wizard, localStorage)
   → /preview  verdict visible, rest blurred
   → POST /api/checkout {email, intake}
        sanitise → insert pending_checkouts → Stripe Checkout Session (metadata: pending id)
   → Stripe Checkout
   → /checkout/success  "check your inbox" (+ resend)

Stripe ──webhook──▶ /api/stripe/webhook
        verify signature (raw body)
        → load pending intake
        → find or create auth user (email confirmed)
        → upsert plans {paid: true}  (idempotent on stripe_session_id)
        → signInWithOtp → magic-link email

Email link → /auth/confirm?token_hash… → session cookie → /dashboard
/dashboard  loads latest paid plan (RLS) → sliders/checkboxes autosave via PATCH /api/plan
```

**Security:**

- Signed-in users can only update `intake`, `scenario`, `task_checks` and `updated_at`, enforced by column-level grants.
- `paid` can only be set by the service-role webhook, so a plan can't be unlocked from the browser.
- Every write is sanitised on the server.

---

## How the dashboard maps to the brief

| Brief | Where |
|---|---|
| Name masthead + verdict banner | `Dashboard.tsx` |
| Dedicated parental leave savings pot hero, two-tone meter, status pill | `OverviewView.tsx → SavingsPotCard` |
| Pot meter hidden when stage is "Returning to work" (monthly cashflow hero instead) | `OverviewView.tsx → BackAtWorkHero` |
| Live sliders: leave length 6–12 months, savings pot, KIT/SPLIT 0–10, holiday 0–25 | `OverviewView.tsx` (Sandbox + Cashflow Boost cards) |
| £100k cliff check per parent + one-tap pension fix | `OverviewView.tsx → CliffCard`, engine `cliff` + `applyPensionFix` |
| Timeline starts on the leave month + Current Pre-Leave Baseline badge | `TimelineView.tsx`, engine `months` / `baseline` |
| Stage-aware baby date label | `babyDateLabel()` |
| 5 phases with net monthly cashflow + saved checkboxes | `TimelineView.tsx`, `lib/tasks.ts` |
| Childcare days selector 1–5, 4 pattern cards, neutral wording, ± per-day impact, Best Net Cashflow badge, no altered-hours row | `ReturnView.tsx` |
| Live-synced letter, Copy Text, Print / Save PDF (`@media print`) | `FlexLetterView.tsx`, `globals.css` print block |

---

## Calculation notes (where it differs from the sheet)

- **Peak drawdown** is the total of every month on leave that dips below zero. Spare cash in full-pay months isn't assumed to be saved. **Remaining buffer** = fund + Cashflow Boosts − peak drawdown. The sheet's card logic worked the same way.
- **The fund balance** in the month table only goes down when a month on leave dips.
- **The pre-leave baseline** is a normal full year at your leave-year pay. This is slightly more accurate than the sheet, which used the tax year 3 months before leave.
- **KIT and holiday boosts** use your actual marginal take-home rate. The sheet used fixed 38% / 58% / 72% bands.
- **Childcare** starts on the 1st of the month you return unless a date is entered.
- **2027/28 onwards** rates copy 2026/27 (thresholds frozen to April 2031). Change one value in `lib/rates.ts` when new rates are confirmed.

Educational modelling for England, Wales and Northern Ireland. Not regulated financial advice.
