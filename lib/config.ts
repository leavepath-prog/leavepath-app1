/**
 * Feature flags.
 *
 * NEXT_PUBLIC_FREE_BETA=true  → no payment: email in, plan unlocked, straight into the dashboard.
 * NEXT_PUBLIC_FREE_BETA=false → Stripe Checkout + webhook unlock the plan (the original paid flow).
 *
 * NEXT_PUBLIC_ variables are baked in when Vercel builds the app, so
 * redeploy after changing the flag.
 */
export const FREE_BETA = process.env.NEXT_PUBLIC_FREE_BETA === "true";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** True when every Stripe variable needed for the paid flow is present. */
export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID && process.env.STRIPE_WEBHOOK_SECRET,
  );
}
