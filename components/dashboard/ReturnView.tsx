"use client";

import { gbp, signedGbp, type PatternResult, type PlanResult } from "@/lib/leaveCalculator";
import { PATTERN_LABELS, type Pattern, type Scenario } from "@/lib/types";
import { Card, Pill, Segmented } from "@/components/ui";

interface Props {
  plan: PlanResult;
  onScenario: (patch: Partial<Scenario>) => void;
}

export function ReturnView({ plan, onScenario }: Props) {
  const family = plan.intake.childcareSetup === "family";
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Return to work · {plan.firstFullYearBack}</span>
        <h2 className="display" style={{ fontSize: 26, margin: "4px 0 6px" }}>
          Should you go back full-time or part-time?
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          See what each working pattern leaves in your pocket after tax and childcare — purely a sandbox to help you weigh up your options.
        </p>
      </div>

      <Card>
        <div className="stack" style={{ gap: 10 }}>
          <div className="field-head">
            <span className="label" style={{ fontWeight: 600 }}>
              Nursery / childminder days a week
            </span>
          </div>
          {family ? (
            <p className="help">You chose family / informal support only, so paid childcare is £0 in every pattern.</p>
          ) : (
            <>
              <Segmented
                label="Paid childcare days a week"
                options={[1, 2, 3, 4, 5].map((d) => ({ value: d, label: String(d) }))}
                value={plan.intake.childcareDays}
                onChange={(d) => onScenario({ childcareDays: d })}
              />
              <p className="help">
                Funded hours and Tax-Free Childcare update instantly.
                {plan.intake.childcareReduction === "minusOne"
                  ? " Dropping working days saves 1 paid childcare day (2 on a 3-day week)."
                  : " Your childcare days stay the same on every pattern."}
              </p>
            </>
          )}
        </div>
      </Card>

      <div className="bento">
        {plan.patterns.map((p) => (
          <PatternCard
            key={p.pattern}
            p={p}
            chosen={plan.intake.returnPattern === p.pattern}
            onChoose={() => onScenario({ returnPattern: p.pattern as Pattern })}
          />
        ))}
      </div>
      <p className="help">
        Take-home impact per extra day off is the annual net difference vs. 5 days divided by your extra days off. Figures are for a full tax year back at work ({plan.firstFullYearBack}) after tax, NI, pension, student loan, Child Benefit and childcare.
      </p>
    </div>
  );
}

function PatternCard({
  p,
  chosen,
  onChoose,
}: {
  p: PatternResult;
  chosen: boolean;
  onChoose: () => void;
}) {
  const isFull = p.pattern === "full";
  return (
    <Card as="article" className={p.isBest ? "best" : ""} aria-label={PATTERN_LABELS[p.pattern]}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="row between wrap" style={{ gap: 6 }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            {PATTERN_LABELS[p.pattern]}
          </h3>
          <div className="row" style={{ gap: 6 }}>
            {p.isBest && <Pill tone="solid">Best Net Cashflow</Pill>}
            {chosen && <Pill tone="neutral">Your plan</Pill>}
          </div>
        </div>
        <div>
          <div className="hero-figure" style={{ fontSize: 34 }}>
            {gbp(p.monthlyCash)}
          </div>
          <div className="small muted">a month after tax &amp; childcare</div>
        </div>
        <dl className="kv">
          <dt>Monthly difference vs. 5 days</dt>
          <dd className={isFull ? "" : p.diffVsFull < 0 ? "neg" : "pos"}>{isFull ? "–" : signedGbp(p.diffVsFull)}</dd>

          <dt>Extra days at home / off work</dt>
          <dd>{p.extraDaysOff} days a year</dd>

          <dt>
            Take-home impact per extra day off
            <span className="subline">Annual net difference ÷ extra days off</span>
          </dt>
          <dd className={p.impactPerDay === null ? "" : p.impactPerDay < 0 ? "neg" : "pos"}>
            {p.impactPerDay === null ? "–" : `${signedGbp(p.impactPerDay)} / day`}
          </dd>

          <dt>Paid childcare days</dt>
          <dd>{p.childcareDays} a week</dd>

          <dt>Funded hours &amp; Tax-Free Childcare</dt>
          <dd className={p.keepsChildcareSupport ? "pos" : "neg"}>{p.keepsChildcareSupport ? "✓ Kept" : "✗ Lost"}</dd>

          <dt>Salary before tax</dt>
          <dd>{gbp(p.salary)}</dd>
        </dl>
        <button
          type="button"
          className={`btn ${chosen ? "" : "ghost"} block no-print`}
          aria-pressed={chosen}
          onClick={onChoose}
        >
          {chosen ? "✓ In your plan & letter" : "Use this pattern"}
        </button>
      </div>
    </Card>
  );
}
