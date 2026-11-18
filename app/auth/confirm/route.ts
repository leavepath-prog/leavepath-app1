import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing: verifies the token hash and signs the user in.
 * `next` may be a path ("/dashboard?claim=…") or, from the email template's
 * {{ .RedirectTo }}, a full URL on this site. Anything else goes to /dashboard.
 */
function safeNext(raw: string | null, origin: string): string {
  if (!raw) return "/dashboard";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    const site = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null;
    if (url.host === new URL(origin).host || (site && url.host === site)) {
      const path = url.pathname + url.search;
      return path === "/" ? "/dashboard" : path;
    }
  } catch {
    // not a URL
  }
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const next = safeNext(searchParams.get("next"), origin);

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
