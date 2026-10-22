import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings, getStaffOptions } from "@/lib/queries";
import { STAGES, type Stage } from "@/lib/constants";
import { addDays, daysSince, todayLondon } from "@/lib/format";
import { Card, EmptyState, PageHeader, Stat, cx } from "@/components/ui";
import { DueDate, LevelBadge, PriorityBadge, StageBadge } from "@/components/badges";

export const metadata = { title: "Dashboard" };

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

type OpenCase = {
  id: string;
  reference: string;
  stage: Stage;
  priority: string;
  service_level: string;
  deadline: string | null;
  last_activity_at: string;
  next_action: string | null;
  assigned_to: string | null;
  manager_id: string | null;
  client: { full_name: string } | null;
  service: { name: string } | null;
};

function byUrgency(a: OpenCase, b: OpenCase) {
  const level = (c: OpenCase) => (c.service_level === "urgent" ? -1 : 0);
  return (
    PRIORITY_RANK[a.priority]! + level(a) - (PRIORITY_RANK[b.priority]! + level(b)) ||
    (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")
  );
}

function CaseLine({ c, extra }: { c: OpenCase; extra?: React.ReactNode }) {
  return (
    <li>
      <Link href={`/cases/${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2 text-sm hover:bg-slate-50">
        <span className="font-mono font-medium text-brand-700">{c.reference}</span>
        <span className="min-w-0 truncate text-slate-800" dir="auto">
          {c.client?.full_name}
        </span>
        <PriorityBadge priority={c.priority} />
        <LevelBadge level={c.service_level} />
        <span className="ml-auto flex items-center gap-3 text-xs">{extra}</span>
      </Link>
    </li>
  );
}

export default async function DashboardPage() {
  const me = await getCurrentStaff();
  const isAdmin = me.role === "admin";
  const supabase = await createClient();
  const today = todayLondon();
  const [settings, staff, { data: casesData }, { data: tasksData }] = await Promise.all([
    getSettings(),
    getStaffOptions(),
    supabase
      .from("cases")
      .select(
        "id, reference, stage, priority, service_level, deadline, last_activity_at, next_action, assigned_to, manager_id, client:clients!cases_client_id_fkey(full_name), service:services!cases_service_id_fkey(name)",
      )
      .neq("stage", "closed")
      .limit(5000),
    supabase
      .from("tasks")
      .select("id, title, due_date, due_time, assigned_to, case_id, case:cases!tasks_case_id_fkey(reference)")
      .eq("done", false)
      .limit(5000),
  ]);
  const cases = (casesData ?? []) as OpenCase[];
  const tasks = tasksData ?? [];

  const mine = (c: OpenCase) => c.assigned_to === me.id || c.manager_id === me.id;
  // Staff see their own work; the manager sees the whole office.
  const scope = isAdmin ? cases : cases.filter(mine);
  const scopeTasks = isAdmin ? tasks : tasks.filter((t) => t.assigned_to === me.id);

  const urgent = scope.filter((c) => c.priority === "urgent" || c.service_level === "urgent");
  const awaitingDocs = scope.filter((c) => c.stage === "documents_outstanding");
  const overdueTasks = scopeTasks.filter((t) => t.due_date && t.due_date < today);
  const myTasks = tasks
    .filter((t) => t.assigned_to === me.id && t.due_date && t.due_date <= today)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!));

  const horizon = addDays(today, settings.deadlineWindowDays);
  const deadlines = scope
    .filter((c) => c.deadline && c.deadline <= horizon)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));
  const stale = scope
    .filter((c) => (daysSince(c.last_activity_at) ?? 0) >= settings.staleAfterDays)
    .sort((a, b) => a.last_activity_at.localeCompare(b.last_activity_at));

  // Priority work queue, grouped by service. My cases first for everyone.
  const queue = [...scope].sort((a, b) => Number(mine(b)) - Number(mine(a)) || byUrgency(a, b));
  const services = [...new Set(queue.map((c) => c.service?.name ?? "Other"))];

  const perStage = STAGES.filter((s) => s.value !== "closed").map((s) => ({
    ...s,
    count: cases.filter((c) => c.stage === s.value).length,
  }));
  const maxStage = Math.max(1, ...perStage.map((s) => s.count));

  const workload = staff
    .filter((s) => s.active)
    .map((s) => ({
      ...s,
      cases: cases.filter((c) => c.assigned_to === s.value).length,
      urgent: cases.filter((c) => c.assigned_to === s.value && (c.priority === "urgent" || c.service_level === "urgent")).length,
      tasks: tasks.filter((t) => t.assigned_to === s.value).length,
      overdue: tasks.filter((t) => t.assigned_to === s.value && t.due_date && t.due_date < today).length,
    }))
    .sort((a, b) => b.cases - a.cases);
  const unassigned = cases.filter((c) => !c.assigned_to).length;

  return (
    <>
      <PageHeader
        title={`Hello, ${me.full_name}`}
        subtitle={isAdmin ? "Whole office" : "Your cases and tasks"}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={isAdmin ? "Active cases" : "My active cases"} value={scope.length} href={isAdmin ? "/cases" : "/cases?mine=1"} />
        <Stat label="Urgent" value={urgent.length} tone={urgent.length ? "red" : undefined} href="/cases?priority=urgent" />
        <Stat label="Awaiting documents" value={awaitingDocs.length} tone={awaitingDocs.length ? "amber" : undefined} href="/cases?stage=documents_outstanding" />
        <Stat label="Overdue tasks" value={overdueTasks.length} tone={overdueTasks.length ? "red" : undefined} href={isAdmin ? "/tasks?scope=all" : "/tasks"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Priority work queue" padded={false}>
            {queue.length === 0 ? (
              <EmptyState>No open cases.</EmptyState>
            ) : (
              <div className="divide-y divide-slate-200">
                {services.map((service) => {
                  const list = queue.filter((c) => (c.service?.name ?? "Other") === service);
                  return (
                    <section key={service}>
                      <h3 className="bg-slate-50 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {service} · {list.length}
                      </h3>
                      <ul className="divide-y divide-slate-100">
                        {list.slice(0, 8).map((c) => (
                          <CaseLine
                            key={c.id}
                            c={c}
                            extra={
                              <>
                                {c.next_action && (
                                  <span className="hidden max-w-64 truncate text-slate-500 md:inline" dir="auto">
                                    → {c.next_action}
                                  </span>
                                )}
                                {c.deadline && <DueDate date={c.deadline} />}
                                <StageBadge stage={c.stage} />
                              </>
                            }
                          />
                        ))}
                        {list.length > 8 && (
                          <li className="px-4 py-1.5 text-xs text-slate-500">+ {list.length - 8} more in Cases</li>
                        )}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title={`Deadlines · next ${settings.deadlineWindowDays} days`} padded={false}>
              {deadlines.length === 0 ? (
                <EmptyState>No deadlines coming up.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {deadlines.slice(0, 12).map((c) => (
                    <CaseLine key={c.id} c={c} extra={<DueDate date={c.deadline} />} />
                  ))}
                </ul>
              )}
            </Card>
            <Card title={`No activity for ${settings.staleAfterDays}+ days`} padded={false}>
              {stale.length === 0 ? (
                <EmptyState>Every case has recent activity.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stale.slice(0, 12).map((c) => (
                    <CaseLine key={c.id} c={c} extra={<span className="text-amber-700">{daysSince(c.last_activity_at)} days</span>} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="My tasks due" actions={<Link href="/tasks" className="text-xs text-brand-700">All tasks</Link>} padded={false}>
            {myTasks.length === 0 ? (
              <EmptyState>Nothing due today.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myTasks.slice(0, 10).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                    <span className={cx("min-w-0 flex-1 truncate", t.due_date! < today && "text-red-700")} dir="auto">
                      {t.title}
                    </span>
                    {t.case && (
                      <Link href={`/cases/${t.case_id}/tasks`} className="font-mono text-xs text-brand-700">
                        {t.case.reference}
                      </Link>
                    )}
                    <DueDate date={t.due_date} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Open cases by stage">
            <ul className="space-y-2" aria-label="Open cases by stage">
              {perStage.map((s) => (
                <li key={s.value}>
                  <Link
                    href={`/cases?stage=${s.value}`}
                    title={`${s.label}: ${s.count} case${s.count === 1 ? "" : "s"}`}
                    className="group grid grid-cols-[9rem_1fr_2rem] items-center gap-2 text-sm"
                  >
                    <span className="truncate text-slate-600 group-hover:text-slate-900">{s.short}</span>
                    <span className="h-2.5 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-brand-600 group-hover:bg-brand-700"
                        style={{ width: s.count ? `${Math.max(4, (s.count / maxStage) * 100)}%` : 0 }}
                      />
                    </span>
                    <span className="text-right text-slate-900 tabular-nums">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Staff workload" padded={false}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2">Staff</th>
                  <th className="px-2 py-2 text-right">Cases</th>
                  <th className="px-2 py-2 text-right">Urgent</th>
                  <th className="px-4 py-2 text-right">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workload.map((w) => (
                  <tr key={w.value} className={w.value === me.id ? "bg-brand-50/40" : undefined}>
                    <td className="px-4 py-1.5">
                      <Link href={`/cases?staff=${w.value}`} className="hover:text-brand-700">
                        {w.label}
                      </Link>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{w.cases}</td>
                    <td className={cx("px-2 py-1.5 text-right tabular-nums", w.urgent > 0 && "font-medium text-red-700")}>{w.urgent}</td>
                    <td className="px-4 py-1.5 text-right tabular-nums">
                      {w.tasks}
                      {w.overdue > 0 && <span className="ml-1 text-xs text-red-700">({w.overdue} overdue)</span>}
                    </td>
                  </tr>
                ))}
                {unassigned > 0 && (
                  <tr>
                    <td className="px-4 py-1.5 text-amber-700">Unassigned</td>
                    <td className="px-2 py-1.5 text-right text-amber-700 tabular-nums">{unassigned}</td>
                    <td colSpan={2} />
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
