import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlan,
  childcareDaysFor,
  fundedHoursStart,
  incomeTax,
  nationalInsurance,
  signedGbp,
} from "../leaveCalculator";
import { ratesFor, studentLoanTerms } from "../rates";
import { dayNum, toIso } from "../dates";
import { DEFAULT_INTAKE, type Intake } from "../types";
import { buildFlexLetter } from "../letter";
import { sanitizeIntake } from "../sanitizeIntake";

const r = ratesFor(2026);
const TODAY = dayNum("2026-11-18");
const near = (a: number, b: number, tol = 0.5) =>
  assert.ok(Math.abs(a - b) <= tol, `expected ${a} ≈ ${b}`);

test("income tax: basic, higher and the £100k taper", () => {
  near(incomeTax(50_000, 50_000, r), 7_486);
  // £110k: allowance tapered to £7,570
  near(incomeTax(110_000, 110_000, r), 37_700 * 0.2 + (110_000 - 7_570 - 37_700) * 0.4);
  // Over £125,140 there is no allowance left
  near(incomeTax(150_000, 150_000, r), 37_700 * 0.2 + (125_140 - 37_700) * 0.4 + (150_000 - 125_140) * 0.45);
});

test("employee NI: 8% main band, 2% above the UEL", () => {
  near(nationalInsurance(50_000, r), (50_000 - 12_570) * 0.08);
  near(nationalInsurance(80_000, r), (50_270 - 12_570) * 0.08 + (80_000 - 50_270) * 0.02);
});

test("funded hours start the term after 9 months", () => {
  // 14 May 2026 → 9 months = 14 Feb 2027 → 1 Apr 2027 (matches the sheet)
  assert.equal(toIso(fundedHoursStart(dayNum("2026-05-14"))), "2027-04-01");
  // 17 May 2027 → 17 Feb 2028 → 1 Apr 2028 (matches the sheet)
  assert.equal(toIso(fundedHoursStart(dayNum("2027-05-17"))), "2028-04-01");
  // 9 months landing exactly on a term date rolls to the next term
  assert.equal(toIso(fundedHoursStart(dayNum("2026-12-01"))), "2028-01-01");
});

test("student loan thresholds hold at the last confirmed year", () => {
  assert.deepEqual(studentLoanTerms("plan1", 2029), { rate: 0.09, threshold: 28_005 });
  assert.deepEqual(studentLoanTerms("postgrad", 2026), { rate: 0.06, threshold: 21_000 });
  assert.deepEqual(studentLoanTerms("none", 2026), { rate: 0, threshold: 0 });
});

test("timeline starts on the leave start month, not 3 months before", () => {
  const plan = calculatePlan(DEFAULT_INTAKE, {}, { today: TODAY });
  assert.equal(plan.months[0].label, "May 2027");
  assert.equal(plan.months[0].phase, "leave");
  // 52 weeks of leave + 12 months back
  assert.equal(plan.months[plan.months.length - 1].label, "Apr 2029");
});

test("SMP: 90% for 6 weeks then the flat rate, to week 39", () => {
  const intake: Intake = { ...DEFAULT_INTAKE, policy: [] };
  const plan = calculatePlan(intake, {}, { today: TODAY });
  near(plan.weeks[0].gross, 0.9 * plan.awe, 0.01);
  near(plan.weeks[6].gross, 194.32, 0.01);
  near(plan.weeks[38].gross, 194.32, 0.01);
  assert.equal(plan.weeks[39].gross, 0);
  assert.equal(plan.weeks[39].kind, "unpaid");
});

test("Shared Parental Pay: flat rate from week 1, weeks offset by the other parent", () => {
  const intake: Intake = { ...DEFAULT_INTAKE, leaveType: "shared", weeksUsedByOtherParent: 10, policy: [] };
  const plan = calculatePlan(intake, {}, { today: TODAY });
  assert.equal(plan.statWeeksAvailable, 29);
  near(plan.weeks[0].gross, 194.32, 0.01);
  assert.equal(plan.weeks[29].gross, 0);
});

test("dedicated leave fund opens the running balance", () => {
  const plan = calculatePlan(DEFAULT_INTAKE, {}, { today: TODAY });
  // Month 1 is full pay, so nothing is drawn from the fund yet.
  near(plan.months[0].fundBalance, DEFAULT_INTAKE.savingsPot, 0.01);
  // By the end it has paid for every dip: fund − peak drawdown.
  near(plan.months[plan.months.length - 1].fundBalance, plan.pot.savingsPot - plan.pot.peakDrawdown, 0.01);
  const plan2 = calculatePlan(DEFAULT_INTAKE, { savingsPot: 0 }, { today: TODAY });
  near(plan2.months[0].fundBalance, 0, 0.01);
});

test("pot status: peak drawdown vs remaining buffer", () => {
  const plan = calculatePlan(DEFAULT_INTAKE, {}, { today: TODAY });
  const p = plan.pot;
  near(p.remaining, p.savingsPot + p.boosts - p.peakDrawdown, 0.01);
  const broke = calculatePlan({ ...DEFAULT_INTAKE, policy: [] }, { savingsPot: 0, kitDays: 0, holidayDays: 0, leaveWeeks: 104 }, { today: TODAY });
  assert.equal(broke.pot.state, "save");
  assert.ok(broke.pot.saveMonthly > 0);
  assert.match(broke.pot.pill, /^Save £[\d,]+ \/ month before leave starts$/);
});

test("childcare days by pattern follow the reduction rule", () => {
  const i: Intake = { ...DEFAULT_INTAKE, childcareDays: 3, childcareReduction: "minusOne" };
  assert.deepEqual(
    (["full", "four", "compressed", "three"] as const).map((p) => childcareDaysFor(i, p)),
    [3, 2, 2, 1],
  );
  const none: Intake = { ...i, childcareReduction: "noChange" };
  assert.deepEqual(
    (["full", "four", "compressed", "three"] as const).map((p) => childcareDaysFor(none, p)),
    [3, 3, 3, 3],
  );
  assert.equal(childcareDaysFor({ ...i, childcareSetup: "family" }, "full"), 0);
});

test("pattern comparison: 4 cards, neutral extra days, signed impact, one best", () => {
  const plan = calculatePlan(DEFAULT_INTAKE, {}, { today: TODAY });
  assert.equal(plan.patterns.length, 4);
  assert.deepEqual(plan.patterns.map((p) => p.extraDaysOff), [0, 46, 46, 93]);
  assert.equal(plan.patterns[0].impactPerDay, null);
  assert.equal(plan.patterns.filter((p) => p.isBest).length >= 1, true);
  const four = plan.patterns[1];
  near(four.impactPerDay!, (four.diffVsFull * 12) / 46, 0.001);
  assert.equal(signedGbp(-162.2), "−£162");
  assert.equal(signedGbp(85), "+£85");
});

test("£100k cliff: flags the parent over the line and the fix brings ANI to £100k", () => {
  const rich: Intake = { ...DEFAULT_INTAKE, salary: 110_000, bonus: 0, pensionPct: 0 };
  const plan = calculatePlan(rich, {}, { today: TODAY });
  assert.equal(plan.cliff.anyOver, true);
  const you = plan.cliff.parents.find((p) => p.who === "you")!;
  near(you.ani - you.fixAnnual, 100_000, 0.01);
  assert.ok(plan.cliff.childcareAtStake > 0);
  // Without the fix, the 5-day card loses support; with it, support is kept.
  assert.equal(plan.patterns[0].keepsChildcareSupport, false);
  const fixed = calculatePlan(rich, { applyPensionFix: true }, { today: TODAY });
  assert.equal(fixed.patterns[0].keepsChildcareSupport, true);
});

test("returning stage verdict is about monthly cashflow", () => {
  const plan = calculatePlan({ ...DEFAULT_INTAKE, stage: "returning" }, {}, { today: TODAY });
  assert.match(plan.verdict.headline, /a month (spare|short) once you're back/);
});

test("flex letter: 4-day pattern, start date, no placeholders when filled", () => {
  const intake: Intake = {
    ...DEFAULT_INTAKE,
    returnPattern: "four",
    fullName: "Issy Example",
    managerName: "Sam Manager",
    jobTitle: "Advisor",
  };
  const letter = buildFlexLetter(calculatePlan(intake, {}, { today: TODAY }));
  assert.equal(letter.needsRequest, true);
  assert.match(letter.text, /4 days a week, Monday to Thursday \(not working Fridays\), 30 hours a week/);
  assert.match(letter.text, /take effect from \d+ \w+ 20\d\d, when I return from leave/);
  assert.doesNotMatch(letter.text, /\[/);
});

test("sanitizeIntake clamps and whitelists", () => {
  const s = sanitizeIntake({ salary: -5, leaveWeeks: 999, stage: "hacker", leaveStart: "nope", extra: 1 });
  assert.equal(s.salary, 0);
  assert.equal(s.leaveWeeks, 104);
  assert.equal(s.stage, "pregnant");
  assert.equal(s.leaveStart, DEFAULT_INTAKE.leaveStart);
  assert.equal((s as unknown as Record<string, unknown>).extra, undefined);
});

test("every number in the plan is finite", () => {
  for (const stage of ["thinking", "pregnant", "sharing", "returning"] as const) {
    for (const household of ["two", "solo"] as const) {
      const plan = calculatePlan({ ...DEFAULT_INTAKE, stage, household, studentLoan: "plan2" }, {}, { today: TODAY });
      const bad: string[] = [];
      JSON.stringify(plan, (k, v) => {
        if (typeof v === "number" && !Number.isFinite(v)) bad.push(k);
        return v;
      });
      assert.deepEqual(bad, [], `${stage}/${household}`);
    }
  }
});
