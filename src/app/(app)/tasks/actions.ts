"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bool, date, oneOf, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import { TASK_TYPES } from "@/lib/constants";

function refresh(caseId: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/");
  if (caseId) revalidatePath(`/cases/${caseId}/tasks`);
}

function taskFields(fd: FormData) {
  const time = text(fd, "due_time");
  return {
    title: text(fd, "title"),
    details: text(fd, "details"),
    task_type: oneOf(fd, "task_type", TASK_TYPES) ?? "general",
    assigned_to: uuid(fd, "assigned_to"),
    due_date: date(fd, "due_date"),
    due_time: time && /^\d{2}:\d{2}$/.test(time) ? time : null,
  };
}

export async function addTask(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  const fields = taskFields(fd);
  if (!fields.title) return invalid("Give the task a title.");
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({ ...fields, title: fields.title, case_id: caseId });
  if (error) return failure(error);
  refresh(caseId);
  return ok("Task added.");
}

export async function updateTask(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const fields = taskFields(fd);
  if (!id) return invalid("Missing task.");
  if (!fields.title) return invalid("Give the task a title.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...fields, title: fields.title })
    .eq("id", id)
    .select("case_id")
    .single();
  if (error) return failure(error);
  refresh(data.case_id);
  return ok("Task saved.");
}

export async function setTaskDone(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  if (!id) return invalid("Missing task.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ done: bool(fd, "done") })
    .eq("id", id)
    .select("case_id")
    .single();
  if (error) return failure(error);
  refresh(data.case_id);
  return ok();
}

export async function deleteTask(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can delete tasks. Mark it done instead.");
  const id = uuid(fd, "id");
  if (!id) return invalid("Missing task.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").delete().eq("id", id).select("case_id").single();
  if (error) return failure(error);
  refresh(data.case_id);
  return ok("Task deleted.");
}
