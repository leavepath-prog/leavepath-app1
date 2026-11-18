"use client";

import { useMemo, useState } from "react";
import {
  babyDateLabel,
  gbp,
  signedGbp,
  type MonthRow,
  type Phase,
  type PlanResult,
} from "@/lib/leaveCalculator";
import { fmtLong, fmtShort } from "@/lib/dates";
import { tasksFor, type PlanTask } from "@/lib/tasks";
import { Card, Pill } from "@/components/ui";
import type { TaskChecks } from "./Dashboard";

interface Props {
  plan: PlanResult;
  checks: TaskChecks;
  onToggle: (id: string, done: boolean) => void;
}

export function TimelineView({ plan, checks, onToggle }: Props) {
  const tasks = useMemo(() => tasksFor(plan.intake), [plan.intake]);
  const { baseline } = plan;
  return (
    <div className="stack">
      <div className="baseline-badge" role="note">
        <div>
          <span className="eyebrow">Current Pre-Leave Baseline</span>
          <div className="small muted">
            Normal household take-home before leave
            {plan.intake.household === "two"
              ? ` · you ${gbp(baseline.you)} + partner ${gbp(baseline.partner)}`
              : ""}{" "}
            · {baseline.taxYear}
          </div>
        </div>
        <strong className="display num" style={{ fontSize: 22, whiteSpace: "nowrap" }}>
          {gbp(baseline.total)}/mo
        </strong>
      </div>

      <div className="row wrap small">
        <Pill tone="neutral">
          {babyDateLabel(plan.intake.stage)}: {fmtLong(plan.babyDate)}
        </Pill>
        <Pill tone="neutral">Funded hours from {fmtShort(plan.fundedHoursFrom)}</Pill>
      </div>

      <Card>
        <span className="eyebrow">Month 1 = {plan.months[0]?.label}</span>
        <h2 className="card-title">Your money, month by month</h2>
        <p className="help">Each bar is what's left after bills and childcare. Below zero is a dip your dedicated leave fund covers.</p>
        <SurplusChart months={plan.months} />
      </Card>

      {plan.phases.map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          tasks={tasks.filter((t) => t.phase === phase.id)}
          checks={checks}
          onToggle={onToggle}
          isBefore={phase.id === "before"}
        />
      ))}

      <Card>
        <details>
          <summary>Month-by-month detail</summary>
          <MonthTable months={plan.months} />
        </details>
      </Card>
    </div>
  );
}

function PhaseCard({
  phase,
  tasks,
  checks,
  onToggle,
  isBefore,
}: {
  phase: Phase;
  tasks: PlanTask[];
  checks: TaskChecks;
  onToggle: (id: string, done: boolean) => void;
  isBefore: boolean;
}) {
  const done = tasks.filter((t) => checks[t.id]).length;
  const negative = phase.monthlyNet < 0;
  return (
    <Card as="article" className="phase" aria-labelledby={`phase-${phase.id}`}>
      <div className="phase-head">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <span className={`phase-dot ${negative ? "warn" : ""}`} aria-hidden="true" />
          <div>
            <h3 className="card-title" id={`phase-${phase.id}`}>
              {phase.title}
            </h3>
            <div className="small muted">
              {isBefore ? `Until ${fmtShort(phase.end)}` : `${fmtShort(phase.start)} – ${fmtShort(phase.end)}`}
              {phase.weeks ? ` · weeks ${phase.weeks[0]}–${phase.weeks[1]}` : ""}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div
            className="display num"
            style={{ fontSize: 22, whiteSpace: "nowrap", color: negative ? "var(--amber)" : "var(--forest)" }}
          >
            {signedGbp(phase.monthlyNet)}
          </div>
          <div className="small muted">{isBefore ? "spare / month (normal pay)" : "net / month"}</div>
        </div>
      </div>
      <p className="small" style={{ margin: "10px 0 8px" }}>
        Household income after tax about <strong>{gbp(phase.monthlyIncome)}</strong> a month.
      </p>
      {tasks.length > 0 && (
        <>
          <div className="row between small" style={{ margin: "6px 0" }}>
            <span className="muted">
              {done} of {tasks.length} done
            </span>
          </div>
          <div className="progress-line" aria-hidden="true">
            <span style={{ width: `${(done / tasks.length) * 100}%` }} />
          </div>
          <div style={{ marginTop: 6 }}>
            {tasks.map((t) => (
              <label key={t.id} className={`task ${checks[t.id] ? "done" : ""}`}>
                <input
                  type="checkbox"
                  checked={!!checks[t.id]}
                  onChange={(e) => onToggle(t.id, e.target.checked)}
                />
                <span>
                  <span className="task-title">{t.title}</span>
                  <span className="tag">{t.kind === "hr" ? "HR" : t.kind}</span>
                  <span className="help" style={{ display: "block", marginTop: 2 }}>
                    {t.detail}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/** Diverging bar chart of each month's surplus, with a hover/tap readout. */
function SurplusChart({ months }: { months: MonthRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 640;
  const H = 230;
  const pad = { t: 12, b: 34, l: 4, r: 4 };
  const hi = Math.max(0, ...months.map((m) => m.surplus));
  const lo = Math.min(0, ...months.map((m) => m.surplus));
  const innerH = H - pad.t - pad.b;
  const scale = innerH / (hi - lo || 1);
  const zero = pad.t + hi * scale;
  const slot = (W - pad.l - pad.r) / months.length;
  const bw = Math.max(4, slot - 4);
  const shown = active ?? months.findIndex((m) => m.surplus === lo || m.surplus === Math.min(...months.map((x) => x.surplus)));
  const cur = months[shown];
  return (
    <div>
      {cur && (
        <div className="row between small" style={{ margin: "8px 0" }} aria-live="polite">
          <strong>{cur.label}</strong>
          <span className="num" style={{ color: cur.surplus < 0 ? "var(--amber)" : "var(--forest)", fontWeight: 700 }}>
            {signedGbp(cur.surplus)}
            <span className="muted" style={{ fontWeight: 500 }}> · fund {gbp(cur.fundBalance)}</span>
          </span>
        </div>
      )}
      <svg
        className="bars"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Monthly surplus or shortfall after bills and childcare"
        onMouseLeave={() => setActive(null)}
      >
        <line x1={pad.l} x2={W - pad.r} y1={zero} y2={zero} stroke="#d6d3cc" strokeWidth={1} />
        {months.map((m, i) => {
          const h = Math.abs(m.surplus) * scale;
          const x = pad.l + i * slot + (slot - bw) / 2;
          const y = m.surplus >= 0 ? zero - h : zero;
          const neg = m.surplus < 0;
          return (
            <g key={m.start} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}>
              <rect x={pad.l + i * slot} y={pad.t} width={slot} height={innerH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={bw}
                height={Math.max(1, h)}
                rx={Math.min(4, bw / 2)}
                fill={neg ? "#B45309" : m.phase === "leave" ? "#5E9A92" : "#134E4A"}
                opacity={active === null || active === i ? 1 : 0.45}
              >
                <title>{`${m.label}: ${signedGbp(m.surplus)}`}</title>
              </rect>
              {(i === 0 || m.label.startsWith("Jan")) && (
                <text x={x} y={H - 6} fontSize={18} fill="#78716c">
                  {m.label.replace(/^(\w{3}) (\d{4})$/, "$1 ’$2").replace("’20", "’")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="legend" style={{ marginTop: 6 }}>
        <span><i style={{ background: "#5E9A92" }} />On leave</span>
        <span><i style={{ background: "#134E4A" }} />Back at work</span>
        <span><i style={{ background: "#B45309" }} />Dip</span>
      </div>
    </div>
  );
}

function MonthTable({ months }: { months: MonthRow[] }) {
  return (
    <div className="scroll-x" style={{ marginTop: 8 }}>
      <table className="months">
        <thead>
          <tr>
            <th>Month</th>
            <th>Your take-home</th>
            <th>Partner</th>
            <th>Child Benefit</th>
            <th>Childcare paid</th>
            <th>Bills</th>
            <th>Surplus</th>
            <th>Leave fund</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.start}>
              <td>
                {m.label}
                <span className="subline">{m.phase === "leave" ? "On leave" : "Back at work"}</span>
              </td>
              <td>{gbp(m.yourTakeHome)}</td>
              <td>{gbp(m.partnerTakeHome)}</td>
              <td>{gbp(m.childBenefit - m.hicbc)}</td>
              <td>{gbp(m.childcarePaid)}</td>
              <td>{gbp(m.bills)}</td>
              <td style={{ color: m.surplus < 0 ? "var(--amber)" : "var(--forest)", fontWeight: 700 }}>
                {signedGbp(m.surplus)}
              </td>
              <td>{gbp(m.fundBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
