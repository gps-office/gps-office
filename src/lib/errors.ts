import "server-only";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// Known business-rule errors raised by database triggers, keyed by HINT.
const KNOWN: Record<string, string> = {
  cipo_incomplete: "CIPO must be complete before the case can move past CIPO / Intake.",
  cipo_locked: "CIPO cannot be re-opened once the case has moved past CIPO / Intake.",
  own_admin: "You cannot remove your own admin access.",
};

type DbError = { code?: string; hint?: string | null; message?: string } | null | undefined;

/**
 * Turns a Supabase/Postgres error into a safe message for the screen.
 * Only the error code is logged: error messages can contain client data.
 */
export function failure(error: DbError, fallback = "Something went wrong. Please try again."): ActionResult {
  if (error?.hint && KNOWN[error.hint]) return { ok: false, error: KNOWN[error.hint] };
  if (error?.code === "23505") return { ok: false, error: "That record already exists." };
  if (error?.code === "42501") return { ok: false, error: "You do not have permission to do that." };
  console.error("[gps] database error", error?.code ?? "unknown");
  return { ok: false, error: fallback };
}

export function ok(message?: string): ActionResult {
  return { ok: true, message };
}

export function invalid(message: string): ActionResult {
  return { ok: false, error: message };
}
