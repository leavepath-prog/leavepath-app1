/**
 * LeavePath calculation engine.
 *
 * Pure functions, no I/O: the same code runs in the browser (live sliders),
 * on the server (locked preview, PDF snapshot) and in unit tests.
 *
 * Method (mirrors the LeavePath master sheet):
 *  - Pay is modelled day by day, so each calendar month and each tax year
 *    gets the right mix of working, leave and back-at-work days.
 *  - Income tax and NI are worked out per tax year on the whole year's pay,
 *    then shared across that year's months in proportion to their pay.
 *  - Student loan is taken monthly on pay above the threshold ÷ 12.
 *  - Funded hours and Tax-Free Childcare are lost in any tax year where
 *    either parent's adjusted net income is over £100,000.
 */

import {
  ratesFor,
  studentLoanTerms,
  type TaxYearRates,
} from "./rates";
import {
  addMonths,
  dayNum,
  daysInMonth,
  edate,
  fmtMonth,
  fromParts,
  monthStart,
  parts,
  taxYearBounds,
  taxYearLabel,
  taxYearOf,
  todayDay,
} from "./dates";
import {
  applyScenario,
  type Intake,
  type Pattern,
  type PayLevel,
  type Scenario,
  type Stage,
} from "./types";

// ───────────────────────────── Tax primitives ─────────────────────────────

/** Income tax on taxable pay for a year, with the £100k allowance taper. */
export function incomeTax(taxable: number, ani: number, r: TaxYearRates): number {
  if (taxable <= 0) return 0;
  const taper = Math.max(0, ani - r.paTaperStart) * r.paTaperRate;
  const pa = Math.max(0, r.personalAllowance - taper);
  const income = Math.max(0, taxable - pa);
  const basic = Math.min(income, r.basicRateBand);
  const higherBand = Math.max(0, r.additionalRateThreshold - pa - r.basicRateBand);
  const higher = Math.min(Math.max(0, income - r.basicRateBand), higherBand);
  const additional = Math.max(0, income - r.basicRateBand - higherBand);
  return basic * r.basicRate + higher * r.higherRate + additional * r.additionalRate;
}

/** Employee Class 1 NI (or Class 4 if self-employed) for a year. */
export function nationalInsurance(
  pay: number,
  r: TaxYearRates,
  selfEmployed = false,
): number {
  const main = selfEmployed ? r.class4MainRate : r.niMainRate;
  const upper = selfEmployed ? r.class4UpperRate : r.niUpperRate;
  const mainBand = Math.max(
    0,
    Math.min(pay, r.niUpperEarningsLimit) - r.niPrimaryThreshold,
  );
  const upperBand = Math.max(0, pay - r.niUpperEarningsLimit);
  return mainBand * main + upperBand * upper;
}

/** Tax + NI on a year's pay after salary sacrifice (ANI = pay after sacrifice). */
export function taxAndNi(
  payAfterSacrifice: number,
  r: TaxYearRates,
  selfEmployed = false,
): number {
  return (
    incomeTax(payAfterSacrifice, payAfterSacrifice, r) +
    nationalInsurance(payAfterSacrifice, r, selfEmployed)
  );
}

/** Share of the next £1 kept after tax and NI at a given yearly income. */
export function marginalKeep(pay: number, r: TaxYearRates): number {
  const step = 1_000;
  return 1 - (taxAndNi(pay + step, r) - taxAndNi(pay, r)) / step;
}

// ───────────────────────────── Result types ─────────────────────────────

export type MonthPhase = "leave" | "back";

export interface MonthRow {
  start: number; // day number of the 1st
  label: string; // "May 2027"
  phase: MonthPhase;
  taxYear: string;
  daysOnLeave: number;
  daysBack: number;
  yourGross: number;
  yourTakeHome: number; // after tax, NI, pension and student loan
  studentLoan: number;
  partnerTakeHome: number;
  childBenefit: number;
  hicbc: number;
  commuteSaved: number;
  income: number;
  childcareFees: number;
  fundedSaving: number;
  tfcTopUp: number;
  childcarePaid: number;
  bills: number;
  surplus: number;
  /** Dedicated leave fund left after covering each dip on leave. */
  fundBalance: number;
}

export interface WeekPay {
  week: number;
  start: number;
  gross: number;
  kind: "company" | "statutory" | "unpaid";
}

export type PhaseId = "before" | "company" | "statutory" | "unpaid" | "return";

export interface Phase {
  id: PhaseId;
  title: string;
  start: number;
  end: number;
  /** Average monthly surplus/shortfall after bills and childcare. */
  monthlyNet: number;
  /** Average monthly household income after tax. */
  monthlyIncome: number;
  weeks?: [number, number];
}

export interface PatternResult {
  pattern: Pattern;
  workDays: number;
  payPct: number;
  salary: number;
  monthlyCash: number;
  diffVsFull: number;
  extraDaysOff: number;
  impactPerDay: number | null;
  childcareDays: number;
  keepsChildcareSupport: boolean;
  fundedSavingYear: number;
  tfcYear: number;
  isBest: boolean;
}

export interface CliffParent {
  who: "you" | "partner";
  ani: number;
  over: boolean;
  fixAnnual: number;
  fixMonthly: number;
}

export interface CliffCheck {
  taxYear: string;
  parents: CliffParent[];
  anyOver: boolean;
  /** Funded hours + Tax-Free Childcare a year that the pension fix protects. */
  childcareAtStake: number;
  /** Extra take-home lost to the bigger pension contribution (after tax relief). */
  netCostOfFix: number;
  fixApplied: boolean;
}

export interface Boosts {
  kitDays: number;
  kitNet: number;
  holidayDays: number;
  holidayNet: number;
  total: number;
}

export interface PotStatus {
  savingsPot: number;
  peakDrawdown: number;
  boosts: number;
  remaining: number;
  /** Monthly amount to save before leave starts, if short. */
  saveMonthly: number;
  monthsToSave: number;
  state: "funded" | "safe" | "save" | "gap";
  pill: string;
  lowestMonth: string | null;
}

export interface Verdict {
  tone: "good" | "warn";
  headline: string;
  detail: string;
}

export interface PlanResult {
  intake: Intake;
  leaveStart: number;
  returnDate: number;
  babyDate: number;
  awe: number;
  statWeeksAvailable: number;
  weeks: WeekPay[];
  months: MonthRow[];
  baseline: { you: number; partner: number; total: number; taxYear: string };
  boosts: Boosts;
  pot: PotStatus;
  phases: Phase[];
  patterns: PatternResult[];
  cliff: CliffCheck;
  fundedHoursFrom: number;
  backAtWorkMonthly: number;
  verdict: Verdict;
  firstFullYearBack: string;
}

export interface CalcOptions {
  /** "Today" as a day number; defaults to the real date. */
  today?: number;
}

// ───────────────────────────── Engine ─────────────────────────────

const PATTERN_PAY: Record<Pattern, number> = {
  full: 1,
  four: 0.8,
  compressed: 1,
  three: 0.6,
};
const PATTERN_DAYS: Record<Pattern, number> = {
  full: 5,
  four: 4,
  compressed: 4,
  three: 3,
};
const WORKING_WEEKS_A_YEAR = 46.4; // after holidays and bank holidays

export function babyDateLabel(stage: Stage): string {
  switch (stage) {
    case "returning":
      return "Baby’s birth date";
    case "pregnant":
      return "Baby’s due date (or birth date if already born)";
    case "sharing":
      return "Baby’s due date / placement date (or birth date)";
    default:
      return "Target due date (estimate)";
  }
}

/** Term after the child turns 9 months: next 1 Jan, 1 Apr or 1 Sep. */
export function fundedHoursStart(babyDate: number): number {
  const nineMonths = edate(babyDate, 9);
  const { y } = parts(nineMonths);
  const candidates = [y, y + 1].flatMap((yr) => [
    fromParts(yr, 1, 1),
    fromParts(yr, 4, 1),
    fromParts(yr, 9, 1),
  ]);
  return Math.min(...candidates.filter((c) => c > nineMonths));
}

/** Paid childcare days a week for each working pattern. */
export function childcareDaysFor(intake: Intake, pattern: Pattern): number {
  const base = intake.childcareSetup === "family" ? 0 : intake.childcareDays;
  const r = intake.childcareReduction === "minusOne" ? 1 : 0;
  if (pattern === "full") return base;
  if (pattern === "three") return Math.max(0, base - (r === 0 ? 0 : r + 1));
  return Math.max(0, base - r);
}

export function calculatePlan(
  rawIntake: Intake,
  scenario: Scenario = {},
  opts: CalcOptions = {},
): PlanResult {
  const intake = applyScenario(rawIntake, scenario);
  const applyFix = !!scenario.applyPensionFix;
  const today = opts.today ?? todayDay();
  const twoParent = intake.household === "two";

  const leaveStart = dayNum(intake.leaveStart);
  const babyDate = dayNum(intake.babyDate || intake.leaveStart);
  const leaveWeeks = clamp(Math.round(intake.leaveWeeks), 4, 104);
  const returnDate = leaveStart + leaveWeeks * 7;
  const patternPct = PATTERN_PAY[intake.returnPattern];

  // ── Your pay ──
  const yourAnnual = (taxYear: number) =>
    (intake.salary + intake.bonus) *
    Math.pow(1 + intake.payRisePct, Math.max(0, taxYear - intake.salaryYear));
  const leaveTaxYear = taxYearOf(leaveStart);
  const leaveRates = ratesFor(leaveTaxYear);
  const awe = yourAnnual(leaveTaxYear) / 52;

  // ── Leave pay week by week ──
  const statWeeksAvailable =
    intake.leaveType === "shared"
      ? Math.max(0, leaveRates.smpWeeks - clamp(intake.weeksUsedByOtherParent, 0, 39))
      : leaveRates.smpWeeks;
  const flatFromWeekOne = intake.leaveType === "shared";
  const statutory = (w: number) => {
    if (w > statWeeksAvailable) return 0;
    if (!flatFromWeekOne && w <= 6) return leaveRates.smpEarningsPct * awe;
    return Math.min(leaveRates.smpWeeklyRate, leaveRates.smpEarningsPct * awe);
  };

  const weeks: WeekPay[] = [];
  const bands = intake.policy.filter((b) => b.weeks > 0);
  let w = 1;
  for (const band of bands) {
    for (let i = 0; i < band.weeks && w <= leaveWeeks; i++, w++) {
      weeks.push(weekPay(w, band.level, band.pct ?? 1));
    }
  }
  for (; w <= leaveWeeks; w++) {
    weeks.push(weekPay(w, w <= statWeeksAvailable ? "smp" : "unpaid", 1));
  }
  function weekPay(week: number, level: PayLevel, pct: number): WeekPay {
    const stat = statutory(week);
    let gross = 0;
    if (level === "full") gross = awe;
    else if (level === "pct") gross = Math.max(pct * awe, stat);
    else if (level === "halfSmp") gross = 0.5 * awe + stat;
    else if (level === "smp") gross = stat;
    const company = level === "full" || level === "pct" || level === "halfSmp";
    return {
      week,
      start: leaveStart + (week - 1) * 7,
      gross,
      kind: gross <= 0 ? "unpaid" : company && gross > stat + 0.005 ? "company" : "statutory",
    };
  }

  /** Your gross pay and the part of it that pension can be sacrificed from, for one day. */
  const yourDay = (day: number): { gross: number; sacrificable: number } => {
    if (day < leaveStart) {
      const g = yourAnnual(taxYearOf(day)) / 365;
      return { gross: g, sacrificable: g };
    }
    if (day < returnDate) {
      const wk = weeks[Math.floor((day - leaveStart) / 7)];
      const g = wk ? wk.gross / 7 : 0;
      return { gross: g, sacrificable: wk?.kind === "company" ? g : 0 };
    }
    const g = (yourAnnual(taxYearOf(day)) * patternPct) / 365;
    return { gross: g, sacrificable: g };
  };

  // ── Partner pay ──
  const partnerAnnual = (taxYear: number) =>
    twoParent
      ? (intake.partnerSalary + intake.partnerBonus) *
        Math.pow(1 + intake.partnerPayRisePct, Math.max(0, taxYear - intake.salaryYear))
      : 0;
  const partnerLeaveEnd =
    babyDate + (intake.partnerSelfEmployed ? 0 : intake.partnerStatWeeks) * 7;
  const partnerAwe = partnerAnnual(taxYearOf(babyDate)) / 52;
  const partnerStatWeekly = Math.min(
    ratesFor(taxYearOf(babyDate)).smpWeeklyRate,
    0.9 * partnerAwe,
  );
  const partnerDay = (day: number): { gross: number; sacrificable: number } => {
    if (!twoParent) return { gross: 0, sacrificable: 0 };
    if (day >= babyDate && day < partnerLeaveEnd) {
      return { gross: partnerStatWeekly / 7, sacrificable: 0 };
    }
    const g = partnerAnnual(taxYearOf(day)) / 365;
    return { gross: g, sacrificable: g };
  };

  // ── Tax-year summaries (whole year, even outside the timeline) ──
  interface YearSummary {
    label: string;
    rates: TaxYearRates;
    yourGross: number;
    yourSacrifice: number; // base pension + any fix
    yourFix: number;
    yourAniBeforeFix: number;
    yourTaxNi: number;
    partnerGross: number;
    partnerSacrifice: number;
    partnerFix: number;
    partnerAniBeforeFix: number;
    partnerTaxNi: number;
    childcareSupportAllowed: boolean;
    hicbcPct: number;
  }
  const yearCache = new Map<number, YearSummary>();
  const year = (startYear: number): YearSummary => {
    const hit = yearCache.get(startYear);
    if (hit) return hit;
    const rates = ratesFor(startYear);
    const [from, to] = taxYearBounds(startYear);
    let yg = 0, ys = 0, pg = 0, ps = 0;
    for (let d = from; d <= to; d++) {
      const y = yourDay(d);
      yg += y.gross;
      ys += y.sacrificable;
      const p = partnerDay(d);
      pg += p.gross;
      ps += p.sacrificable;
    }
    const yourBaseSacrifice = ys * intake.pensionPct;
    const partnerBaseSacrifice = ps * intake.partnerPensionPct;
    const yourAni = yg - yourBaseSacrifice;
    const partnerAni = pg - partnerBaseSacrifice;
    const cliff = rates.childcareCliff;
    const yourFix = applyFix ? Math.max(0, yourAni - cliff) : 0;
    const partnerFix =
      applyFix && !intake.partnerSelfEmployed ? Math.max(0, partnerAni - cliff) : 0;
    const yAfter = yourAni - yourFix;
    const pAfter = partnerAni - partnerFix;
    const summary: YearSummary = {
      label: taxYearLabel(startYear),
      rates,
      yourGross: yg,
      yourSacrifice: yourBaseSacrifice + yourFix,
      yourFix,
      yourAniBeforeFix: yourAni,
      yourTaxNi: taxAndNi(yAfter, rates),
      partnerGross: pg,
      partnerSacrifice: partnerBaseSacrifice + partnerFix,
      partnerFix,
      partnerAniBeforeFix: partnerAni,
      partnerTaxNi: taxAndNi(pAfter, rates, intake.partnerSelfEmployed),
      childcareSupportAllowed: yAfter <= cliff && pAfter <= cliff,
      hicbcPct: clamp(
        (Math.max(yAfter, pAfter) - rates.hicbcStart) / rates.hicbcPer1Pct / 100,
        0,
        1,
      ),
    };
    yearCache.set(startYear, summary);
    return summary;
  };

  // ── Childcare set-up ──
  const fundedFrom = fundedHoursStart(babyDate);
  const childcareStart = intake.childcareStart
    ? dayNum(intake.childcareStart)
    : monthStart(returnDate);
  const dailyRate = intake.childcareDailyRate;
  const daysOnReturn = childcareDaysFor(intake, intake.returnPattern);
  const fundedSetup =
    intake.useFundedHours &&
    (intake.childcareSetup === "nursery" || intake.childcareSetup === "childminder");
  const tfcSetup = intake.useTaxFreeChildcare && intake.childcareSetup !== "family";

  // ── Month-by-month timeline: Month 1 = leave start month ──
  const firstMonth = monthStart(leaveStart);
  const lastMonth = addMonths(monthStart(returnDate), 11);
  const months: MonthRow[] = [];
  let fund = intake.savingsPot;
  for (let m = firstMonth; m <= lastMonth; m = addMonths(m, 1)) {
    const dim = daysInMonth(m);
    const end = m + dim - 1;
    const ty = year(taxYearOf(m + 14));
    let yg = 0, ys = 0, pg = 0, ps = 0, onLeave = 0, back = 0, cbDays = 0;
    for (let d = m; d <= end; d++) {
      const y = yourDay(d);
      yg += y.gross;
      ys += y.sacrificable;
      const p = partnerDay(d);
      pg += p.gross;
      ps += p.sacrificable;
      if (d >= leaveStart && d < returnDate) onLeave++;
      if (d >= returnDate) back++;
      if (d >= babyDate) cbDays++;
    }
    // Your take-home
    const yourFixShare = ty.yourGross > 0 ? ty.yourFix * (yg / ty.yourGross) : 0;
    const yourSac = ys * intake.pensionPct + yourFixShare;
    const yourAfterSac = yg - yourSac;
    const yourAfterSacYear = ty.yourGross - ty.yourSacrifice;
    const yourTaxNi =
      yourAfterSacYear > 0 ? ty.yourTaxNi * (yourAfterSac / yourAfterSacYear) : 0;
    const sl = studentLoanTerms(intake.studentLoan, taxYearOf(m + 14));
    const studentLoan = sl.rate * Math.max(0, yourAfterSac - sl.threshold / 12);
    const yourTakeHome = yourAfterSac - yourTaxNi - studentLoan;
    // Partner take-home
    const pFixShare = ty.partnerGross > 0 ? ty.partnerFix * (pg / ty.partnerGross) : 0;
    const pAfterSac = pg - ps * intake.partnerPensionPct - pFixShare;
    const pAfterSacYear = ty.partnerGross - ty.partnerSacrifice;
    const partnerTakeHome =
      pAfterSac - (pAfterSacYear > 0 ? ty.partnerTaxNi * (pAfterSac / pAfterSacYear) : 0);
    // Child Benefit
    const childBenefit = (ty.rates.childBenefitWeekly / 7) * cbDays;
    const hicbc = childBenefit * ty.hicbcPct;
    const commuteSaved =
      intake.returnPattern === "full" ? 0 : (intake.commuteSavingMonthly * back) / dim;
    const income = yourTakeHome + partnerTakeHome + childBenefit - hicbc + commuteSaved;
    // Childcare
    const childcareFees = m >= childcareStart ? daysOnReturn * dailyRate * (dim / 7) : 0;
    const supportOk = ty.childcareSupportAllowed && m >= returnDate - 31;
    const fundedSaving =
      fundedSetup && supportOk && m >= fundedFrom
        ? Math.min(
            childcareFees,
            Math.min(daysOnReturn, ty.rates.fundedFullDaysPerWeek) *
              Math.max(0, dailyRate - ty.rates.consumablesPerFundedDay) *
              (dim / 7),
          )
        : 0;
    const tfcTopUp =
      tfcSetup && supportOk
        ? Math.min(
            ty.rates.tfcTopUpPct * (childcareFees - fundedSaving),
            ty.rates.tfcMaxPerYear / 12,
          )
        : 0;
    const childcarePaid = childcareFees - fundedSaving - tfcTopUp;
    const surplus = income - childcarePaid - intake.monthlyBills;
    // The fund only pays out for dips while on leave; spare cash in good
    // months isn't assumed to be saved, so it never tops the fund up.
    if (onLeave > 0 && surplus < 0) fund += surplus;
    months.push({
      start: m,
      label: fmtMonth(m),
      phase: onLeave > 0 ? "leave" : "back",
      taxYear: ty.label,
      daysOnLeave: onLeave,
      daysBack: back,
      yourGross: yg,
      yourTakeHome,
      studentLoan,
      partnerTakeHome,
      childBenefit,
      hicbc,
      commuteSaved,
      income,
      childcareFees,
      fundedSaving,
      tfcTopUp,
      childcarePaid,
      bills: intake.monthlyBills,
      surplus,
      fundBalance: fund,
    });
  }

  // ── Current pre-leave baseline (a normal full year at leave-year pay) ──
  const baselineYou = (() => {
    const g = yourAnnual(leaveTaxYear);
    const after = g * (1 - intake.pensionPct);
    const sl = studentLoanTerms(intake.studentLoan, leaveTaxYear);
    const loan = sl.rate * Math.max(0, after - sl.threshold);
    return (after - taxAndNi(after, leaveRates) - loan) / 12;
  })();
  const baselinePartner = (() => {
    const g = partnerAnnual(leaveTaxYear);
    const after = g * (1 - intake.partnerPensionPct);
    return (after - taxAndNi(after, leaveRates, intake.partnerSelfEmployed)) / 12;
  })();

  // ── Cashflow boosts: KIT / SPLIT days and accrued holiday ──
  const keep = marginalKeep(year(leaveTaxYear).yourGross * (1 - intake.pensionPct), leaveRates);
  const dailyPay = (intake.salary * Math.pow(1 + intake.payRisePct, Math.max(0, leaveTaxYear - intake.salaryYear))) / 260;
  const maxKit = intake.leaveType === "shared" ? 20 : 10;
  const kitDays = clamp(intake.kitDays, 0, maxKit);
  const kitNet = kitDays * dailyPay * keep;
  const holidayDays = clamp(Math.min(intake.holidayDays, leaveWeeks * 5), 0, 40);
  const tailWeeks = Math.ceil(holidayDays / 5);
  const tail = weeks.slice(Math.max(0, weeks.length - tailWeeks));
  const leaveDaily = tail.length ? tail.reduce((s, x) => s + x.gross, 0) / tail.length / 5 : 0;
  const holidayNet = holidayDays * Math.max(0, dailyPay - leaveDaily) * keep;
  const boosts: Boosts = {
    kitDays,
    kitNet,
    holidayDays,
    holidayNet,
    total: kitNet + holidayNet,
  };

  // ── Dedicated leave fund: peak drawdown vs remaining buffer ──
  // Peak drawdown = everything the fund must cover across the lower-paid
  // and unpaid months (the sum of every month on leave that dips below
  // zero). Spare cash in full-pay months is NOT assumed to be saved, so
  // the fund is sized for the dips on their own (as in the master sheet).
  let peakDrawdown = 0;
  let lowest: MonthRow | null = null;
  for (const row of months) {
    if (row.phase !== "leave") continue;
    if (row.surplus < 0) peakDrawdown -= row.surplus;
    if (!lowest || row.surplus < lowest.surplus) lowest = row;
  }
  const remaining = intake.savingsPot + boosts.total - peakDrawdown;
  const monthsToSave = Math.max(
    1,
    (parts(leaveStart).y - parts(today).y) * 12 + (parts(leaveStart).m - parts(today).m),
  );
  const leaveAhead = leaveStart > today;
  let state: PotStatus["state"];
  let pill: string;
  let saveMonthly = 0;
  if (peakDrawdown === 0) {
    state = "funded";
    pill = "Fully funded • Income covers every month • Everyday savings untouched";
  } else if (remaining >= 0) {
    state = "safe";
    pill = `Buffer Safe • ${gbp(remaining)} left • Everyday savings untouched`;
  } else if (leaveAhead) {
    state = "save";
    saveMonthly = -remaining / monthsToSave;
    pill = `Save ${gbp(saveMonthly)} / month before leave starts`;
  } else {
    state = "gap";
    pill = `${gbp(-remaining)} gap to bridge • Consider KIT days or holiday`;
  }
  const pot: PotStatus = {
    savingsPot: intake.savingsPot,
    peakDrawdown,
    boosts: boosts.total,
    remaining,
    saveMonthly,
    monthsToSave,
    state,
    pill,
    lowestMonth: lowest && lowest.surplus < 0 ? lowest.label : null,
  };

  // ── Return-to-work pattern comparison (first full tax year back) ──
  const returnTaxYear = taxYearOf(returnDate);
  const y3 = returnTaxYear + 1;
  const y3Rates = ratesFor(y3);
  const [y3From, y3To] = taxYearBounds(y3);
  const fundedShare =
    clamp((y3To - Math.max(y3From, fundedFrom) + 1) / (y3To - y3From + 1), 0, 1);
  const partnerY3 = (() => {
    const g = partnerAnnual(y3);
    const ani = g * (1 - intake.partnerPensionPct);
    const fix =
      applyFix && !intake.partnerSelfEmployed ? Math.max(0, ani - y3Rates.childcareCliff) : 0;
    const after = ani - fix;
    return {
      ani,
      after,
      fix,
      net: after - taxAndNi(after, y3Rates, intake.partnerSelfEmployed),
    };
  })();
  const sl3 = studentLoanTerms(intake.studentLoan, y3);
  const patterns: PatternResult[] = (["full", "four", "compressed", "three"] as Pattern[]).map(
    (p) => {
      const salary = yourAnnual(y3) * PATTERN_PAY[p];
      const ani = salary * (1 - intake.pensionPct);
      const fix = applyFix ? Math.max(0, ani - y3Rates.childcareCliff) : 0;
      const after = ani - fix;
      const loan = sl3.rate * Math.max(0, after - sl3.threshold);
      const yourNet = after - taxAndNi(after, y3Rates) - loan;
      const keeps = after <= y3Rates.childcareCliff && partnerY3.after <= y3Rates.childcareCliff;
      const cb = y3Rates.childBenefitWeekly * 52;
      const hicbc =
        cb * clamp((Math.max(after, partnerY3.after) - y3Rates.hicbcStart) / y3Rates.hicbcPer1Pct / 100, 0, 1);
      const days = childcareDaysFor(intake, p);
      const fees = days * dailyRate * 52;
      const funded =
        fundedSetup && keeps
          ? Math.min(
              fees,
              Math.min(days, y3Rates.fundedFullDaysPerWeek) *
                Math.max(0, dailyRate - y3Rates.consumablesPerFundedDay) *
                52,
            ) * fundedShare
          : 0;
      const tfc =
        tfcSetup && keeps ? Math.min(y3Rates.tfcTopUpPct * (fees - funded), y3Rates.tfcMaxPerYear) : 0;
      const commute = p === "full" ? 0 : intake.commuteSavingMonthly * 12;
      const monthlyCash =
        (yourNet + partnerY3.net + cb - hicbc + commute - (fees - funded - tfc)) / 12;
      return {
        pattern: p,
        workDays: PATTERN_DAYS[p],
        payPct: PATTERN_PAY[p],
        salary,
        monthlyCash,
        diffVsFull: 0,
        extraDaysOff: Math.round((5 - PATTERN_DAYS[p]) * WORKING_WEEKS_A_YEAR),
        impactPerDay: null,
        childcareDays: days,
        keepsChildcareSupport: keeps,
        fundedSavingYear: funded,
        tfcYear: tfc,
        isBest: false,
      };
    },
  );
  const fullCash = patterns[0].monthlyCash;
  const bestCash = Math.max(...patterns.map((p) => p.monthlyCash));
  for (const p of patterns) {
    p.diffVsFull = p.monthlyCash - fullCash;
    p.impactPerDay = p.extraDaysOff > 0 ? (p.diffVsFull * 12) / p.extraDaysOff : null;
    p.isBest = p.monthlyCash === bestCash;
  }

  // ── £100k childcare cliff (first full year back, chosen pattern) ──
  const chosenSalary = yourAnnual(y3) * patternPct;
  const yourAniY3 = chosenSalary * (1 - intake.pensionPct);
  const cliffLimit = y3Rates.childcareCliff;
  const cliffParents: CliffParent[] = [
    {
      who: "you",
      ani: yourAniY3,
      over: yourAniY3 > cliffLimit,
      fixAnnual: Math.max(0, yourAniY3 - cliffLimit),
      fixMonthly: Math.max(0, yourAniY3 - cliffLimit) / 12,
    },
  ];
  if (twoParent) {
    cliffParents.push({
      who: "partner",
      ani: partnerY3.ani,
      over: partnerY3.ani > cliffLimit,
      fixAnnual: Math.max(0, partnerY3.ani - cliffLimit),
      fixMonthly: Math.max(0, partnerY3.ani - cliffLimit) / 12,
    });
  }
  const anyOver = cliffParents.some((c) => c.over);
  const chosenDays = childcareDaysFor(intake, intake.returnPattern);
  const feesY3 = chosenDays * dailyRate * 52;
  const fundedAtStake = fundedSetup
    ? Math.min(
        feesY3,
        Math.min(chosenDays, y3Rates.fundedFullDaysPerWeek) *
          Math.max(0, dailyRate - y3Rates.consumablesPerFundedDay) *
          52,
      ) * fundedShare
    : 0;
  const tfcAtStake = tfcSetup
    ? Math.min(y3Rates.tfcTopUpPct * (feesY3 - fundedAtStake), y3Rates.tfcMaxPerYear)
    : 0;
  const netCostOfFix = cliffParents.reduce((s, c) => {
    if (!c.over) return s;
    // Take-home lost = the sacrifice minus the tax and NI it saves.
    const before = c.ani - taxAndNi(c.ani, y3Rates);
    const after = cliffLimit - taxAndNi(cliffLimit, y3Rates);
    return s + (before - after);
  }, 0);
  const cliff: CliffCheck = {
    taxYear: taxYearLabel(y3),
    parents: cliffParents,
    anyOver,
    childcareAtStake: anyOver ? fundedAtStake + tfcAtStake : 0,
    netCostOfFix,
    fixApplied: applyFix,
  };

  // ── Phases for the Timeline view ──
  const phases = buildPhases(months, weeks, leaveStart, returnDate, baselineYou + baselinePartner - intake.monthlyBills, baselineYou + baselinePartner);

  const backRows = months.filter((r) => r.phase === "back" && r.daysBack === daysInMonth(r.start));
  const backAtWorkMonthly = backRows.length
    ? backRows.reduce((s, r) => s + r.surplus, 0) / backRows.length
    : 0;

  // ── Plain-English verdict ──
  const verdict = buildVerdict(intake, pot, backAtWorkMonthly, leaveStart);

  return {
    intake,
    leaveStart,
    returnDate,
    babyDate,
    awe,
    statWeeksAvailable,
    weeks,
    months,
    baseline: {
      you: baselineYou,
      partner: baselinePartner,
      total: baselineYou + baselinePartner,
      taxYear: taxYearLabel(leaveTaxYear),
    },
    boosts,
    pot,
    phases,
    patterns,
    cliff,
    fundedHoursFrom: fundedFrom,
    backAtWorkMonthly,
    verdict,
    firstFullYearBack: taxYearLabel(y3),
  };
}

function buildPhases(
  months: MonthRow[],
  weeks: WeekPay[],
  leaveStart: number,
  returnDate: number,
  baselineNet: number,
  baselineIncome: number,
): Phase[] {
  const avg = (from: number, to: number, key: "surplus" | "income") => {
    let total = 0;
    let days = 0;
    for (const r of months) {
      const end = r.start + daysInMonth(r.start) - 1;
      const overlap = Math.min(end, to) - Math.max(r.start, from) + 1;
      if (overlap <= 0) continue;
      total += r[key] * overlap;
      days += overlap;
    }
    return days ? total / days : 0;
  };
  const phases: Phase[] = [
    {
      id: "before",
      title: "Before Leave Starts",
      start: addMonths(monthStart(leaveStart), -3),
      end: leaveStart - 1,
      monthlyNet: baselineNet,
      monthlyIncome: baselineIncome,
    },
  ];
  const groups: Array<{ id: PhaseId; title: string; kind: WeekPay["kind"] }> = [
    { id: "company", title: "Company Pay Phase", kind: "company" },
    { id: "statutory", title: "SMP Phase", kind: "statutory" },
    { id: "unpaid", title: "Unpaid Tail & KIT Boost", kind: "unpaid" },
  ];
  for (const g of groups) {
    const ws = weeks.filter((x) => x.kind === g.kind);
    if (!ws.length) continue;
    const start = ws[0].start;
    const end = ws[ws.length - 1].start + 6;
    phases.push({
      id: g.id,
      title: g.title,
      start,
      end,
      monthlyNet: avg(start, end, "surplus"),
      monthlyIncome: avg(start, end, "income"),
      weeks: [ws[0].week, ws[ws.length - 1].week],
    });
  }
  const backEnd = addMonths(monthStart(returnDate), 3) - 1;
  phases.push({
    id: "return",
    title: "Return to Work",
    start: returnDate,
    end: backEnd,
    monthlyNet: avg(returnDate, backEnd, "surplus"),
    monthlyIncome: avg(returnDate, backEnd, "income"),
  });
  return phases;
}

function buildVerdict(
  intake: Intake,
  pot: PotStatus,
  backMonthly: number,
  leaveStart: number,
): Verdict {
  if (intake.stage === "returning") {
    const good = backMonthly >= 0;
    return {
      tone: good ? "good" : "warn",
      headline: good
        ? `${signedGbp(backMonthly)} a month spare once you're back`
        : `${gbp(-backMonthly)} a month short once you're back`,
      detail: good
        ? "After tax, bills and childcare on your chosen pattern. Use the Return tab to compare working patterns."
        : "After tax, bills and childcare on your chosen pattern. The Return tab shows which pattern closes the gap.",
    };
  }
  switch (pot.state) {
    case "funded":
      return {
        tone: "good",
        headline: "Your leave is fully funded",
        detail: `Your income covers every month of leave, so your ${gbp(pot.savingsPot)} dedicated leave fund stays untouched.`,
      };
    case "safe":
      return {
        tone: "good",
        headline: "Your plan is funded",
        detail: `Your dedicated leave fund covers your biggest dip of ${gbp(pot.peakDrawdown)}, leaving a ${gbp(pot.remaining)} buffer. Your everyday savings stay untouched.`,
      };
    case "save":
      return {
        tone: "warn",
        headline: `Save ${gbp(pot.saveMonthly)} a month to fully fund your leave`,
        detail: `Your leave dips by ${gbp(pot.peakDrawdown)} in total. Setting aside ${gbp(pot.saveMonthly)} a month until ${fmtMonth(leaveStart)} closes the ${gbp(-pot.remaining)} gap.`,
      };
    default:
      return {
        tone: "warn",
        headline: `${gbp(-pot.remaining)} gap left to bridge`,
        detail: "Your dedicated leave fund and boosts don't quite cover your lowest months. KIT days, accrued holiday or a shorter unpaid tail can close it.",
      };
  }
}

// ───────────────────────────── Formatting ─────────────────────────────

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
}

export function gbp(n: number): string {
  const v = Math.round(Math.abs(n));
  return `${n < 0 && v !== 0 ? "−" : ""}£${v.toLocaleString("en-GB")}`;
}

/** "+£85" / "−£162" with a true minus sign. */
export function signedGbp(n: number): string {
  const v = Math.round(Math.abs(n));
  if (v === 0) return "£0";
  return `${n < 0 ? "−" : "+"}£${v.toLocaleString("en-GB")}`;
}
