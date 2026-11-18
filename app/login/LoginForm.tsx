"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(
    params.get("error") === "link" ? "That link has expired or was already used. Request a new one below." : null,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      // Only people who've bought a plan have an account.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      // Don't reveal whether an account exists.
      console.warn(error.message);
    }
    setState("sent");
  }

  return (
    <form className="card stack" style={{ marginTop: 24 }} onSubmit={submit}>
      <h1 className="display" style={{ fontSize: 30, margin: 0 }}>
        Sign in to your plan
      </h1>
      {state === "sent" ? (
        <p style={{ margin: 0 }}>
          If <strong>{email}</strong> has a LeavePath Plan, a sign-in link is on its way. It expires in 1 hour.
        </p>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            We'll email you a magic link. No password needed.
          </p>
          <label className="field">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="pill warn" role="alert">{error}</p>}
          <button className="btn block" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          <p className="help" style={{ textAlign: "center" }}>
            New here? <a href="/start">Build your plan</a>
          </p>
        </>
      )}
    </form>
  );
}
