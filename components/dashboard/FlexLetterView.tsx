"use client";

import { useState } from "react";
import { fmtLong, todayDay } from "@/lib/dates";
import type { FlexLetter } from "@/lib/letter";
import { gbp, signedGbp, type PlanResult } from "@/lib/leaveCalculator";
import { PATTERN_LABELS, type Pattern, type Scenario } from "@/lib/types";
import { Card, Pill, Segmented } from "@/components/ui";

interface Props {
  plan: PlanResult;
  letter: FlexLetter;
  onScenario: (patch: Partial<Scenario>) => void;
  onPrint: () => void;
}

const SHORT: Record<Pattern, string> = {
  full: "5 days",
  four: "4 days",
  compressed: "Compressed",
  three: "3 days",
};

export function FlexLetterView({ plan, letter, onScenario, onPrint }: Props) {
  const [copied, setCopied] = useState(false);
  const chosen = plan.patterns.find((p) => p.pattern === plan.intake.returnPattern)!;
  const late = letter.sendBy < todayDay();

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter.text);
    } catch {
      // Older browsers: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = letter.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Statutory flexible working request</span>
        <h2 className="display" style={{ fontSize: 26, margin: "4px 0 6px" }}>
          Your Flex Letter
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          Live-synced to your plan. Change the pattern here or on the Return tab and the letter rewrites itself.
        </p>
      </div>

      <Card>
        <div className="stack" style={{ gap: 12 }}>
          <Segmented
            label="Working pattern to request"
            options={(Object.keys(SHORT) as Pattern[]).map((p) => ({ value: p, label: SHORT[p] }))}
            value={plan.intake.returnPattern}
            onChange={(p) => onScenario({ returnPattern: p })}
          />
          <div className="row wrap">
            <Pill tone="neutral">{PATTERN_LABELS[chosen.pattern]}</Pill>
            {chosen.pattern !== "full" && (
              <Pill tone={chosen.diffVsFull < 0 ? "warn" : "good"}>
                {signedGbp(chosen.diffVsFull)} / month vs. 5 days
              </Pill>
            )}
            <Pill tone="neutral">Starts {fmtLong(letter.proposedStart)}</Pill>
            <Pill tone={late ? "warn" : "neutral"}>
              {late ? "Send as soon as you can" : `Send by ${fmtLong(letter.sendBy)}`}
            </Pill>
          </div>
          {!letter.needsRequest && (
            <p className="small" style={{ margin: 0 }}>
              You're returning to your existing contract, so no formal request is needed. Pick a pattern above to draft one. Your salary on 5 days in {plan.firstFullYearBack}: {gbp(chosen.salary)}.
            </p>
          )}
          <div className="row wrap no-print">
            <button type="button" className="btn" onClick={copy}>
              {copied ? "✓ Copied" : "Copy Text"}
            </button>
            <button type="button" className="btn ghost" onClick={onPrint}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </Card>

      <LetterPaper letter={letter} />
      <p className="help">
        Your name, manager, job title, hours and non-working days come from your intake. Your employer must decide within 2 months, including any appeal, and must consult you before saying no.
      </p>
    </div>
  );
}

export function LetterPaper({ letter }: { letter: FlexLetter }) {
  return (
    <article className="paper" aria-label="Flexible working request letter">
      <p>
        <strong>Subject: {letter.subject}</strong>
      </p>
      {letter.paragraphs.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </article>
  );
}
