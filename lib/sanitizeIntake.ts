import type { StudentLoanPlan } from "./rates";
import {
  DEFAULT_INTAKE,
  type Intake,
  type PayLevel,
  type PolicyBand,
  type Scenario,
} from "./types";

/**
 * Server-side guard for anything posted by the browser. Unknown keys are
 * dropped, numbers are clamped and enums are whitelisted, so a tampered
 * request can't store junk or break the calculator.
 */

type Raw = Record<string, unknown>;

const num = (v: unknown, lo: number, hi: number, fallback: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};
const str = (v: unknown, max = 200): string =>
  typeof v === "string" ? v.slice(0, max) : "";
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;
const bool = (v: unknown, fallback: boolean): boolean =>
  typeof v === "boolean" ? v : fallback;
const isoDate = (v: unknown, fallback: string): string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
    ? v
    : fallback;
const optionalDate = (v: unknown): string => (v === "" ? "" : isoDate(v, ""));

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const LEVELS: readonly PayLevel[] = ["full", "pct", "halfSmp", "smp", "unpaid"];
const LOANS: readonly StudentLoanPlan[] = ["none", "plan1", "plan2", "plan4", "plan5", "postgrad"];

export function sanitizeIntake(input: unknown): Intake {
  const r = (input && typeof input === "object" ? input : {}) as Raw;
  const d = DEFAULT_INTAKE;
  const policy: PolicyBand[] = Array.isArray(r.policy)
    ? (r.policy as Raw[]).slice(0, 6).map((b) => ({
        weeks: num(b?.weeks, 0, 104, 0),
        level: oneOf(b?.level, LEVELS, "smp"),
        pct: num(b?.pct, 0, 1, 1),
      }))
    : d.policy;
  return {
    firstName: str(r.firstName, 40),
    stage: oneOf(r.stage, ["thinking", "pregnant", "sharing", "returning"] as const, d.stage),
    leaveType: oneOf(r.leaveType, ["maternity", "adoption", "shared"] as const, d.leaveType),
    weeksUsedByOtherParent: num(r.weeksUsedByOtherParent, 0, 39, 0),
    household: oneOf(r.household, ["two", "solo"] as const, d.household),
    leaveStart: isoDate(r.leaveStart, d.leaveStart),
    babyDate: isoDate(r.babyDate, d.babyDate),
    leaveWeeks: num(r.leaveWeeks, 4, 104, d.leaveWeeks),
    salaryYear: num(r.salaryYear, 2026, 2030, 2026),
    salary: num(r.salary, 0, 2_000_000, 0),
    bonus: num(r.bonus, 0, 2_000_000, 0),
    pensionPct: num(r.pensionPct, 0, 0.6, 0),
    payRisePct: num(r.payRisePct, 0, 0.2, 0),
    studentLoan: oneOf(r.studentLoan, LOANS, "none"),
    policy,
    partnerSalary: num(r.partnerSalary, 0, 2_000_000, 0),
    partnerBonus: num(r.partnerBonus, 0, 2_000_000, 0),
    partnerPensionPct: num(r.partnerPensionPct, 0, 0.6, 0),
    partnerSelfEmployed: bool(r.partnerSelfEmployed, false),
    partnerPayRisePct: num(r.partnerPayRisePct, 0, 0.2, 0),
    partnerStatWeeks: num(r.partnerStatWeeks, 0, 39, 0),
    childcareSetup: oneOf(r.childcareSetup, ["nursery", "childminder", "nanny", "family"] as const, d.childcareSetup),
    childcareDays: num(r.childcareDays, 1, 5, 3),
    childcareDailyRate: num(r.childcareDailyRate, 0, 500, 0),
    childcareReduction: oneOf(r.childcareReduction, ["minusOne", "noChange"] as const, "minusOne"),
    childcareStart: optionalDate(r.childcareStart),
    useFundedHours: bool(r.useFundedHours, true),
    useTaxFreeChildcare: bool(r.useTaxFreeChildcare, true),
    returnPattern: oneOf(r.returnPattern, ["full", "four", "compressed", "three"] as const, "full"),
    commuteSavingMonthly: num(r.commuteSavingMonthly, 0, 5_000, 0),
    monthlyBills: num(r.monthlyBills, 0, 100_000, 0),
    savingsPot: num(r.savingsPot, 0, 1_000_000, 0),
    kitDays: num(r.kitDays, 0, 20, 0),
    holidayDays: num(r.holidayDays, 0, 40, 0),
    fullName: str(r.fullName, 80),
    managerName: str(r.managerName, 80),
    jobTitle: str(r.jobTitle, 120),
    contractHours: num(r.contractHours, 1, 60, 37.5),
    nonWorkingDay: oneOf(r.nonWorkingDay, WEEKDAYS, "Friday"),
    secondNonWorkingDay: r.secondNonWorkingDay === "" ? "" : oneOf(r.secondNonWorkingDay, WEEKDAYS, "Thursday"),
    wfhDays: num(r.wfhDays, 0, 5, 0),
    previousRequest: bool(r.previousRequest, false),
    team: str(r.team, 120),
    handoverNote: str(r.handoverNote, 400),
    proposedFlexStart: optionalDate(r.proposedFlexStart),
  };
}

export function sanitizeScenario(input: unknown): Scenario {
  const r = (input && typeof input === "object" ? input : {}) as Raw;
  const s: Scenario = {};
  if (r.leaveWeeks !== undefined) s.leaveWeeks = num(r.leaveWeeks, 4, 104, 52);
  if (r.savingsPot !== undefined) s.savingsPot = num(r.savingsPot, 0, 1_000_000, 0);
  if (r.kitDays !== undefined) s.kitDays = num(r.kitDays, 0, 20, 0);
  if (r.holidayDays !== undefined) s.holidayDays = num(r.holidayDays, 0, 40, 0);
  if (r.childcareDays !== undefined) s.childcareDays = num(r.childcareDays, 1, 5, 3);
  if (r.returnPattern !== undefined)
    s.returnPattern = oneOf(r.returnPattern, ["full", "four", "compressed", "three"] as const, "full");
  if (r.applyPensionFix !== undefined) s.applyPensionFix = bool(r.applyPensionFix, false);
  return s;
}
