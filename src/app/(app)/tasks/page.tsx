import Link from "next/link";
import { getCurrentStaff } from "@/lib/auth";
import { getStaffOptions } from "@/lib/queries";
import { loadTasks } from "@/lib/tasks";
import { isUuid } from "@/lib/forms";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, PageHeader, cx } from "@/components/ui";
import { TaskFields, TaskList } from "@/components/task-list";
import { addTask } from "./actions";

export const metadata = { title: "Tasks" };

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const sp = await searchParams;
  const me = await getCurrentStaff();
  const staff = await getStaffOptions();
  const scope = sp.scope === "all" ? "all" : "mine";
  const person = scope === "all" && isUuid(sp.staff) ? sp.staff : undefined;
  const showDone = sp.done === "1";

  const tasks = await loadTasks({ assignedTo: scope === "mine" ? me.id : person, includeDone: showDone });
  const activeStaff = staff.filter((s) => s.active);

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cx("rounded-md px-3 py-1.5 text-sm font-medium", active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100")}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks" subtitle={scope === "mine" ? "Your tasks first. Office tasks not tied to a case can be added here too." : "All office tasks"} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tab("/tasks", "My tasks", scope === "mine")}
        {tab("/tasks?scope=all", "All tasks", scope === "all" && !person)}
        {scope === "all" && (
          <form className="flex items-center gap-2">
            <input type="hidden" name="scope" value="all" />
            <select name="staff" defaultValue={person ?? ""} className="field w-48 py-1.5" aria-label="Staff member">
              <option value="">Everyone</option>
              {staff.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="text-sm font-medium text-brand-700">Show</button>
          </form>
        )}
        <Link
          href={`/tasks?${new URLSearchParams({ ...(scope === "all" ? { scope: "all" } : {}), ...(person ? { staff: person } : {}), ...(showDone ? {} : { done: "1" }) })}`}
          className="ml-auto text-sm text-slate-500 hover:text-slate-800"
        >
          {showDone ? "Hide done" : "Show done"}
        </Link>
      </div>

      <Card title="Add a task" className="mb-6">
        <ActionForm action={addTask} resetOnSuccess className="space-y-3">
          <TaskFields staff={activeStaff} task={{ assigned_to: me.id }} />
          <SubmitButton size="sm">Add task</SubmitButton>
        </ActionForm>
      </Card>

      <TaskList tasks={tasks} staff={activeStaff} showCase isAdmin={me.role === "admin"} />
    </div>
  );
}
