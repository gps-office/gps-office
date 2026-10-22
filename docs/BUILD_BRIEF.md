# GPS Office – Build Brief for Claude Code

Paste this into Claude Code from inside the empty `gps-office` repository, or save it in the repo as `CLAUDE.md`.

## Goal
Build the central office system for GPS – Global Pass Services (London): one place to manage every client and case from first enquiry until documents are returned, payments settled and the case closed. It must remember everything about every case so no client, document, deadline or follow-up is missed.

## Stack
- Next.js (App Router, TypeScript, Tailwind), deployed on Vercel (London region `lhr1`).
- Supabase (project in West EU / London): Postgres, Auth, Storage.
- `@supabase/ssr` for server-side auth. Database changes as SQL migrations in `supabase/migrations`.
- Secrets only in `.env.local` and Vercel environment variables. Never commit keys. The `service_role` key is used server-side only.

## Security (real passport and immigration data – UK GDPR)
- Staff log in with email + password and mandatory TOTP 2FA (Supabase MFA). No public sign-up; the admin invites staff.
- Row Level Security on every table: only signed-in, active staff can read or write. Roles: `admin` (manager) and `staff`.
- Private Storage bucket `case-documents`; files served through short-lived signed URLs only.
- Audit log table written by database triggers: who changed what, when, on every case, client, document and finance row.
- No client data in URLs, logs or error messages.

## Data model
- **staff**: linked to `auth.users`; name, role, active, service specialisms.
- **clients**: full name, Hebrew name, DOB, nationality, passport number + expiry, phone, WhatsApp, email, address, notes.
- **client_links**: family relationships between clients (spouse, child, parent…).
- **cases**: reference (`GPS-26-0001`), client, service type, service level (standard / premium / urgent), priority, stage, assigned staff, responsible manager, deadline, external refs (Home Office, HMPO, USCIS, consulate), CIPO complete flag, D&N headline fields (next action, outstanding, concerns, key facts), last activity.
- **case_people**: everyone on the case – name, DOB, nationality, passport details, relationship.
- **cipo_checks**: the 9 CIPO steps per case, with who ticked each and when.
- **dn_entries**: Details & Notes log – type (note, email, WhatsApp, call, event, concern, submission), text, author, time.
- **documents**: case, name, category, original or copy, received date, expiry date, checklist item it satisfies, returned-to-client flag; **document_versions** holding the storage file per version.
- **tasks**: title, case, assignee, due date, type (client reply, embassy appointment, Home Office deadline, courier, payment follow-up…), done.
- **finance_lines**: quotation, invoice, government fee, solicitor fee, courier charge, deposit, payment, refund – amount, date, description.
- **shipments**: carrier (Royal Mail, DHL…), tracking number, direction, status.
- **services**: configurable service types with document checklist and price list (standard / premium / urgent).

## Case workflow (stages)
1. New enquiry
2. CIPO / Intake
3. Documents outstanding
4. Application preparation
5. Submitted / Awaiting decision
6. Approved / Completed
7. Documents returned / Case closed

A case cannot move past CIPO / Intake until CIPO is complete.

## CIPO – Case Intake, Preparation & Organisation
Guided checklist; "CIPO Complete" only when all nine are ticked:
1. Receive all client information and documents
2. Check documents are readable and complete
3. Scan and upload documents
4. Organise files into categories
5. Identify missing documents and conflicting information
6. Record whether documents are originals or copies
7. Prepare a clear case summary
8. Create the case file and assign responsibility
9. Confirm the case is ready for processing

## Service types (each with its own checklist and prices)
- British passports; British citizenship
- American passports; US citizenship / CRBA
- UK visas and immigration; EUSS; eVisa
- Israeli passports; Israeli citizenship / consular; Israeli military status
- Apostille, notarisation and legalisation
- National Insurance number
- Right to work / Home Office compliance
- Other specialist cases

## Screens
- **Login** with 2FA.
- **Dashboard**: active cases, urgent cases, awaiting documents, overdue tasks; priority work queue by service; deadlines in the next 14 days; cases with no activity for 7+ days; staff workload; cases per stage.
- **Cases list**: search and filters (stage, service, staff, priority, "my cases").
- **Case page** with tabs: Overview (details, people, stage, next action) · CIPO · D&N · Documents (checklist with missing items, uploads, versions, expiry warnings, originals returned, courier tracking) · Tasks · Finance (quotes, charges, payments, balance) · History (audit).
- **Clients**: list, client page with all their cases and family links, passport expiry warnings.
- **Tasks**: my tasks / all tasks, grouped Overdue / Today / Upcoming.
- **Finance**: outstanding balances across cases, payments received.
- **Settings** (admin): staff and roles, service checklists, price list, staleness threshold.
- **Global search** across clients, cases, reference numbers, passport numbers and documents.
- Works on mobile. Supports Hebrew names (right-to-left text where needed).

## Staff
Cases and tasks assigned to named staff, e.g. Mrs Wosner (UK passports), Mrs Lovinger (operations). Each person sees their own work first; the admin sees the whole office.

## Build order
1. Project setup, Supabase connection, login with 2FA, staff roles.
2. Schema + RLS + audit triggers + storage bucket (migrations).
3. Clients and cases, stages, CIPO.
4. D&N, documents and checklists, tasks.
5. Finance and price lists.
6. Dashboard and global search.
7. Deploy to Vercel.

## Later phases (not in version 1)
- AI case summaries and letter drafting from the D&N.
- Gmail and WhatsApp Business linked to cases.
- Client portal for secure uploads.
- Document templates (letters of authority, cover letters, invoices) and reports.
