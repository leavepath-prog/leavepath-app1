import { fmtLong, fmtShort } from "@/lib/dates";
import { gbp, signedGbp, type PlanResult } from "@/lib/leaveCalculator";
import { PATTERN_LABELS, STAGE_LABELS } from "@/lib/types";

/** Print-only one-to-two page summary, used by "Print / Save PDF snapshot". */
export function PrintSnapshot({ plan, title }: { plan: PlanResult; title: string }) {
  const { pot, baseline } = plan;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div>
        <div className="brand">LeavePath</div>
        <h1 className="display" style={{ margin: "4px 0" }}>{title}</h1>
        <div className="small muted">
          {STAGE_LABELS[plan.intake.stage]} · Leave {fmtShort(plan.leaveStart)} to {fmtShort(plan.returnDate)} · Snapshot {fmtLong(Math.floor(Date.now() / 86_400_000))}
        </div>
      </div>
      <div className="card">
        <strong>{plan.verdict.headline}</strong>
        <div className="small">{plan.verdict.detail}</div>
      </div>
      <div className="card">
        <dl className="kv">
          <dt>Dedicated parental leave savings pot</dt><dd>{gbp(pot.savingsPot)}</dd>
          <dt>Cashflow Boosts (KIT + holiday)</dt><dd>{gbp(pot.boosts)}</dd>
          <dt>Peak drawdown (lower-paid &amp; unpaid months)</dt><dd>{gbp(pot.peakDrawdown)}</dd>
          <dt>{pot.remaining >= 0 ? "Remaining buffer" : "Gap"}</dt><dd>{gbp(Math.abs(pot.remaining))}</dd>
          <dt>Current pre-leave baseline</dt><dd>{gbp(baseline.total)} / month</dd>
          <dt>Funded hours from</dt><dd>{fmtShort(plan.fundedHoursFrom)}</dd>
        </dl>
      </div>
      <div className="card">
        <strong>Phases</strong>
        <dl className="kv" style={{ marginTop: 8 }}>
          {plan.phases.map((ph) => (
            <div key={ph.id} style={{ display: "contents" }}>
              <dt>{ph.title}</dt>
              <dd>{signedGbp(ph.monthlyNet)} / month</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="card">
        <strong>Working patterns · {plan.firstFullYearBack}</strong>
        <dl className="kv" style={{ marginTop: 8 }}>
          {plan.patterns.map((p) => (
            <div key={p.pattern} style={{ display: "contents" }}>
              <dt>
                {PATTERN_LABELS[p.pattern]}
                {p.isBest ? " (Best Net Cashflow)" : ""}
              </dt>
              <dd>
                {gbp(p.monthlyCash)} / month
                {p.impactPerDay !== null ? ` · ${signedGbp(p.impactPerDay)} / day` : ""}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="small muted">
        Educational modelling for England, Wales and Northern Ireland using 2026/27 HMRC and statutory rates. Not regulated financial advice.
      </p>
    </div>
  );
}
