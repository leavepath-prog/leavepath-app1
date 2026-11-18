import { dayNum, edate, fmtLong } from "./dates";
import type { PlanResult } from "./leaveCalculator";
import type { Intake, Pattern, Weekday } from "./types";

const WEEKDAYS: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export interface FlexLetter {
  needsRequest: boolean;
  subject: string;
  paragraphs: string[];
  /** Latest sensible date to send it: 3 months before the proposed start. */
  sendBy: number;
  proposedStart: number;
  /** Plain text for the Copy button. */
  text: string;
}

function dayRange(days: Weekday[]): string {
  if (days.length === 0) return "";
  const idx = days.map((d) => WEEKDAYS.indexOf(d)).sort((a, b) => a - b);
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && idx.length > 2) return `${WEEKDAYS[idx[0]]} to ${WEEKDAYS[idx[idx.length - 1]]}`;
  const names = idx.map((i) => WEEKDAYS[i]);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function hours(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function requestedPatternLine(intake: Intake, pattern: Pattern): string {
  const off1 = intake.nonWorkingDay;
  const off2 =
    intake.secondNonWorkingDay && intake.secondNonWorkingDay !== off1
      ? intake.secondNonWorkingDay
      : WEEKDAYS.find((d) => d !== off1 && d !== "Monday") ?? "Thursday";
  const h = intake.contractHours;
  switch (pattern) {
    case "four": {
      const working = WEEKDAYS.filter((d) => d !== off1);
      return `Requested working pattern: 4 days a week, ${dayRange(working)} (not working ${off1}s), ${hours(h * 0.8)} hours a week, with my salary and benefits pro rata at 80%.`;
    }
    case "compressed": {
      const working = WEEKDAYS.filter((d) => d !== off1);
      return `Requested working pattern: my full ${hours(h)} hours compressed into 4 longer days, ${dayRange(working)} (about ${hours(h / 4)} hours a day, not working ${off1}s), keeping my full salary.`;
    }
    case "three": {
      const working = WEEKDAYS.filter((d) => d !== off1 && d !== off2);
      return `Requested working pattern: 3 days a week, ${dayRange(working)} (not working ${off1}s or ${off2}s), ${hours(h * 0.6)} hours a week, with my salary and benefits pro rata at 60%.`;
    }
    default:
      return "Requested working pattern: no change to my current pattern.";
  }
}

export function buildFlexLetter(plan: PlanResult): FlexLetter {
  const intake = plan.intake;
  const pattern = intake.returnPattern;
  const name = intake.fullName.trim() || intake.firstName.trim() || "[Your name]";
  const manager = intake.managerName.trim() || "[Manager’s name]";
  const proposedStart = intake.proposedFlexStart
    ? dayNum(intake.proposedFlexStart)
    : plan.returnDate;
  const atReturn = proposedStart === plan.returnDate;
  const sendBy = edate(proposedStart, -3);
  const team = intake.team.trim();
  const handover = intake.handoverNote.trim();
  const otherWfh =
    intake.wfhDays > 0
      ? ` I currently work from home ${intake.wfhDays} ${intake.wfhDays === 1 ? "day" : "days"} a week and would like to keep a similar hybrid balance.`
      : "";

  const paragraphs: string[] = [
    `Dear ${manager},`,
    "I am writing to make a statutory request for flexible working under Part 8A of the Employment Rights Act 1996, as amended by the Employment Relations (Flexible Working) Act 2023.",
    `Current working pattern: 5 days a week, Monday to Friday, ${hours(intake.contractHours)} hours a week${intake.jobTitle.trim() ? `, as ${intake.jobTitle.trim()}` : ""}${team ? ` in ${team}` : ""}.`,
    requestedPatternLine(intake, pattern) + otherWfh,
    `Proposed start date: I would like this change to take effect from ${fmtLong(proposedStart)}${atReturn ? ", when I return from leave" : ""}. I am requesting this as a permanent change, and I would be happy to agree a trial period of 3 months if that would help.`,
    "How this could work for the team:",
    ...(handover ? [`• ${handover.replace(/\.?$/, ".")}`] : []),
    "• I will keep my calendar and out-of-office up to date so colleagues and clients always know when I am available.",
    "• I will agree a handover routine for anything time-sensitive that falls on my non-working days.",
    "• I am happy to be flexible for key meetings or deadlines with reasonable notice, and to review the arrangement after the first few months.",
    intake.previousRequest
      ? "Previous requests: I have made one previous statutory flexible working request in the last 12 months."
      : "Previous requests: I have not made a previous statutory flexible working request in the last 12 months.",
    "I understand that you will consult with me before reaching a decision if you are considering declining this request, and that a decision is due within two months of the date you receive it. I would welcome the chance to talk this through, perhaps at a Keeping in Touch day before I return.",
    "Kind regards,",
    name + (intake.jobTitle.trim() ? `\n${intake.jobTitle.trim()}` : ""),
  ];

  const subject = `Statutory flexible working request from ${name}`;
  return {
    needsRequest: pattern !== "full",
    subject,
    paragraphs,
    sendBy,
    proposedStart,
    text: [`Subject: ${subject}`, "", ...paragraphs].join("\n\n"),
  };
}
