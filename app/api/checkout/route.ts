import { NextResponse } from "next/server";
import { sanitizeIntake } from "@/lib/sanitizeIntake";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL, stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST { email, intake } → { url }
 * Saves the intake as a pending checkout, then opens Stripe Checkout.
 * The plan is only created (and unlocked) by the webhook once Stripe
 * confirms payment.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; intake?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const intake = sanitizeIntake(body.intake);

  const admin = createAdminClient();
  const { data: pending, error } = await admin
    .from("pending_checkouts")
    .insert({ email, intake })
    .select("id")
    .single();
  if (error || !pending) {
    console.error("pending_checkouts insert failed", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: email,
    client_reference_id: pending.id,
    metadata: { pending_checkout_id: pending.id },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/preview?cancelled=1`,
  });

  await admin
    .from("pending_checkouts")
    .update({ stripe_session_id: session.id })
    .eq("id", pending.id);

  return NextResponse.json({ url: session.url });
}
