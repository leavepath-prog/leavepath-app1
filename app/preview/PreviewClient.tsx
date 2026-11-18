"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { loadIntake } from "@/components/intake/IntakeWizard";
import type { Intake } from "@/lib/types";

export function PreviewClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [intake, setIntake] = useState<Intake | null>(null);

  useEffect(() => {
    const saved = loadIntake();
    if (!saved) router.replace("/start");
    else setIntake(saved);
  }, [router]);

  if (!intake) return null;

  return (
    <Dashboard
      intake={intake}
      locked
      headerRight={
        <a className="small" href="/start">
          Edit answers
        </a>
      }
      lockedPanel={<UnlockPanel intake={intake} cancelled={params.get("cancelled") === "1"} />}
    />
  );
}

function UnlockPanel({ intake, cancelled }: { intake: Intake; cancelled: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(cancelled ? "Payment cancelled. Your answers are saved." : null);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intake }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  }

  return (
    <form className="card stack" onSubmit={unlock} style={{ gap: 12 }}>
      <span className="eyebrow">Your plan is ready</span>
      <h2 className="card-title">Unlock your full LeavePath Plan</h2>
      <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
        <li>Live sliders for leave length, savings and KIT days</li>
        <li>Month-by-month timeline with your money &amp; HR checklist</li>
        <li>4 working patterns compared, plus your £100k childcare check</li>
        <li>Your flexible working letter, ready to send</li>
      </ul>
      <label className="field">
        <span className="label">Email for your sign-in link</span>
        <input
          className="input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </label>
      {error && <p className="pill warn" role="alert">{error}</p>}
      <button className="btn block" type="submit" disabled={busy}>
        {busy ? "Opening secure checkout…" : "Unlock my plan"}
      </button>
      <p className="help" style={{ textAlign: "center" }}>
        One payment via Stripe. Log back in any time with a magic link.
      </p>
    </form>
  );
}
