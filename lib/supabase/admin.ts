import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses Row Level Security, so only use it in
 * trusted server code (the Stripe webhook and checkout route).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Find a user id by email, creating a confirmed user if there isn't one. */
export async function findOrCreateUser(email: string): Promise<string> {
  const admin = createAdminClient();
  const normalised = email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalised)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data, error } = await admin.auth.admin.createUser({
    email: normalised,
    email_confirm: true,
  });
  if (data?.user) return data.user.id;

  // Race: created between our lookup and createUser. Look up again.
  const { data: again } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalised)
    .maybeSingle();
  if (again?.id) return again.id as string;
  throw error ?? new Error("Could not create user");
}
