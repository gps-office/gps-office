# GPS Office

Case management for GPS – Global Pass Services (London). The original brief is in
`docs/BUILD_BRIEF.md`; read it for scope and the later-phase list.

@AGENTS.md

## Stack
- Next.js 16 App Router (TypeScript, Tailwind v4), `cacheComponents` deliberately **off**:
  every page reads the session and personal data, so nothing is cached server-side.
- Supabase (Postgres, Auth with mandatory TOTP, private Storage) via `@supabase/ssr`.
- Request routing by session level lives in `src/proxy.ts` → `src/lib/supabase/proxy.ts`.

## Rules that must hold
- Real passport/immigration data (UK GDPR). **No client data in URLs, logs or error
  messages.** Free-text search runs in the browser or as a server action (POST), never `?q=`.
  Storage paths contain ids only. Log only error codes (`failure()` in `src/lib/errors.ts`).
- Every table has RLS requiring an active staff member **and** an AAL2 (2FA) session
  (`public.is_active_staff()` / `public.is_admin()`). Deletes are admin-only.
- Business rules live in the database (triggers): case references, CIPO gating,
  who/when stamps, audit log, last activity. Don't duplicate them in app code.
- `SUPABASE_SERVICE_ROLE_KEY` is used only in `src/lib/supabase/admin.ts` for staff
  invites and 2FA resets, after an admin check.
- Schema changes go in a new file in `supabase/migrations/`, then `npm run db:types`.

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
- `npm run db:start` (local Supabase via Docker) · `npm run db:reset` · `npm run db:types`
- `npm run db:test` – applies migrations to a plain local Postgres and runs
  `supabase/tests/*_test.sql` (needs `PGHOST`/`PGPORT`/`PGUSER`).

## Conventions
- Server actions return `ActionResult` (`ok` / `invalid` / `failure`) and re-check the
  session with `getCurrentStaff()`; forms use `ActionForm` from `src/components/action-form.tsx`.
- Form parsing helpers in `src/lib/forms.ts`; enum labels in `src/lib/constants.ts`.
- Dates are shown in Europe/London (`src/lib/format.ts`). Text inputs use `dir="auto"` for Hebrew.
