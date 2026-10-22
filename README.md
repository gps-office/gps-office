# GPS Office

The central office system for **GPS – Global Pass Services** (London): every client and case
from first enquiry until documents are returned, payments settled and the case closed.

- **Cases** with GPS-YY-NNNN references, seven stages, the 9-step **CIPO** checklist (a case
  cannot pass CIPO / Intake until it is complete), people on the case and external references.
- **D&N** (Details & Notes) log and headline (next action, outstanding, concerns, key facts).
- **Documents** per service checklist, private file storage with versions, expiry warnings,
  originals held/returned, courier tracking.
- **Tasks**, **finance** (quotes, charges, payments, balances), **price list**.
- **Dashboard**, **global search**, full **history** of every change.
- Staff sign in with password **and** an authenticator app (2FA). No public sign-up.

---

## Setting it up (one time)

You need: a Supabase account, a Vercel account, and this repository on GitHub.

### 1. Create the Supabase project
1. In [Supabase](https://supabase.com/dashboard) create a new project.
   **Region: West Europe (London)**. Save the database password somewhere safe.
2. Apply the database. On your computer, in this folder:
   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   (The project ref is in the project URL: `https://supabase.com/dashboard/project/<ref>`.)

### 2. Configure Supabase Auth
In the Supabase dashboard:

| Where | Setting |
|---|---|
| Authentication → Sign In / Providers | **Allow new users to sign up: OFF** |
| Authentication → Sign In / Providers → Email | Keep **Email enabled**. Confirm email: ON. Minimum password length: **12**. Turn on leaked-password protection if your plan has it |
| Authentication → Multi-Factor | **TOTP (authenticator app): enabled** |
| Authentication → URL Configuration | **Site URL** = your app address (e.g. `https://gps-office.vercel.app`). Add `https://gps-office.vercel.app/**` to **Redirect URLs** |
| Authentication → Emails → Templates | Replace **Invite user** with `supabase/templates/invite.html` and **Reset password** with `supabase/templates/recovery.html` (copy the HTML in) |
| Authentication → Emails → SMTP | Set up your own email sender (e.g. your Google Workspace or Resend). Supabase’s built-in sender is limited to a few emails an hour |

> Do **not** switch off the Email provider itself – that disables password sign-in completely.
> Sign-ups are blocked by the first setting.

### 3. Deploy on Vercel
1. In [Vercel](https://vercel.com/new) import the `gps-office` repository.
2. Add these **Environment Variables** (Supabase → Project Settings → API Keys):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable (anon) key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret (service_role) key – **never share this** |
   | `NEXT_PUBLIC_SITE_URL` | Your app address, e.g. `https://gps-office.vercel.app` |

3. Deploy. The app runs in London (`lhr1`, set in `vercel.json`).
4. If you add a custom domain later, update the Site URL / Redirect URLs in Supabase and
   `NEXT_PUBLIC_SITE_URL` in Vercel.

### 4. Create the first admin (office manager)
On your computer, create a file `.env.local` (copy `.env.example`) with the same four values, then:
```bash
node --env-file=.env.local scripts/create-admin.mjs manager@yourdomain.co.uk "Full Name"
```
The manager receives an email, chooses a password and sets up 2FA. From then on, invite staff
in **Settings → Staff and roles**, and set prices and checklists in **Settings → Services**.

---

## Security and UK GDPR notes
- All data access is checked **in the database** (Row Level Security): only active staff who
  have entered their 2FA code can read or write anything. Only admins can delete.
- Every change to cases, clients, documents, finance and the rest is recorded in the audit log
  (case **History** tab) by the database itself.
- Files are in a private bucket and opened through links that expire after 60 seconds. File
  paths contain only random ids, and no client names or numbers appear in web addresses.
- Lost phone: an admin uses **Settings → Staff → Reset two-factor**. Leaver: untick **Active**.
- Before going live, also: sign the Supabase and Vercel data processing agreements, enable
  Supabase backups / point-in-time recovery (Pro plan), confirm your ICO registration, and agree a
  retention period for closed cases.

---

## For developers
See `CLAUDE.md` for architecture and rules. Local development uses Docker:
```bash
npm install
npm run db:start            # local Supabase (prints local keys) – put them in .env.local
npm run dev                 # http://localhost:3000
node --env-file=.env.local scripts/create-admin.mjs you@example.com "Your Name"
# invitation emails appear in the local mailbox at http://127.0.0.1:54324
```
Checks: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run db:test`.
