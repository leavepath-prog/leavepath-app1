/**
 * Date helpers that work in whole UTC days, so a time zone or daylight
 * saving change can never shift a date by one.
 */

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for an ISO date (yyyy-mm-dd). */
export function dayNum(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromParts(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function toDate(day: number): Date {
  return new Date(day * DAY_MS);
}

export function toIso(day: number): string {
  return toDate(day).toISOString().slice(0, 10);
}

export function parts(day: number): { y: number; m: number; d: number } {
  const dt = toDate(day);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function monthStart(day: number): number {
  const { y, m } = parts(day);
  return fromParts(y, m, 1);
}

/** First day of the month `n` months after the month containing `day`. */
export function addMonths(day: number, n: number): number {
  const { y, m } = parts(day);
  const total = y * 12 + (m - 1) + n;
  return fromParts(Math.floor(total / 12), (total % 12) + 1, 1);
}

/** Same day-of-month `n` months later (clamped to the month's last day), like EDATE. */
export function edate(day: number, n: number): number {
  const { y, m, d } = parts(day);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = daysInMonth(fromParts(ny, nm, 1));
  return fromParts(ny, nm, Math.min(d, last));
}

export function daysInMonth(day: number): number {
  const start = monthStart(day);
  return addMonths(start, 1) - start;
}

/** Start year of the UK tax year containing `day` (tax years start 6 April). */
export function taxYearOf(day: number): number {
  const { y } = parts(day);
  return day < fromParts(y, 4, 6) ? y - 1 : y;
}

export function taxYearBounds(startYear: number): [number, number] {
  return [fromParts(startYear, 4, 6), fromParts(startYear + 1, 4, 5)];
}

export function taxYearLabel(startYear: number): string {
  return `${startYear}/${String(startYear + 1).slice(2)}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function fmtMonth(day: number): string {
  const { y, m } = parts(day);
  return `${MONTHS[m - 1]} ${y}`;
}

export function fmtLong(day: number): string {
  const { y, m, d } = parts(day);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export function fmtShort(day: number): string {
  const { y, m, d } = parts(day);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function todayDay(): number {
  const now = new Date();
  return fromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
