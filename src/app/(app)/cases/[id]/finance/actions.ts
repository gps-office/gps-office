"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { date, money, oneOf, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import { FINANCE_TYPES } from "@/lib/constants";

function refresh(caseId: string) {
  revalidatePath(`/cases/${caseId}/finance`);
  revalidatePath("/finance");
}

function lineFields(fd: FormData) {
  return {
    line_type: oneOf(fd, "line_type", FINANCE_TYPES),
    amount: money(fd, "amount"),
    line_date: date(fd, "line_date") ?? new Date().toISOString().slice(0, 10),
    description: text(fd, "description"),
    payment_method: text(fd, "payment_method"),
  };
}

export async function addFinanceLine(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  const f = lineFields(fd);
  if (!caseId) return invalid("Missing case.");
  if (!f.line_type) return invalid("Choose the type of entry.");
  if (f.amount === null) return invalid("Enter an amount in pounds, e.g. 120 or 85.50.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("finance_lines")
    .insert({ ...f, line_type: f.line_type, amount: f.amount, case_id: caseId });
  if (error) return failure(error);
  refresh(caseId);
  return ok("Added.");
}

export async function updateFinanceLine(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  const f = lineFields(fd);
  if (!id || !caseId) return invalid("Missing entry.");
  if (!f.line_type || f.amount === null) return invalid("Check the type and amount.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("finance_lines")
    .update({ ...f, line_type: f.line_type, amount: f.amount })
    .eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Saved.");
}

export async function deleteFinanceLine(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can delete finance entries. Add a refund or correction instead.");
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing entry.");
  const supabase = await createClient();
  const { error } = await supabase.from("finance_lines").delete().eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Deleted.");
}
