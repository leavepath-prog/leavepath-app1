"use client";

import { gbp, signedGbp, type PlanResult } from "@/lib/leaveCalculator";
import { PATTERN_LABELS, type Scenario } from "@/lib/types";
import { Card, MoneyInput, Pill, Slider, Toggle } from "@/components/ui";

const POT_HELP =
  "Only include savings you have specifically ring-fenced to top up your income during leave — leave out emergency funds, house deposits, or other household savings you don't want to touch.";

interface Props {
  plan: PlanResult;
  scenario: Scenario;
  onScenario: (patch: Partial<Scenario>) => void;
  onPrint: () => void;
}

export function OverviewView({ plan, scenario, onScenario, onPrint }: Props) {
  const returning = plan.intake.stage === "returning";
  return (
    <div className="bento">
      {returning ? <BackAtWorkHero plan={plan} /> : <SavingsPotCard plan={plan} />}
      <SandboxCard plan={plan} onScenario={onScenario} returning={returning} />
      <CliffCard plan={plan} applied={!!scenario.applyPensionFix} onScenario={onScenario} />
      {!returning && <BoostCards plan={plan} onScenario={onScenario} />}
      <div className="span-2 row wrap no-print">
        <button type="button" className="btn ghost" onClick={onPrint}>
          Print / Save PDF snapshot
        </button>
      </div>
    </div>
  );
}

/* ───────── Hero: Dedicated parental leave savings pot ───────── */

export function SavingsPotCard({ plan }: { plan: PlanResult }) {
  const { pot } = plan;
  const covered = pot.savingsPot + pot.boosts;
  const gap = Math.max(0, -pot.remaining);
  const total = Math.max(covered + gap, 1);
  const drawWidth = (Math.min(pot.peakDrawdown, covered) / total) * 100;
  const leftWidth = (Math.max(0, pot.remaining) / total) * 100;
  const gapWidth = (gap / total) * 100;
  const tone = pot.state === "funded" || pot.state === "safe" ? "good" : "warn";

  return (
    <Card className="span-2" aria-labelledby="pot-title">
      <div className="stack" style={{ gap: 12 }}>
        <div className="row between wrap">
          <span className="eyebrow" id="pot-title">
            Dedicated parental leave savings pot (£)
          </span>
          <Pill tone={tone}>{pot.pill}</Pill>
        </div>
        <div className="row wrap" style={{ alignItems: "baseline", gap: 14 }}>
          <span className="hero-figure">{gbp(pot.savingsPot)}</span>
          <span className="muted">
            {gap > 0 ? (
              <>
                <strong style={{ color: "var(--amber)" }}>{gbp(gap)}</strong> short of your lowest months
              </>
            ) : (
              <>
                <strong style={{ color: "var(--forest)" }}>{gbp(pot.remaining)}</strong> buffer left after leave
              </>
            )}
          </span>
        </div>

        <div
          className="meter"
          role="img"
          aria-label={`Peak drawdown ${gbp(pot.peakDrawdown)}, ${gap > 0 ? `gap ${gbp(gap)}` : `remaining buffer ${gbp(pot.remaining)}`}`}
        >
          {drawWidth > 0 && <span className="draw" style={{ width: `${drawWidth}%` }} />}
          {leftWidth > 0 && <span className="left" style={{ width: `${leftWidth}%`, borderRadius: drawWidth > 0 ? "0 999px 999px 0" : 999 }} />}
          {gapWidth > 0 && <span className="gap" style={{ width: `${gapWidth}%` }} />}
        </div>
        <div className="legend">
          <span>
            <i style={{ background: "var(--amber)" }} />
            Peak drawdown {gbp(pot.peakDrawdown)}
            <span className="muted"> · lower-paid &amp; unpaid months</span>
          </span>
          {gap > 0 ? (
            <span>
              <i style={{ background: "var(--amber-tint)" }} />
              Gap {gbp(gap)}
            </span>
          ) : (
            <span>
              <i style={{ background: "var(--forest)" }} />
              Remaining buffer {gbp(pot.remaining)}
            </span>
          )}
        </div>
        <p className="help">
          Your fund {gbp(pot.savingsPot)} + Cashflow Boosts {gbp(pot.boosts)} = {gbp(covered)} available.
          {pot.lowestMonth ? ` Your lowest month is ${pot.lowestMonth}.` : ""} {POT_HELP}
        </p>
      </div>
    </Card>
  );
}

function BackAtWorkHero({ plan }: { plan: PlanResult }) {
  const chosen = plan.patterns.find((p) => p.pattern === plan.intake.returnPattern) ?? plan.patterns[0];
  const best = plan.patterns.find((p) => p.isBest)!;
  return (
    <Card className="span-2">
      <div className="stack" style={{ gap: 10 }}>
        <span className="eyebrow">Monthly cash after childcare · {plan.firstFullYearBack}</span>
        <span className="hero-figure">{gbp(chosen.monthlyCash)} / month</span>
        <p className="muted" style={{ margin: 0 }}>
          After tax, pension, student loan and childcare on {PATTERN_LABELS[chosen.pattern].toLowerCase()}.{" "}
          {best.pattern !== chosen.pattern
            ? `${PATTERN_LABELS[best.pattern]} would leave the most: ${gbp(best.monthlyCash)} a month.`
            : "That's the best of the four patterns."}
        </p>
        <div className="row wrap">
          <Pill tone={plan.backAtWorkMonthly >= 0 ? "good" : "warn"}>
            {signedGbp(plan.backAtWorkMonthly)} / month after bills
          </Pill>
        </div>
      </div>
    </Card>
  );
}

/* ───────── Live sandbox ───────── */

function SandboxCard({
  plan,
  onScenario,
  returning,
}: {
  plan: PlanResult;
  onScenario: (patch: Partial<Scenario>) => void;
  returning: boolean;
}) {
  const weeks = plan.intake.leaveWeeks;
  const months = Math.min(12, Math.max(6, Math.round((weeks / 52) * 12 * 2) / 2));
  const pot = plan.intake.savingsPot;
  return (
    <Card>
      <div className="stack">
        <div>
          <span className="eyebrow">Live sandbox</span>
          <h2 className="card-title">Test your scenario</h2>
          <p className="help">Every figure on your plan updates as you move these.</p>
        </div>
        {!returning && (
          <>
            <Slider
              label="Leave length"
              min={6}
              max={12}
              step={0.5}
              value={months}
              format={(m) => `${m} months · ${Math.round((m * 52) / 12)} wks`}
              onChange={(m) => onScenario({ leaveWeeks: Math.round((m * 52) / 12) })}
              help={weeks > 52 || weeks < 26 ? `Your intake had ${weeks} weeks. Moving the slider replaces it.` : undefined}
            />
            <Slider
              label="Dedicated parental leave savings pot (£)"
              min={0}
              max={Math.max(30_000, pot)}
              step={250}
              value={pot}
              format={gbp}
              onChange={(v) => onScenario({ savingsPot: v })}
            />
            <MoneyInput
              label="Dedicated parental leave savings pot (£), exact amount"
              value={pot}
              onChange={(v) => onScenario({ savingsPot: v })}
            />
          </>
        )}
        <Slider
          label="Paid childcare days a week"
          min={1}
          max={5}
          value={plan.intake.childcareDays}
          format={(d) => `${d} ${d === 1 ? "day" : "days"}`}
          onChange={(d) => onScenario({ childcareDays: d })}
          help="Updates funded hours and Tax-Free Childcare in real time."
        />
      </div>
    </Card>
  );
}

/* ───────── Cashflow Boost pot cards ───────── */

function BoostCards({
  plan,
  onScenario,
}: {
  plan: PlanResult;
  onScenario: (patch: Partial<Scenario>) => void;
}) {
  const { boosts } = plan;
  const maxKit = plan.intake.leaveType === "shared" ? 20 : 10;
  return (
    <Card className="span-2">
      <span className="eyebrow">Cashflow Boosts</span>
      <h2 className="card-title">Top up your leave without touching savings</h2>
      <div className="boost-grid" style={{ marginTop: 10 }}>
        <div className="boost">
          <div className="row between">
            <strong>{plan.intake.leaveType === "shared" ? "SPLIT days" : "KIT days"}</strong>
            <span className="plus">+{gbp(boosts.kitNet)}</span>
          </div>
          <Slider
            label={plan.intake.leaveType === "shared" ? "SPLIT days" : "KIT / SPLIT days"}
            min={0}
            max={maxKit}
            value={boosts.kitDays}
            format={(d) => `${d} ${d === 1 ? "day" : "days"}`}
            onChange={(d) => onScenario({ kitDays: d })}
          />
          <p className="help">Paid work days during leave at your normal day rate, after tax. Check your policy for how they're paid.</p>
        </div>
        <div className="boost">
          <div className="row between">
            <strong>Accrued annual leave</strong>
            <span className="plus">+{gbp(boosts.holidayNet)}</span>
          </div>
          <Slider
            label="Accrued annual leave days"
            min={0}
            max={25}
            value={Math.min(25, plan.intake.holidayDays)}
            format={(d) => `${d} ${d === 1 ? "day" : "days"}`}
            onChange={(d) => onScenario({ holidayDays: d })}
          />
          <p className="help">Holiday you build up on leave, taken at full pay just before you return instead of lower leave pay.</p>
        </div>
      </div>
    </Card>
  );
}

/* ───────── £100k childcare cliff ───────── */

function CliffCard({
  plan,
  applied,
  onScenario,
}: {
  plan: PlanResult;
  applied: boolean;
  onScenario: (patch: Partial<Scenario>) => void;
}) {
  const { cliff } = plan;
  const over = cliff.parents.filter((p) => p.over);
  const who = (w: "you" | "partner") => (w === "you" ? "You" : "Your partner");
  const fixMonthly = over.reduce((s, p) => s + p.fixMonthly, 0);
  const fixAnnual = over.reduce((s, p) => s + p.fixAnnual, 0);
  return (
    <Card>
      <div className="stack" style={{ gap: 12 }}>
        <div>
          <span className="eyebrow">£100k childcare cliff · {cliff.taxYear}</span>
          <h2 className="card-title">
            {!cliff.anyOver
              ? "You keep your childcare support"
              : applied
                ? "Pension fix applied"
                : `${over.map((p) => who(p.who)).join(" and ")} ${over.length > 1 ? "go" : "goes"} over £100k`}
          </h2>
        </div>
        <dl className="kv">
          {cliff.parents.map((p) => (
            <div key={p.who} style={{ display: "contents" }}>
              <dt>{who(p.who)}: adjusted net income</dt>
              {p.over && applied ? (
                <dd className="pos">
                  {gbp(p.ani - p.fixAnnual)} ✓<span className="subline">was {gbp(p.ani)}</span>
                </dd>
              ) : (
                <dd className={p.over ? "neg" : "pos"}>
                  {gbp(p.ani)} {p.over ? "✗" : "✓"}
                </dd>
              )}
            </div>
          ))}
        </dl>
        {cliff.anyOver ? (
          <>
            <p className="small" style={{ margin: 0 }}>
              Over £100,000 means losing 30 funded hours and Tax-Free Childcare, worth{" "}
              <strong>{gbp(cliff.childcareAtStake)} a year</strong> on your current plan.
            </p>
            <Toggle checked={applied} onChange={(v) => onScenario({ applyPensionFix: v })}>
              <strong>Apply Salary Sacrifice / Pension Fix</strong>
              <span className="subline">
                Add {gbp(fixMonthly)}/month ({gbp(fixAnnual)}/yr) to your pension. Costs about{" "}
                {gbp(cliff.netCostOfFix / 12)}/month in take-home after tax relief.
              </span>
            </Toggle>
            {applied && <Pill>Fix applied • Full childcare support reclaimed</Pill>}
          </>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Both parents stay under £100,000 adjusted net income, so you keep 30 funded hours and Tax-Free Childcare.
          </p>
        )}
      </div>
    </Card>
  );
}
