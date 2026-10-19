const TZ = "Europe/London";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ,
});
const moneyFmt = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** Parses a YYYY-MM-DD date as a calendar date (no timezone shift). */
function parseDay(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00Z`);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return dateFmt.format(value.length <= 10 ? parseDay(value) : new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return dateTimeFmt.format(new Date(value));
}

export function formatMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return moneyFmt.format(Number(value));
}

/** Today's date in London as YYYY-MM-DD. */
export function todayLondon(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function addDays(day: string, days: number): string {
  const d = parseDay(day);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today (London) until the given date; negative if past. */
export function daysUntil(day: string | null | undefined): number | null {
  if (!day) return null;
  const ms = parseDay(day).getTime() - parseDay(todayLondon()).getTime();
  return Math.round(ms / 86_400_000);
}

export function daysSince(timestamp: string | null | undefined): number | null {
  if (!timestamp) return null;
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / 86_400_000);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
