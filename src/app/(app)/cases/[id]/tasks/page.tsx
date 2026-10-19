import { getCurrentStaff } from "@/lib/auth";
import { getCase, getStaffOptions } from "@/lib/queries";
import { loadTasks } from "@/lib/tasks";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card } from "@/components/ui";
import { TaskFields, TaskList } from "@/components/task-list";
import { addTask } from "../../../tasks/actions";

export const metadata = { title: "Case tasks" };

export default async function CaseTasksPage({ params }: PageProps<"/cases/[id]/tasks">) {
  const { id } = await params;
  const [c, me, staff] = await Promise.all([getCase(id), getCurrentStaff(), getStaffOptions()]);
  const tasks = await loadTasks({ caseId: c.id, includeDone: true });
  const activeStaff = staff.filter((s) => s.active);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card title="Add a task">
        <ActionForm action={addTask} resetOnSuccess className="space-y-3">
          <input type="hidden" name="case_id" value={c.id} />
          <TaskFields staff={activeStaff} task={{ assigned_to: c.assigned_to ?? me.id }} />
          <SubmitButton size="sm">Add task</SubmitButton>
        </ActionForm>
      </Card>
      <TaskList tasks={tasks} staff={activeStaff} isAdmin={me.role === "admin"} />
    </div>
  );
}
