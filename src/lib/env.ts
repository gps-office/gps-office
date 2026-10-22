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

export function siteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
