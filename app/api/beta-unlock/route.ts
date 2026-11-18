import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { FREE_BETA, SITE_URL } from "@/lib/config";
import { sanitizeIntake, sanitizeScenario } from "@/lib/sanitizeIntake";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Free beta unlock. POST { email, intake, scenario? }
 *
 * New email      → account created, signed in straight away:
 *                  { redirect: "/auth/confirm?…&next=/dashboard?claim=<id>" }
 *                  A magic link for next time is emailed once they land.
 * Existing email → we can't prove it's them, so we email a magic link that
 *                  carries the new plan: { status: "check-email" }
 *
 * Either way the plan is only attached when /dashboard?claim=<id> is opened
 * by the signed-in owner of that email.
 */
export async function POST(req: Request) {
  if (!FREE_BETA) {
    return NextResponse.json({ error: "Free beta is closed." }, { status: 404 });
  }

  let body: { email?: unknown; intake?: unknown; scenario?: unknown };
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
  const scenario = sanitizeScenario(body.scenario);
  const admin = createAdminClient();

  // Does this email already have an account?
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  let isNew = false;
  if (!profile) {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (data?.user) isNew = true;
    else if (!/already|registered|exists/i.test(error?.message ?? "")) {
      console.error("Beta createUser failed", error);
      return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
    }
  }

  const { data: pending, error: pendingError } = await admin
    .from("pending_checkouts")
    .insert({ email, intake, scenario, send_welcome: isNew, source: "beta" })
    .select("id")
    .single();
  if (pendingError || !pending) {
    console.error("Beta pending insert failed", pendingError);
    return NextResponse.json({ error: "Could not save your plan. Please try again." }, { status: 500 });
  }
  const next = `/dashboard?claim=${pending.id}`;

  if (isNew) {
    // Brand-new account: sign them in now with a one-time token (no email round trip).
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("Beta generateLink failed", linkError);
      return NextResponse.json({ error: "Could not sign you in. Please try again." }, { status: 500 });
    }
    const params = new URLSearchParams({ token_hash: tokenHash, type: "magiclink", next });
    return NextResponse.json({ redirect: `/auth/confirm?${params.toString()}` });
  }

  // Existing account: email a link that lands on the new plan.
  const anon = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { error: otpError } = await anon.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}${next}` },
  });
  if (otpError) {
    console.error("Beta magic link failed", otpError);
    return NextResponse.json(
      { error: "We couldn't send your sign-in link just now. Please wait a minute and try again." },
      { status: 429 },
    );
  }
  return NextResponse.json({ status: "check-email" });
}
