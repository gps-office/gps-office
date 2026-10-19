import "server-only";
import { createClient } from "@/lib/supabase/server";

export const TASK_SELECT =
  "id, title, details, task_type, assigned_to, due_date, due_time, done, done_at, case_id, assignee:staff!tasks_assigned_to_fkey(full_name), case:cases!tasks_case_id_fkey(reference, client:clients!cases_client_id_fkey(full_name))";

type Filter = { caseId?: string; assignedTo?: string; includeDone?: boolean };

export async function loadTasks({ caseId, assignedTo, includeDone = false }: Filter) {
  const supabase = await createClient();
  let q = supabase.from("tasks").select(TASK_SELECT).order("due_date", { ascending: true, nullsFirst: false }).order("due_time").limit(500);
  if (caseId) q = q.eq("case_id", caseId);
  if (assignedTo) q = q.eq("assigned_to", assignedTo);
  if (!includeDone) q = q.eq("done", false);
  const { data } = await q;
  return data ?? [];
}

export type TaskItem = Awaited<ReturnType<typeof loadTasks>>[number];
