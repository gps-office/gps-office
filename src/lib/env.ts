// Public values are inlined into the browser bundle by Next.js, so they must
// be referenced as literal process.env.NEXT_PUBLIC_* expressions. Values are
// trimmed: a stray space or newline pasted into a dashboard breaks the URL.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** True when the Supabase settings look usable (no values are revealed). */
export function supabaseConfigured(): boolean {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SUPABASE_URL)
    ? SUPABASE_ANON_KEY.length > 20
    : false;
}

/**
 * Explains what is wrong with the Supabase settings, for the misconfiguration
 * page. The project URL is not secret; of the key only its length and the
 * first characters (e.g. "sb_publishable_" or "eyJ") are shown.
 */
export function supabaseConfigProblems(): string[] {
  const problems: string[] = [];
  if (!SUPABASE_URL) problems.push("NEXT_PUBLIC_SUPABASE_URL is empty or not set for this environment.");
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SUPABASE_URL))
    problems.push(`NEXT_PUBLIC_SUPABASE_URL should look like https://<ref>.supabase.co but is: "${SUPABASE_URL.slice(0, 80)}"`);
  if (!SUPABASE_ANON_KEY) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is empty or not set for this environment.");
  else if (SUPABASE_ANON_KEY.length <= 20)
    problems.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short (${SUPABASE_ANON_KEY.length} characters, starts "${SUPABASE_ANON_KEY.slice(0, 4)}").`);
  return problems;
}

export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
