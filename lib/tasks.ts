import type { PhaseId } from "./leaveCalculator";
import type { Intake } from "./types";

export interface PlanTask {
  id: string;
  phase: PhaseId;
  title: string;
  detail: string;
  kind: "money" | "hr" | "childcare";
}

/**
 * Key money and HR tasks for each phase. Task ids are stable: checked
 * state is stored in `plans.task_checks` as `{ [id]: true }`.
 */
export function tasksFor(intake: Intake): PlanTask[] {
  const maternity = intake.leaveType === "maternity";
  const shared = intake.leaveType === "shared";
  const paidCare = intake.childcareSetup !== "family";
  const t: PlanTask[] = [
    // Before leave
    maternity && {
      id: "before-matb1",
      phase: "before",
      kind: "hr",
      title: "Give notice and your MATB1",
      detail:
        "Tell your employer by the 15th week before your due date, with your MATB1 form, so SMP and enhanced pay start on time.",
    },
    shared && {
      id: "before-spl-notice",
      phase: "before",
      kind: "hr",
      title: "Book your Shared Parental Leave",
      detail: "Send your notice of entitlement and booking at least 8 weeks before each block starts.",
    },
    {
      id: "before-policy",
      phase: "before",
      kind: "hr",
      title: "Get your pay policy in writing",
      detail: "Confirm how many weeks of enhanced pay you get, and whether any of it is repayable if you don't return.",
    },
    {
      id: "before-fund",
      phase: "before",
      kind: "money",
      title: "Ring-fence your dedicated leave fund",
      detail: "Move it to a separate easy-access savings pot so it isn't mixed with emergency money.",
    },
    {
      id: "before-pension",
      phase: "before",
      kind: "money",
      title: "Check pension contributions on leave",
      detail: "Your employer must keep paying pension contributions on your normal pay during paid leave. Ask how salary sacrifice works while you're on SMP.",
    },
    paidCare && {
      id: "before-waitlist",
      phase: "before",
      kind: "childcare",
      title: "Join childcare waiting lists",
      detail: "Popular nurseries and childminders fill a year ahead. Ask about consumables charges on funded days.",
    },
    // Company pay
    {
      id: "company-child-benefit",
      phase: "company",
      kind: "money",
      title: "Claim Child Benefit",
      detail: "Claim within 3 months of the birth. Even if you opt out of payments, claiming protects your State Pension credits.",
    },
    {
      id: "company-register",
      phase: "company",
      kind: "hr",
      title: "Register the birth",
      detail: "Within 42 days in England and Wales. You'll need the birth certificate for some benefit claims.",
    },
    {
      id: "company-kit-plan",
      phase: "company",
      kind: "hr",
      title: "Agree KIT day pay with your manager",
      detail: shared
        ? "Up to 20 SPLIT days on Shared Parental Leave. Agree the day rate before you work any."
        : "Up to 10 KIT days. Agree the day rate before you work any. Some employers only top up to your normal pay.",
    },
    // Statutory
    paidCare && {
      id: "statutory-tfc",
      phase: "statutory",
      kind: "childcare",
      title: "Open a Tax-Free Childcare account",
      detail: "Apply on GOV.UK. The government adds £2 for every £8 you pay in, up to £2,000 a year per child.",
    },
    paidCare && {
      id: "statutory-funded-code",
      phase: "statutory",
      kind: "childcare",
      title: "Apply for your funded hours code",
      detail: "Apply up to 3 months before the term your child becomes eligible, then give the code to your provider.",
    },
    {
      id: "statutory-flex",
      phase: "statutory",
      kind: "hr",
      title: "Send your flexible working request",
      detail: "Send it about 3 months before you return. Your employer has 2 months to decide, including any appeal.",
    },
    {
      id: "statutory-budget",
      phase: "statutory",
      kind: "money",
      title: "Switch to your lower-income budget",
      detail: "Pause non-essential subscriptions and set up a monthly transfer from your dedicated leave fund.",
    },
    // Unpaid
    {
      id: "unpaid-kit",
      phase: "unpaid",
      kind: "money",
      title: "Use your KIT days in the unpaid weeks",
      detail: "KIT days are worth most here, where you'd otherwise get no pay at all.",
    },
    {
      id: "unpaid-holiday",
      phase: "unpaid",
      kind: "hr",
      title: "Book your accrued holiday",
      detail: "Holiday builds up during leave. Taking it at the end swaps unpaid days for full pay.",
    },
    {
      id: "unpaid-return-date",
      phase: "unpaid",
      kind: "hr",
      title: "Confirm your return date",
      detail: "You need to give 8 weeks' notice if you want to come back earlier than planned.",
    },
    // Return
    paidCare && {
      id: "return-settling",
      phase: "return",
      kind: "childcare",
      title: "Book settling-in sessions",
      detail: "Most providers want 1–2 weeks of short sessions before your first full day back.",
    },
    {
      id: "return-payslip",
      phase: "return",
      kind: "money",
      title: "Check your first payslip",
      detail: "Make sure your salary, tax code and pension contributions are back to normal (or pro rata).",
    },
    paidCare && {
      id: "return-reconfirm",
      phase: "return",
      kind: "childcare",
      title: "Reconfirm childcare support every 3 months",
      detail: "Funded hours codes and Tax-Free Childcare stop if you miss the 3-monthly reconfirmation.",
    },
    {
      id: "return-review",
      phase: "return",
      kind: "hr",
      title: "Review your pattern after 3 months",
      detail: "Book a check-in with your manager to see how the new arrangement is working.",
    },
  ].filter(Boolean) as PlanTask[];
  return t;
}
