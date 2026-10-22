// Creates the first admin (office manager) account and emails them an
// invitation. Run once after the database migrations:
//
//   node --env-file=.env.local scripts/create-admin.mjs manager@example.com "Full Name"
//
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
// NEXT_PUBLIC_SITE_URL. Further staff are invited from Settings → Staff.
import { createClient } from "@supabase/supabase-js";

const [email, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(" ").trim();
if (!email || !fullName) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> "<full name>"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data, error } = await supabase.auth.admin.inviteUserByEmail(email.toLowerCase(), {
  redirectTo: `${site}/auth/callback?next=/set-password`,
  data: { full_name: fullName },
});
if (error) {
  console.error(`Invitation failed: ${error.message}`);
  process.exit(1);
}

const { error: staffError } = await supabase
  .from("staff")
  .upsert({ id: data.user.id, full_name: fullName, email: email.toLowerCase(), role: "admin", active: true });
if (staffError) {
  console.error(`Could not create staff record: ${staffError.message}`);
  process.exit(1);
}

console.log(`Invitation sent to ${email}. They are set up as admin.`);
