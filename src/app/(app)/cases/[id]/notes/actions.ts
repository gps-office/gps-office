"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bool, oneOf, text, uuid } from "@/lib/forms";
import { londonLocalToIso } from "@/lib/format";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import { DN_TYPES } from "@/lib/constants";

export async function addEntry(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  const body = text(fd, "body");
  if (!caseId) return invalid("Missing case.");
  if (!body) return invalid("Write something first.");
  const when = text(fd, "occurred_at");

  const supabase = await createClient();
  const { error } = await supabase.from("dn_entries").insert({
    case_id: caseId,
    entry_type: oneOf(fd, "entry_type", DN_TYPES) ?? "note",
    body,
    pinned: bool(fd, "pinned"),
    ...(when && londonLocalToIso(when) ? { occurred_at: londonLocalToIso(when)! } : {}),
  });
  if (error) return failure(error);
  revalidatePath(`/cases/${caseId}`, "layout");
  return ok("Added to the D&N.");
}

export async function updateEntry(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  const body = text(fd, "body");
  if (!id || !caseId || !body) return invalid("The entry can’t be empty.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dn_entries")
    .update({ body, entry_type: oneOf(fd, "entry_type", DN_TYPES) ?? "note" })
    .eq("id", id)
    .select("id");
  if (error) return failure(error);
  if (!data.length) return invalid("Only the author or the office manager can edit this entry.");
  revalidatePath(`/cases/${caseId}/notes`);
  return ok("Saved.");
}

export async function togglePin(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing entry.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dn_entries")
    .update({ pinned: bool(fd, "pinned") })
    .eq("id", id)
    .select("id");
  if (error) return failure(error);
  if (!data.length) return invalid("Only the author or the office manager can pin this entry.");
  revalidatePath(`/cases/${caseId}/notes`);
  return ok();
}

export async function deleteEntry(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can delete D&N entries.");
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing entry.");
  const supabase = await createClient();
  const { error } = await supabase.from("dn_entries").delete().eq("id", id);
  if (error) return failure(error);
  revalidatePath(`/cases/${caseId}/notes`);
  return ok("Deleted. It remains in the case history.");
}
