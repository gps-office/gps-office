import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentStaff = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "staff";
  specialisms: string[];
};

/**
 * The signed-in staff member, verified on every request. Redirects to login,
 * 2FA or the inactive-account page when the session does not qualify.
 * Deduplicated per request with React cache().
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");
  if (claims.aal !== "aal2") redirect("/mfa");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, email, role, active, specialisms")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!staff || !staff.active) redirect("/inactive");
  return {
    id: staff.id,
    full_name: staff.full_name,
    email: staff.email,
    role: staff.role,
    specialisms: staff.specialisms ?? [],
  };
});

export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (staff.role !== "admin") notFound();
  return staff;
}

/** Validates that an internal redirect target is a same-site path. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
