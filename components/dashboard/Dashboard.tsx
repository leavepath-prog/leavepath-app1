"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { calculatePlan } from "@/lib/leaveCalculator";
import { fmtShort } from "@/lib/dates";
import { buildFlexLetter } from "@/lib/letter";
import { STAGE_LABELS, type Intake, type Scenario } from "@/lib/types";
import { Segmented, Pill } from "@/components/ui";
import { OverviewView } from "./OverviewView";
import { TimelineView } from "./TimelineView";
import { ReturnView } from "./ReturnView";
import { FlexLetterView, LetterPaper } from "./FlexLetterView";
import { PrintSnapshot } from "./PrintSnapshot";

export type Tab = "overview" | "timeline" | "return" | "letter";
export type TaskChecks = Record<string, boolean>;

export interface DashboardProps {
  intake: Intake;
  initialScenario?: Scenario;
  initialChecks?: TaskChecks;
  /** Locked preview before payment: masthead + verdict visible, rest blurred. */
  locked?: boolean;
  lockedPanel?: ReactNode;
  onScenarioChange?: (s: Scenario) => void;
  onChecksChange?: (c: TaskChecks) => void;
  headerRight?: ReactNode;
  /** Day number for "today" (tests and screenshots); defaults to the real date. */
  today?: number;
  initialTab?: Tab;
}

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "timeline", label: "Timeline" },
  { value: "return", label: "Return" },
  { value: "letter", label: "Flex Letter" },
];

export function Dashboard({
  intake,
  initialScenario = {},
  initialChecks = {},
  locked = false,
  lockedPanel,
  onScenarioChange,
  onChecksChange,
  headerRight,
  today,
  initialTab = "overview",
}: DashboardProps) {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [checks, setChecks] = useState<TaskChecks>(initialChecks);
  const [tab, setTab] = useState<Tab>(initialTab);

  const plan = useMemo(
    () => calculatePlan(intake, scenario, { today }),
    [intake, scenario, today],
  );
  const letter = useMemo(() => buildFlexLetter(plan), [plan]);

  const updateScenario = useCallback((patch: Partial<Scenario>) => {
    setScenario((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleTask = useCallback((id: string, done: boolean) => {
    setChecks((prev) => {
      const next = { ...prev };
      if (done) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);

  // Tell the parent (which saves to Supabase) after a change, never on first render.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) onScenarioChange?.(scenario);
  }, [scenario]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mounted.current) onChecksChange?.(checks);
  }, [checks]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    mounted.current = true;
  }, []);

  const print = useCallback((mode: "letter" | "snapshot") => {
    document.body.dataset.print = mode;
    const reset = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", reset);
    };
    window.addEventListener("afterprint", reset);
    window.print();
  }, []);

  // Scroll to top when switching views (feels native on phones).
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [tab]);

  const name = intake.firstName.trim();
  const title = name ? `${name}’s LeavePath Plan` : "Your LeavePath Plan";
  const p = plan.intake;

  const body = (
    <>
      {tab === "overview" && (
        <OverviewView plan={plan} scenario={scenario} onScenario={updateScenario} onPrint={() => print("snapshot")} />
      )}
      {tab === "timeline" && <TimelineView plan={plan} checks={checks} onToggle={toggleTask} />}
      {tab === "return" && <ReturnView plan={plan} onScenario={updateScenario} />}
      {tab === "letter" && (
        <FlexLetterView plan={plan} letter={letter} onScenario={updateScenario} onPrint={() => print("letter")} />
      )}
    </>
  );

  return (
    <>
      {!locked && (
        <nav className="tabnav no-print" aria-label="Dashboard sections">
          <Segmented label="Dashboard sections" options={TABS} value={tab} onChange={setTab} />
        </nav>
      )}
      <main className="shell">
        <div className="screen-view stack">
          <header className="masthead">
            <div className="row between">
              <a className="brand" href="/">
                LeavePath
              </a>
              {headerRight}
            </div>
            <h1>{title}</h1>
            <div className="row wrap">
              <Pill tone="neutral">{STAGE_LABELS[p.stage]}</Pill>
              <Pill tone="neutral">
                Leave {fmtShort(plan.leaveStart)} → {fmtShort(plan.returnDate)}
              </Pill>
              <Pill tone="neutral">{p.household === "two" ? "Two-parent household" : "Solo parent"}</Pill>
            </div>
          </header>

          <div className={`verdict ${plan.verdict.tone === "warn" ? "warn" : ""}`} role="status">
            <span className="verdict-icon" aria-hidden="true">
              {plan.verdict.tone === "warn" ? "!" : "✓"}
            </span>
            <div>
              <strong>{plan.verdict.headline}</strong>
              <span className="small">{plan.verdict.detail}</span>
            </div>
          </div>

          {locked ? (
            <div className="locked">
              <div className="blur" aria-hidden="true">
                {body}
              </div>
              <div className="unlock">{lockedPanel}</div>
            </div>
          ) : (
            body
          )}
        </div>

        {!locked && (
          <>
            <div className="print-only print-snapshot">
              <PrintSnapshot plan={plan} title={title} />
            </div>
            <div className="print-only print-letter">
              <LetterPaper letter={letter} />
            </div>
          </>
        )}
      </main>
    </>
  );
}
