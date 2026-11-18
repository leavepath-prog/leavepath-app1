"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dashboard, type TaskChecks } from "@/components/dashboard/Dashboard";
import type { Intake, Scenario } from "@/lib/types";

type SaveState = "saved" | "saving" | "error";

/** Wraps the dashboard with debounced saving of sliders and checkboxes. */
export function DashboardClient({
  planId,
  intake,
  scenario,
  checks,
}: {
  planId: string;
  intake: Intake;
  scenario: Scenario;
  checks: TaskChecks;
}) {
  const [state, setState] = useState<SaveState>("saved");
  const pending = useRef<{ scenario?: Scenario; taskChecks?: TaskChecks }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const body = { planId, ...pending.current };
    pending.current = {};
    try {
      const res = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }, [planId]);

  const queue = useCallback(
    (patch: { scenario?: Scenario; taskChecks?: TaskChecks }) => {
      pending.current = { ...pending.current, ...patch };
      setState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 600);
    },
    [flush],
  );

  // Save anything still queued if the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && Object.keys(pending.current).length) {
        if (timer.current) clearTimeout(timer.current);
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  return (
    <Dashboard
      intake={intake}
      initialScenario={scenario}
      initialChecks={checks}
      onScenarioChange={(s) => queue({ scenario: s })}
      onChecksChange={(c) => queue({ taskChecks: c })}
      headerRight={
        <div className="row small no-print">
          <span className="muted" aria-live="polite">
            {state === "saving" ? "Saving…" : state === "error" ? "Not saved, retrying on next change" : "✓ Saved"}
          </span>
          <form action="/auth/signout" method="post">
            <button type="submit" className="small" style={{ background: "none", border: 0, color: "var(--forest)", textDecoration: "underline", cursor: "pointer" }}>
              Sign out
            </button>
          </form>
        </div>
      }
    />
  );
}
