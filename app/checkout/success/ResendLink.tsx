"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { INTAKE_STORAGE_KEY } from "@/components/intake/IntakeWizard";

export function ResendLink({ email }: { email: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Paid: the intake now lives in the database, so clear the local copy.
  useEffect(() => {
    try {
      window.localStorage.removeItem(INTAKE_STORAGE_KEY);
    } catch {}
  }, []);

  if (!email) return <a className="btn ghost block" href="/login">Send me a sign-in link</a>;

  async function resend() {
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email!,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setState(error ? "error" : "sent");
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <button type="button" className="btn ghost block" onClick={resend} disabled={state === "sending"}>
        {state === "sent" ? "✓ Sent again" : state === "sending" ? "Sending…" : "Resend the link"}
      </button>
      {state === "error" && (
        <p className="help">
          Couldn't send yet. Your payment may still be confirming, so try again in a minute.
        </p>
      )}
    </div>
  );
}
