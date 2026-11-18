import type { StudentLoanPlan } from "./rates";

export type Stage = "thinking" | "pregnant" | "sharing" | "returning";
export type LeaveType = "maternity" | "adoption" | "shared";
export type Household = "two" | "solo";
export type ChildcareSetup =
  | "nursery"
  | "childminder"
  | "nanny"
  | "family";
export type ChildcareReduction = "minusOne" | "noChange";
export type Pattern = "full" | "four" | "compressed" | "three";
export type PayLevel = "full" | "pct" | "halfSmp" | "smp" | "unpaid";
export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export const STAGE_LABELS: Record<Stage, string> = {
  thinking: "Thinking ahead / Trying to conceive",
  pregnant: "Pregnant or already on leave",
  sharing: "Sharing leave / Partner / Adoption leave",
  returning: "Returning to work / Exploring flexible working",
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  full: "5 Days Full-Time",
  four: "4 Days at 80%",
  compressed: "Compressed 4 Days",
  three: "3 Days at 60%",
};

/** One row of the employer's maternity / parental pay policy. */
export interface PolicyBand {
  weeks: number;
  level: PayLevel;
  /** Only for level "pct": share of normal pay, e.g. 0.75. */
  pct?: number;
}

/** Everything collected by the intake wizard. Dates are ISO yyyy-mm-dd. */
export interface Intake {
  firstName: string;
  stage: Stage;
  leaveType: LeaveType;
  /** Shared Parental Leave only: statutory weeks already used by the other parent (0–39). */
  weeksUsedByOtherParent: number;
  household: Household;

  leaveStart: string;
  babyDate: string;
  leaveWeeks: number; // 4–104

  /** Tax year your salary figures are for, by its start year (2026 = 2026/27). */
  salaryYear: number;
  salary: number;
  bonus: number;
  pensionPct: number; // salary sacrifice, 0.05 = 5%
  payRisePct: number; // each April
  studentLoan: StudentLoanPlan;
  policy: PolicyBand[];

  partnerSalary: number;
  partnerBonus: number;
  partnerPensionPct: number;
  partnerSelfEmployed: boolean;
  partnerPayRisePct: number;
  /** Partner weeks on statutory pay around the birth (0 none, 2 paternity, more for SPL). */
  partnerStatWeeks: number;

  childcareSetup: ChildcareSetup;
  childcareDays: number; // paid days a week, 1–5
  childcareDailyRate: number;
  childcareReduction: ChildcareReduction;
  /** First day of paid childcare. Blank = the 1st of the month you return. */
  childcareStart: string;
  useFundedHours: boolean;
  useTaxFreeChildcare: boolean;

  returnPattern: Pattern;
  commuteSavingMonthly: number;

  monthlyBills: number;
  savingsPot: number; // Dedicated parental leave savings pot (£)
  kitDays: number; // 0–10
  holidayDays: number; // 0–25

  // Flexible working letter details
  fullName: string;
  managerName: string;
  jobTitle: string;
  contractHours: number;
  nonWorkingDay: Weekday;
  secondNonWorkingDay: Weekday | "";
  wfhDays: number;
  previousRequest: boolean;
  team: string;
  handoverNote: string;
  /** Blank = use the return-to-work date. */
  proposedFlexStart: string;
}

/**
 * Sandbox overrides a logged-in user can change with sliders. Saved in
 * `plans.scenario`; anything left undefined falls back to the intake.
 */
export interface Scenario {
  leaveWeeks?: number;
  savingsPot?: number;
  kitDays?: number;
  holidayDays?: number;
  childcareDays?: number;
  returnPattern?: Pattern;
  applyPensionFix?: boolean;
}

export function applyScenario(intake: Intake, s: Scenario): Intake {
  const out: Intake = { ...intake };
  if (s.leaveWeeks !== undefined) out.leaveWeeks = s.leaveWeeks;
  if (s.savingsPot !== undefined) out.savingsPot = s.savingsPot;
  if (s.kitDays !== undefined) out.kitDays = s.kitDays;
  if (s.holidayDays !== undefined) out.holidayDays = s.holidayDays;
  if (s.childcareDays !== undefined) out.childcareDays = s.childcareDays;
  if (s.returnPattern !== undefined) out.returnPattern = s.returnPattern;
  return out;
}

export const DEFAULT_INTAKE: Intake = {
  firstName: "",
  stage: "pregnant",
  leaveType: "maternity",
  weeksUsedByOtherParent: 0,
  household: "two",
  leaveStart: "2027-05-14",
  babyDate: "2027-06-01",
  leaveWeeks: 52,
  salaryYear: 2026,
  salary: 89_250,
  bonus: 6_000,
  pensionPct: 0.02,
  payRisePct: 0.03,
  studentLoan: "none",
  policy: [
    { weeks: 16, level: "full" },
    { weeks: 23, level: "smp" },
  ],
  partnerSalary: 40_000,
  partnerBonus: 0,
  partnerPensionPct: 0.05,
  partnerSelfEmployed: false,
  partnerPayRisePct: 0.03,
  partnerStatWeeks: 2,
  childcareSetup: "nursery",
  childcareDays: 3,
  childcareDailyRate: 75,
  childcareReduction: "minusOne",
  childcareStart: "",
  useFundedHours: true,
  useTaxFreeChildcare: true,
  returnPattern: "full",
  commuteSavingMonthly: 0,
  monthlyBills: 3_800,
  savingsPot: 10_000,
  kitDays: 5,
  holidayDays: 15,
  fullName: "",
  managerName: "",
  jobTitle: "",
  contractHours: 37.5,
  nonWorkingDay: "Friday",
  secondNonWorkingDay: "",
  wfhDays: 2,
  previousRequest: false,
  team: "",
  handoverNote: "",
  proposedFlexStart: "",
};
