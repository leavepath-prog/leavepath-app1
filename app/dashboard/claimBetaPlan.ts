import "server-only";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Turns a free-beta pending plan into an unlocked plan, but only for the
 * signed-in owner of the email it was made with. Safe to call twice: the
 * plan is keyed on "beta:<pending id>".
 */
export async function claimBetaPlan(claimId: string, user: { id: string; email?: string | null }) {
  if (!UUID.test(claimId) || !user.email) return;
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("pending_checkouts")
    .select("id, email, intake, scenario, claimed_at, send_welcome, source")
    .eq("id", claimId)
    .maybeSingle();
  if (!pending || pending.source !== "beta" || pending.claimed_at) return;
  if (String(pending.email).toLowerCase() !== user.email.toLowerCase()) return;

  const { error } = await admin.from("plans").upsert(
    {
      user_id: user.id,
      email: user.email.toLowerCase(),
      intake: pending.intake,
      scenario: pending.scenario ?? {},
      paid: true,
      stripe_session_id: `beta:${pending.id}`,
      amount_paid: 0,
      currency: "gbp",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("Beta claim failed", error);
    return;
  }
  await admin.from("pending_checkouts").update({ claimed_at: new Date().toISOString() }).eq("id", pending.id);

  if (pending.send_welcome) {
    // New beta users were signed in instantly; email them a link for next time.
    const anon = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { error: otpError } = await anon.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/dashboard` },
    });
    if (otpError) console.warn("Welcome magic link not sent (they can request one at /login)", otpError.message);
  }
}
