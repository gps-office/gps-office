"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";

const KEYS = ["stale_after_days", "deadline_window_days", "passport_expiry_warning_days"] as const;

export async function saveOfficeSettings(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can change settings.");
  const supabase = await createClient();
  for (const key of KEYS) {
    const n = Number(text(fd, key));
    if (!Number.isInteger(n) || n < 1 || n > 3650) return invalid("Each value must be a whole number of days.");
    const { error } = await supabase.from("app_settings").update({ value: n }).eq("key", key);
    if (error) return failure(error);
  }
  revalidatePath("/", "layout");
  return ok("Settings saved.");
}
