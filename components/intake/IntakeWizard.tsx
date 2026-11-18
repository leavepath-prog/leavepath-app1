"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { babyDateLabel } from "@/lib/leaveCalculator";
import { STUDENT_LOAN_LABELS, type StudentLoanPlan } from "@/lib/rates";
import {
  DEFAULT_INTAKE,
  PATTERN_LABELS,
  STAGE_LABELS,
  type Intake,
  type Pattern,
  type Stage,
  type Weekday,
} from "@/lib/types";
import { MoneyInput, Segmented, Toggle } from "@/components/ui";

export const INTAKE_STORAGE_KEY = "leavepath:intake:v1";

const POT_HELP =
  "Only include savings you have specifically ring-fenced to top up your income during leave — leave out emergency funds, house deposits, or other household savings you don't want to touch.";
const WEEKDAYS: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

type Setter = <K extends keyof Intake>(key: K, value: Intake[K]) => void;

interface Step {
  title: string;
  intro: string;
  skip?: (i: Intake) => boolean;
  valid?: (i: Intake) => string | null;
  render: (i: Intake, set: Setter) => ReactNode;
}

export function loadIntake(): Intake | null {
  try {
    const raw = window.localStorage.getItem(INTAKE_STORAGE_KEY);
    return raw ? { ...DEFAULT_INTAKE, ...(JSON.parse(raw) as Partial<Intake>) } : null;
  } catch {
    return null;
  }
}

function saveIntake(i: Intake) {
  try {
    window.localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(i));
  } catch {
    // Private mode / storage full: the wizard still works for this visit.
  }
}

const STEPS: Step[] = [
  {
    title: "About you",
    intro: "A few basics so your plan speaks to where you are now.",
    render: (i, set) => (
      <>
        <Field label="Your first name (optional)" help="Used for your dashboard title, e.g. “Sarah’s LeavePath Plan”.">
          <input className="input" value={i.firstName} maxLength={40} autoComplete="given-name" onChange={(e) => set("firstName", e.target.value)} />
        </Field>
        <Field label="Where are you right now?">
          <Choices
            name="stage"
            value={i.stage}
            options={(Object.keys(STAGE_LABELS) as Stage[]).map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
            onChange={(v) => set("stage", v)}
          />
        </Field>
        <Field label="Who’s in your household?">
          <Choices
            name="household"
            value={i.household}
            options={[
              { value: "two", label: "Two-parent household" },
              { value: "solo", label: "Solo parent" },
            ]}
            onChange={(v) => set("household", v)}
          />
        </Field>
        <Field label="Type of leave">
          <Choices
            name="leaveType"
            value={i.leaveType}
            options={[
              { value: "maternity", label: "Maternity leave" },
              { value: "adoption", label: "Adoption / surrogacy" },
              { value: "shared", label: "Shared Parental Leave" },
            ]}
            onChange={(v) => set("leaveType", v)}
          />
        </Field>
        {i.leaveType === "shared" && (
          <Field label="Weeks of statutory pay already used by the other parent" help="You share up to 39 weeks between you, 0 to 39.">
            <NumberInput value={i.weeksUsedByOtherParent} min={0} max={39} onChange={(v) => set("weeksUsedByOtherParent", v)} />
          </Field>
        )}
      </>
    ),
  },
  {
    title: "Your dates",
    intro: "Best guesses are fine. You can test other dates later.",
    valid: (i) => (!i.leaveStart || !i.babyDate ? "Please add both dates." : null),
    render: (i, set) => (
      <>
        <Field label="Leave start date" help="Your first day off work, past or future.">
          <input className="input" type="date" value={i.leaveStart} onChange={(e) => set("leaveStart", e.target.value)} />
        </Field>
        <Field
          label={babyDateLabel(i.stage)}
          help="Used to work out when funded childcare hours begin (the term after your baby turns 9 months old)."
        >
          <input className="input" type="date" value={i.babyDate} onChange={(e) => set("babyDate", e.target.value)} />
        </Field>
        <Field label="How long will your leave be?" help="Weeks 40 onwards are unpaid unless your employer pays more.">
          <Segmented
            label="Leave length"
            options={[26, 39, 52].map((w) => ({ value: w, label: `${Math.round((w / 52) * 12)} months` }))}
            value={[26, 39, 52].includes(i.leaveWeeks) ? i.leaveWeeks : -1}
            onChange={(w) => set("leaveWeeks", w)}
          />
          <NumberInput value={i.leaveWeeks} min={4} max={104} suffix="weeks" onChange={(v) => set("leaveWeeks", v)} />
        </Field>
      </>
    ),
  },
  {
    title: "Your pay",
    intro: "Your pay before tax, as it is in the 2026/27 tax year.",
    valid: (i) => (i.salary <= 0 ? "Please add your salary." : null),
    render: (i, set) => (
      <>
        <Field label="Annual salary (before tax)">
          <MoneyInput label="Annual salary" value={i.salary} onChange={(v) => set("salary", v)} />
        </Field>
        <Field label="Bonus, commission or car allowance (per year)" help="Put 0 if none. Counts towards the £100k childcare check.">
          <MoneyInput label="Bonus" value={i.bonus} onChange={(v) => set("bonus", v)} />
        </Field>
        <Field label="Pension contribution via salary sacrifice">
          <PercentInput value={i.pensionPct} onChange={(v) => set("pensionPct", v)} />
        </Field>
        <Field label="Expected pay rise each April">
          <PercentInput value={i.payRisePct} onChange={(v) => set("payRisePct", v)} />
        </Field>
        <Field label="Student loan">
          <select className="input" value={i.studentLoan} onChange={(e) => set("studentLoan", e.target.value as StudentLoanPlan)}>
            {(Object.keys(STUDENT_LOAN_LABELS) as StudentLoanPlan[]).map((k) => (
              <option key={k} value={k}>
                {STUDENT_LOAN_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
      </>
    ),
  },
  {
    title: "Your employer’s leave pay",
    intro: "Check your policy. After these weeks we add statutory pay to week 39, then unpaid weeks.",
    render: (i, set) => {
      const full = i.policy.find((b) => b.level === "full")?.weeks ?? 0;
      const half = i.policy.find((b) => b.level === "halfSmp")?.weeks ?? 0;
      const update = (f: number, h: number) =>
        set("policy", [
          ...(f > 0 ? [{ weeks: f, level: "full" as const }] : []),
          ...(h > 0 ? [{ weeks: h, level: "halfSmp" as const }] : []),
        ]);
      return (
        <>
          <Field label="Weeks on full pay" help="0 if your employer only pays the statutory minimum.">
            <NumberInput value={full} min={0} max={52} suffix="weeks" onChange={(v) => update(v, half)} />
          </Field>
          <Field label="Then weeks on half pay plus statutory pay">
            <NumberInput value={half} min={0} max={52} suffix="weeks" onChange={(v) => update(full, v)} />
          </Field>
        </>
      );
    },
  },
  {
    title: "Your partner",
    intro: "Their income counts for Child Benefit and the £100k childcare check.",
    skip: (i) => i.household === "solo",
    render: (i, set) => (
      <>
        <Field label="Partner’s annual income (before tax)">
          <MoneyInput label="Partner income" value={i.partnerSalary} onChange={(v) => set("partnerSalary", v)} />
        </Field>
        <Field label="Partner’s bonus, commission & car allowance (per year)">
          <MoneyInput label="Partner bonus" value={i.partnerBonus} onChange={(v) => set("partnerBonus", v)} />
        </Field>
        <Field label="Partner’s pension contribution">
          <PercentInput value={i.partnerPensionPct} onChange={(v) => set("partnerPensionPct", v)} />
        </Field>
        <Field label="Partner’s expected pay rise each April">
          <PercentInput value={i.partnerPayRisePct} onChange={(v) => set("partnerPayRisePct", v)} />
        </Field>
        <Toggle checked={i.partnerSelfEmployed} onChange={(v) => set("partnerSelfEmployed", v)}>
          Partner is self-employed
        </Toggle>
        <Field label="Partner’s planned leave on statutory pay">
          <Choices
            name="partnerStatWeeks"
            value={String(i.partnerStatWeeks)}
            options={[
              { value: "0", label: "None" },
              { value: "2", label: "2 weeks paternity leave" },
              { value: "6", label: "6 weeks (paternity + shared leave)" },
              { value: "12", label: "12 weeks shared leave" },
            ]}
            onChange={(v) => set("partnerStatWeeks", Number(v))}
          />
        </Field>
      </>
    ),
  },
  {
    title: "Childcare",
    intro: "For when you go back. Funded hours and Tax-Free Childcare are worked out for you.",
    render: (i, set) => (
      <>
        <Field label="Expected childcare set-up">
          <Choices
            name="childcareSetup"
            value={i.childcareSetup}
            options={[
              { value: "nursery", label: "Nursery" },
              { value: "childminder", label: "Childminder" },
              { value: "nanny", label: "Nanny" },
              { value: "family", label: "Family / informal support only (£0 paid childcare)" },
            ]}
            onChange={(v) => set("childcareSetup", v)}
          />
        </Field>
        {i.childcareSetup !== "family" && (
          <>
            <Field label="Paid childcare days a week (on 5 days)">
              <Segmented
                label="Childcare days"
                options={[1, 2, 3, 4, 5].map((d) => ({ value: d, label: String(d) }))}
                value={i.childcareDays}
                onChange={(d) => set("childcareDays", d)}
              />
            </Field>
            <Field label="Daily rate" help="Full-day price. The UK nursery average is about £72.">
              <MoneyInput label="Daily rate" value={i.childcareDailyRate} onChange={(v) => set("childcareDailyRate", v)} />
            </Field>
            <Field label="If you drop working days, does paid childcare drop too?">
              <Choices
                name="childcareReduction"
                value={i.childcareReduction}
                options={[
                  { value: "minusOne", label: "Yes, by 1 day a week" },
                  { value: "noChange", label: "No, same days" },
                ]}
                onChange={(v) => set("childcareReduction", v)}
              />
            </Field>
            <Field label="Childcare start date (optional)" help="Leave blank to start the month you return.">
              <input className="input" type="date" value={i.childcareStart} onChange={(e) => set("childcareStart", e.target.value)} />
            </Field>
            <Toggle checked={i.useFundedHours} onChange={(v) => set("useFundedHours", v)}>
              Use 30 funded hours (England)
            </Toggle>
            <Toggle checked={i.useTaxFreeChildcare} onChange={(v) => set("useTaxFreeChildcare", v)}>
              Use Tax-Free Childcare
            </Toggle>
          </>
        )}
      </>
    ),
  },
  {
    title: "Money & boosts",
    intro: "This is what shows whether your leave is fully funded.",
    render: (i, set) => (
      <>
        <Field label="Monthly household bills & living costs" help="Rent or mortgage, bills, food, transport: everything except childcare.">
          <MoneyInput label="Monthly bills" value={i.monthlyBills} onChange={(v) => set("monthlyBills", v)} />
        </Field>
        <Field label="Dedicated parental leave savings pot (£)" help={POT_HELP}>
          <MoneyInput label="Dedicated parental leave savings pot (£)" value={i.savingsPot} onChange={(v) => set("savingsPot", v)} />
        </Field>
        <Field label={i.leaveType === "shared" ? "Planned SPLIT days" : "Planned KIT days"} help="Paid work days during leave at your normal day rate.">
          <NumberInput value={i.kitDays} min={0} max={i.leaveType === "shared" ? 20 : 10} suffix="days" onChange={(v) => set("kitDays", v)} />
        </Field>
        <Field label="Accrued holiday taken at the end of leave">
          <NumberInput value={i.holidayDays} min={0} max={25} suffix="days" onChange={(v) => set("holidayDays", v)} />
        </Field>
      </>
    ),
  },
  {
    title: "Going back & your letter",
    intro: "Optional. These fill in your flexible working request letter.",
    render: (i, set) => (
      <>
        <Field label="Working pattern you're leaning towards">
          <Choices
            name="returnPattern"
            value={i.returnPattern}
            options={(Object.keys(PATTERN_LABELS) as Pattern[]).map((p) => ({ value: p, label: PATTERN_LABELS[p] }))}
            onChange={(v) => set("returnPattern", v)}
          />
        </Field>
        <Field label="Monthly commuting saving with fewer office days">
          <MoneyInput label="Commuting saving" value={i.commuteSavingMonthly} onChange={(v) => set("commuteSavingMonthly", v)} />
        </Field>
        <Field label="Your full name">
          <input className="input" value={i.fullName} autoComplete="name" onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Manager’s name">
          <input className="input" value={i.managerName} onChange={(e) => set("managerName", e.target.value)} />
        </Field>
        <Field label="Job title">
          <input className="input" value={i.jobTitle} autoComplete="organization-title" onChange={(e) => set("jobTitle", e.target.value)} />
        </Field>
        <Field label="Contracted hours per week">
          <NumberInput value={i.contractHours} min={1} max={60} step={0.5} suffix="hours" onChange={(v) => set("contractHours", v)} />
        </Field>
        <Field label="Preferred non-working day">
          <select className="input" value={i.nonWorkingDay} onChange={(e) => set("nonWorkingDay", e.target.value as Weekday)}>
            {WEEKDAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Second non-working day (3-day week only)">
          <select className="input" value={i.secondNonWorkingDay} onChange={(e) => set("secondNonWorkingDay", e.target.value as Weekday | "")}>
            <option value="">Not needed</option>
            {WEEKDAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Days working from home now">
          <NumberInput value={i.wfhDays} min={0} max={5} suffix="days" onChange={(v) => set("wfhDays", v)} />
        </Field>
        <Field label="Proposed flexible working start date (optional)" help="Leave blank to use your return-to-work date.">
          <input className="input" type="date" value={i.proposedFlexStart} onChange={(e) => set("proposedFlexStart", e.target.value)} />
        </Field>
        <Field label="Team or department (optional)">
          <input className="input" value={i.team} onChange={(e) => set("team", e.target.value)} />
        </Field>
        <Field label="Workload handover note (optional)" help="One sentence on how cover could work.">
          <textarea className="input" rows={2} value={i.handoverNote} maxLength={400} onChange={(e) => set("handoverNote", e.target.value)} />
        </Field>
        <Toggle checked={i.previousRequest} onChange={(v) => set("previousRequest", v)}>
          I made a statutory flexible working request in the last 12 months
        </Toggle>
      </>
    ),
  },
];

export function IntakeWizard() {
  const router = useRouter();
  const [intake, setIntake] = useState<Intake>(DEFAULT_INTAKE);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadIntake();
    if (saved) setIntake(saved);
  }, []);

  const set: Setter = (key, value) => {
    setIntake((prev) => {
      const next = { ...prev, [key]: value };
      saveIntake(next);
      return next;
    });
    setError(null);
  };

  const visible = STEPS.map((s, idx) => ({ s, idx })).filter(({ s }) => !s.skip?.(intake));
  const pos = Math.max(0, visible.findIndex((v) => v.idx === step));
  const current = visible[pos]?.s ?? STEPS[0];
  const last = pos === visible.length - 1;

  function next() {
    const problem = current.valid?.(intake) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    saveIntake(intake);
    if (last) {
      router.push("/preview");
      return;
    }
    setStep(visible[pos + 1].idx);
    window.scrollTo({ top: 0 });
  }

  function back() {
    if (pos === 0) router.push("/");
    else {
      setStep(visible[pos - 1].idx);
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <main className="wizard">
      <div className="row between">
        <span className="brand">LeavePath</span>
        <span className="small muted">
          Step {pos + 1} of {visible.length}
        </span>
      </div>
      <div className="progress-line" style={{ margin: "14px 0 24px" }} aria-hidden="true">
        <span style={{ width: `${((pos + 1) / visible.length) * 100}%` }} />
      </div>
      <h1 className="display" style={{ fontSize: 30, margin: "0 0 6px" }}>
        {current.title}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {current.intro}
      </p>
      <div className="stack" style={{ gap: 20, marginTop: 20 }}>
        {current.render(intake, set)}
      </div>
      {error && (
        <p role="alert" className="pill warn" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}
      <div className="wizard-foot">
        <div className="row">
          <button type="button" className="btn ghost" onClick={back}>
            Back
          </button>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={next}>
            {last ? "See my plan" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

/* ───────── Field helpers ───────── */

function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}

function Choices<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="stack" style={{ gap: 8 }} role="radiogroup">
      {options.map((o) => (
        <label key={o.value} className="choice">
          <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="row">
      <input
        className="input num"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
        style={{ maxWidth: 140 }}
      />
      {suffix && <span className="muted">{suffix}</span>}
    </div>
  );
}

function PercentInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="row">
      <input
        className="input num"
        type="number"
        inputMode="decimal"
        min={0}
        max={60}
        step={0.5}
        value={Math.round(value * 1000) / 10}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.min(60, Math.max(0, n)) / 100 : 0);
        }}
        style={{ maxWidth: 140 }}
      />
      <span className="muted">%</span>
    </div>
  );
}
