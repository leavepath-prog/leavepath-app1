"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { loadIntake } from "@/components/intake/IntakeWizard";
import { FREE_BETA } from "@/lib/config";
import type { Intake, Scenario } from "@/lib/types";

export function PreviewClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [intake, setIntake] = useState<Intake | null>(null);
  const scenario = useRef<Scenario>({});

  useEffect(() => {
    const saved = loadIntake();
    if (!saved) router.replace("/start");
    else setIntake(saved);
  }, [router]);

  if (!intake) return null;

  const editLink = (
    <a className="small" href="/start">
      Edit answers
    </a>
  );

  // Free beta: no paywall. The full dashboard works straight away, with a
  // card to save it to an account (and keep slider changes).
  if (FREE_BETA) {
    return (
      <Dashboard
        intake={intake}
        headerRight={editLink}
        onScenarioChange={(s) => {
          scenario.current = s;
        }}
        topSlot={<BetaSavePanel intake={intake} scenario={scenario} />}
      />
    );
  }

  return (
    <Dashboard
      intake={intake}
      locked
      headerRight={editLink}
      lockedPanel={<UnlockPanel intake={intake} cancelled={params.get("cancelled") === "1"} />}
    />
  );
}

/* ───────── Free beta: save the plan to an account ───────── */

function BetaSavePanel({ intake, scenario }: { intake: Intake; scenario: { current: Scenario } }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "check-email">("idle");
  const [error, setError] = useState<string | null>(null);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/api/beta-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intake, scenario: scenario.current }),
      });
      const data = (await res.json()) as { redirect?: string; status?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      if (data.redirect) {
        window.location.href = data.redirect; // signs in and opens the saved dashboard
        return;
      }
      setState("check-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "check-email") {
    return (
      <div className="card stack no-print" role="status" style={{ gap: 8 }}>
        <span className="eyebrow">Check your inbox</span>
        <h2 className="card-title">You already have a LeavePath account</h2>
        <p className="small" style={{ margin: 0 }}>
          We've emailed a sign-in link to <strong>{email}</strong>. Tap it to open this plan in your dashboard. It
          works on any device.
        </p>
      </div>
    );
  }

  return (
    <form className="card stack no-print" onSubmit={unlock} style={{ gap: 12 }}>
      <div className="row between wrap">
        <span className="eyebrow">Free during beta</span>
        <span className="pill">No card needed</span>
      </div>
      <h2 className="card-title">Unlock My Free LeavePath Plan</h2>
      <p className="small muted" style={{ margin: 0 }}>
        Save your plan to keep your slider changes and checklist, and log back in any time with a magic link.
      </p>
      <label className="field">
        <span className="label">Your email</span>
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
      {error && (
        <p className="pill warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn block" type="submit" disabled={state === "busy"}>
        {state === "busy" ? "Unlocking your plan…" : "Unlock My Free LeavePath Plan"}
      </button>
    </form>
  );
}

/* ───────── Paid: Stripe Checkout (NEXT_PUBLIC_FREE_BETA=false) ───────── */

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
      {error && (
        <p className="pill warn" role="alert">
          {error}
        </p>
      )}
      <button className="btn block" type="submit" disabled={busy}>
        {busy ? "Opening secure checkout…" : "Unlock my plan"}
      </button>
      <p className="help" style={{ textAlign: "center" }}>
        One payment via Stripe. Log back in any time with a magic link.
      </p>
    </form>
  );
}
