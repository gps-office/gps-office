import "server-only";

/** Trimmed text from a form field, or null when empty. */
export function text(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

/** A YYYY-MM-DD date, or null when empty or malformed. */
export function date(fd: FormData, key: string): string | null {
  const v = text(fd, key);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/** A money amount in pounds, or null when empty or not a valid amount. */
export function money(fd: FormData, key: string): number | null {
  const v = text(fd, key)?.replace(/[£,\s]/g, "");
  if (!v || !/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Number(v);
}

/** One of the allowed values, or null. */
export function oneOf<T extends string>(fd: FormData, key: string, allowed: readonly { value: T }[]): T | null {
  const v = text(fd, key);
  return (allowed.find((a) => a.value === v)?.value ?? null) as T | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}

export function uuid(fd: FormData, key: string): string | null {
  const v = text(fd, key);
  return isUuid(v) ? v : null;
}
