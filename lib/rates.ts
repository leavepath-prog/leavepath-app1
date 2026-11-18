/**
 * HMRC & statutory rates for England, Wales & Northern Ireland.
 *
 * Mirrors the `HMRC_Rates_2026_28` tab of the LeavePath master sheet.
 * 2026/27 figures are official; later years copy the year before
 * (thresholds are frozen to April 2031). Update one entry when a new
 * rate is confirmed.
 */

export interface TaxYearRates {
  label: string; // "2026/27"
  startYear: number; // 2026 → year starts 6 April 2026
  personalAllowance: number;
  paTaperStart: number;
  paTaperRate: number; // allowance lost per £1 over the taper start
  basicRateBand: number;
  additionalRateThreshold: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;
  niPrimaryThreshold: number;
  niUpperEarningsLimit: number;
  niMainRate: number;
  niUpperRate: number;
  class4MainRate: number;
  class4UpperRate: number;
  smpEarningsPct: number; // weeks 1–6
  smpWeeklyRate: number; // weeks 7–39 (and ShPP / SAP flat rate)
  smpWeeks: number;
  childBenefitWeekly: number; // eldest / only child
  hicbcStart: number;
  hicbcPer1Pct: number;
  childcareCliff: number;
  tfcTopUpPct: number; // share of the nursery bill the government pays
  tfcMaxPerYear: number;
  fundedFullDaysPerWeek: number; // 30 hrs × 38 wks ÷ 10-hr day ÷ 51 wks
  consumablesPerFundedDay: number;
}

const BASE_2026: Omit<TaxYearRates, "label" | "startYear"> = {
  personalAllowance: 12_570,
  paTaperStart: 100_000,
  paTaperRate: 0.5,
  basicRateBand: 37_700,
  additionalRateThreshold: 125_140,
  basicRate: 0.2,
  higherRate: 0.4,
  additionalRate: 0.45,
  niPrimaryThreshold: 12_570,
  niUpperEarningsLimit: 50_270,
  niMainRate: 0.08,
  niUpperRate: 0.02,
  class4MainRate: 0.06,
  class4UpperRate: 0.02,
  smpEarningsPct: 0.9,
  smpWeeklyRate: 194.32,
  smpWeeks: 39,
  childBenefitWeekly: 27.05,
  hicbcStart: 60_000,
  hicbcPer1Pct: 200,
  childcareCliff: 100_000,
  tfcTopUpPct: 0.2,
  tfcMaxPerYear: 2_000,
  fundedFullDaysPerWeek: (1140 / 10) / 51, // ≈ 2.235
  consumablesPerFundedDay: 12,
};

export const TAX_YEARS: TaxYearRates[] = [2026, 2027, 2028, 2029, 2030].map(
  (y) => ({
    ...BASE_2026,
    label: `${y}/${String(y + 1).slice(2)}`,
    startYear: y,
  }),
);

/** Rates for a tax year; years outside the table use the nearest one. */
export function ratesFor(startYear: number): TaxYearRates {
  const first = TAX_YEARS[0];
  const last = TAX_YEARS[TAX_YEARS.length - 1];
  if (startYear <= first.startYear) return first;
  if (startYear >= last.startYear) return last;
  return TAX_YEARS.find((t) => t.startYear === startYear) ?? last;
}

export type StudentLoanPlan =
  | "none"
  | "plan1"
  | "plan2"
  | "plan4"
  | "plan5"
  | "postgrad";

export const STUDENT_LOAN_LABELS: Record<StudentLoanPlan, string> = {
  none: "None / Paid off",
  plan1: "Started uni before Sept 2012 (Plan 1)",
  plan2: "Started uni Sept 2012 – July 2023 (Plan 2)",
  plan5: "Started uni Aug 2023 or later (Plan 5)",
  plan4: "Scottish student loan (Plan 4)",
  postgrad: "Postgraduate loan",
};

/** Yearly repayment thresholds by tax-year start, plus the rate on pay above it. */
const STUDENT_LOANS: Record<
  StudentLoanPlan,
  { rate: number; thresholds: Record<number, number> }
> = {
  none: { rate: 0, thresholds: {} },
  plan1: { rate: 0.09, thresholds: { 2026: 26_900, 2027: 28_005 } },
  plan2: { rate: 0.09, thresholds: { 2026: 29_385, 2027: 29_385 } },
  plan5: { rate: 0.09, thresholds: { 2026: 25_000, 2027: 26_025 } },
  plan4: { rate: 0.09, thresholds: { 2026: 33_795, 2027: 33_795 } },
  postgrad: { rate: 0.06, thresholds: { 2026: 21_000, 2027: 21_000 } },
};

export function studentLoanTerms(
  plan: StudentLoanPlan,
  startYear: number,
): { rate: number; threshold: number } {
  const p = STUDENT_LOANS[plan];
  if (p.rate === 0) return { rate: 0, threshold: 0 };
  const years = Object.keys(p.thresholds)
    .map(Number)
    .sort((a, b) => a - b);
  // Later years are held at the last confirmed figure.
  const yr = years.filter((y) => y <= startYear).pop() ?? years[0];
  return { rate: p.rate, threshold: p.thresholds[yr] };
}
