"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/env";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";

async function assertAdmin() {
  const me = await getCurrentStaff();
  return me.role === "admin" ? me : null;
}

const inviteSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the person’s name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["admin", "staff"]),
  specialisms: z.array(z.string()),
});

export async function inviteStaff(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!(await assertAdmin())) return invalid("Only the office manager can invite staff.");
  const parsed = inviteSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    specialisms: formData.getAll("specialisms"),
  });
  if (!parsed.success) return invalid(parsed.error.issues[0]!.message);
  const { full_name, email, role, specialisms } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/set-password`,
    data: { full_name },
  });
  if (error || !data.user) {
    console.error("[gps] invite failed", error?.code ?? "unknown");
    return invalid(
      error?.code === "email_exists"
        ? "That email already has an account."
        : "The invitation could not be sent. Check the email address and try again.",
    );
  }

  // Inserted as the admin so the audit log records who added them.
  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("staff")
    .upsert({ id: data.user.id, full_name, email, role, specialisms, active: true });
  if (insertError) return failure(insertError);

  revalidatePath("/settings/staff");
  return ok(`Invitation sent to ${email}.`);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(2),
  role: z.enum(["admin", "staff"]),
  active: z.boolean(),
  specialisms: z.array(z.string()),
});

export async function updateStaff(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!(await assertAdmin())) return invalid("Only the office manager can change staff.");
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    active: formData.get("active") === "on",
    specialisms: formData.getAll("specialisms"),
  });
  if (!parsed.success) return invalid("Check the details and try again.");
  const { id, ...fields } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("staff").update(fields).eq("id", id);
  if (error) return failure(error);

  revalidatePath("/settings/staff");
  return ok("Saved.");
}

export async function resendInvite(_prev: unknown, formData: FormData): Promise<ActionResult> {
  if (!(await assertAdmin())) return invalid("Only the office manager can do that.");
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return invalid("Missing email address.");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/set-password`,
  });
  if (error) {
    console.error("[gps] resend invite failed", error.code ?? "unknown");
    return invalid("Could not resend. If they have already accepted, ask them to use “Forgotten your password?”.");
  }
  return ok("Invitation re-sent.");
}

// Removes a person's authenticator so they set up 2FA again at next sign-in
// (e.g. lost phone).
export async function resetStaffMfa(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await assertAdmin();
  if (!me) return invalid("Only the office manager can do that.");
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return invalid("Missing staff member.");
  if (id.data === me.id) return invalid("You cannot reset your own two-factor here.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: id.data });
  if (error) return invalid("Could not reset two-factor. Please try again.");
  for (const factor of data.factors) {
    const { error: delError } = await admin.auth.admin.mfa.deleteFactor({ userId: id.data, id: factor.id });
    if (delError) return invalid("Could not reset two-factor. Please try again.");
  }
  return ok("Two-factor reset. They will be asked to set it up again when they next sign in.");
}
