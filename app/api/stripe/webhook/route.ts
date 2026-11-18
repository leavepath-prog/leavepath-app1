import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { stripe, SITE_URL } from "@/lib/stripe";
import { createAdminClient, findOrCreateUser } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe → checkout.session.completed
 *  1. Verify the signature against the raw body.
 *  2. Load the pending intake saved by /api/checkout.
 *  3. Find or create the Supabase user for the checkout email.
 *  4. Insert the paid plan (idempotent on stripe_session_id).
 *  5. Email a magic link so they can open their dashboard on any device.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe signature check failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    // Delayed payment methods: wait for async_payment_succeeded.
    return NextResponse.json({ received: true });
  }

  const pendingId = session.metadata?.pending_checkout_id ?? session.client_reference_id;
  const admin = createAdminClient();
  const { data: pending, error: pendingError } = await admin
    .from("pending_checkouts")
    .select("id, email, intake")
    .eq("id", pendingId)
    .maybeSingle();
  if (pendingError || !pending) {
    console.error("No pending checkout for session", session.id, pendingError);
    // 500 makes Stripe retry, in case of a transient database error.
    return NextResponse.json({ error: "Pending checkout not found" }, { status: 500 });
  }

  const email = (session.customer_details?.email ?? pending.email).toLowerCase();
  const userId = await findOrCreateUser(email);

  const { error: planError } = await admin.from("plans").upsert(
    {
      user_id: userId,
      email,
      intake: pending.intake,
      paid: true,
      stripe_session_id: session.id,
      amount_paid: session.amount_total,
      currency: session.currency,
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );
  if (planError) {
    console.error("Plan insert failed", planError);
    return NextResponse.json({ error: "Plan insert failed" }, { status: 500 });
  }

  // Send the magic link with the anon client (uses your Supabase email template).
  const anon = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { error: otpError } = await anon.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/dashboard` },
  });
  if (otpError) console.error("Magic link email failed (user can resend)", otpError);

  return NextResponse.json({ received: true });
}
