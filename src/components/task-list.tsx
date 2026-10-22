import Link from "next/link";
import type { TaskItem } from "@/lib/tasks";
import { TASK_TYPES, labelOf } from "@/lib/constants";
import { daysUntil, formatDate, todayLondon } from "@/lib/format";
import { Badge, EmptyState, Field, Input, Select, Textarea } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { TaskCheckbox } from "@/components/task-checkbox";
import { deleteTask, updateTask } from "@/app/(app)/tasks/actions";

type Option = { value: string; label: string };

export function groupTasks(tasks: TaskItem[]) {
  const today = todayLondon();
  const open = tasks.filter((t) => !t.done);
  return [
    { key: "overdue", label: "Overdue", tone: "red" as const, items: open.filter((t) => t.due_date && t.due_date < today) },
    { key: "today", label: "Today", tone: "amber" as const, items: open.filter((t) => t.due_date === today) },
    { key: "upcoming", label: "Upcoming", tone: "blue" as const, items: open.filter((t) => t.due_date && t.due_date > today) },
    { key: "nodate", label: "No due date", tone: "slate" as const, items: open.filter((t) => !t.due_date) },
    { key: "done", label: "Done", tone: "green" as const, items: tasks.filter((t) => t.done) },
  ].filter((g) => g.items.length > 0);
}

export function TaskFields({ staff, task }: { staff: Option[]; task?: Partial<TaskItem> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label="Task" className="sm:col-span-2">
        <Input name="title" defaultValue={task?.title ?? ""} required placeholder="e.g. Chase client for birth certificate" />
      </Field>
      <Field label="Type">
        <Select name="task_type" options={TASK_TYPES} defaultValue={task?.task_type ?? "general"} />
      </Field>
      <Field label="Assigned to">
        <Select name="assigned_to" options={staff} defaultValue={task?.assigned_to ?? ""} placeholder="Unassigned" />
      </Field>
      <Field label="Due date">
        <Input name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
      </Field>
      <Field label="Time (optional)">
        <Input name="due_time" type="time" defaultValue={task?.due_time?.slice(0, 5) ?? ""} />
      </Field>
      <Field label="Details" className="sm:col-span-2">
        <Textarea name="details" defaultValue={task?.details ?? ""} rows={1} />
      </Field>
    </div>
  );
}

export function TaskList({
  tasks,
  staff,
  showCase = false,
  isAdmin = false,
}: {
  tasks: TaskItem[];
  staff: Option[];
  showCase?: boolean;
  isAdmin?: boolean;
}) {
  const groups = groupTasks(tasks);
  if (groups.length === 0) return <EmptyState>No tasks.</EmptyState>;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            {g.label} <Badge tone={g.tone}>{g.items.length}</Badge>
          </h2>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {g.items.map((t) => {
              const d = daysUntil(t.due_date);
              return (
                <li key={t.id} className="px-4 py-2.5">
                  <div className="flex items-start gap-3">
                    <TaskCheckbox id={t.id} done={t.done} label={t.title} />
                    <details className="min-w-0 flex-1">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className={t.done ? "text-slate-400 line-through" : "font-medium text-slate-900"} dir="auto">
                          {t.title}
                        </span>
                        {t.task_type !== "general" && <Badge>{labelOf(TASK_TYPES, t.task_type)}</Badge>}
                        {showCase && t.case && t.case_id && (
                          <Link href={`/cases/${t.case_id}/tasks`} className="font-mono text-xs text-brand-700 hover:underline">
                            {t.case.reference}
                          </Link>
                        )}
                        {showCase && t.case?.client && (
                          <span className="text-xs text-slate-500" dir="auto">
                            {t.case.client.full_name}
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                          {t.assignee?.full_name ?? <span className="text-amber-700">Unassigned</span>}
                          {t.due_date && (
                            <span className={!t.done && d !== null && d < 0 ? "font-medium text-red-700" : !t.done && d === 0 ? "font-medium text-amber-700" : ""}>
                              {formatDate(t.due_date)}
                              {t.due_time && ` ${t.due_time.slice(0, 5)}`}
                            </span>
                          )}
                        </span>
                      </summary>
                      <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                        {t.details && <p className="text-sm whitespace-pre-line text-slate-600" dir="auto">{t.details}</p>}
                        <ActionForm action={updateTask} className="space-y-3">
                          <input type="hidden" name="id" value={t.id} />
                          <TaskFields staff={staff} task={t} />
                          <SubmitButton size="sm">Save task</SubmitButton>
                        </ActionForm>
                        {isAdmin && (
                          <ActionForm action={deleteTask}>
                            <input type="hidden" name="id" value={t.id} />
                            <SubmitButton size="sm" variant="danger" pendingText="Deleting…">
                              Delete task
                            </SubmitButton>
                          </ActionForm>
                        )}
                      </div>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
