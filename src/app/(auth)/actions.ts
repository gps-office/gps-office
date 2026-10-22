"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import type { FormResult } from "@/components/action-form";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function signIn(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: "Enter your email address and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "Email or password is incorrect." };

  // 2FA is mandatory: enter a code, or set it up on first sign-in.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  redirect(aal?.nextLevel === "aal2" ? "/mfa" : "/mfa/enroll");
}

export async function requestPasswordReset(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (email.success) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${siteUrl()}/auth/callback?next=/set-password`,
    });
  }
  // Same answer whether or not the account exists.
  return { ok: true, message: "If that email belongs to a staff account, a reset link is on its way." };
}

const newPassword = z
  .object({ password: z.string().min(12, "Use at least 12 characters."), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The two passwords do not match." });

export async function setPassword(_prev: FormResult, formData: FormData): Promise<FormResult> {
  const parsed = newPassword.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      error:
        error.code === "weak_password"
          ? "That password is too weak or has appeared in a data breach. Choose another."
          : error.code === "same_password"
            ? "Choose a password you have not used before."
            : "The password could not be saved. Please try again.",
    };
  }
  // New staff go on to set up 2FA; a password reset (already at AAL2) is done.
  const { data } = await supabase.auth.getClaims();
  redirect(data?.claims.aal === "aal2" ? "/" : "/mfa/enroll");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
