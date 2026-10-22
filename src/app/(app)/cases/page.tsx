import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getServices, getSettings, getStaffOptions } from "@/lib/queries";
import { PRIORITIES, STAGES } from "@/lib/constants";
import { isUuid } from "@/lib/forms";
import { LinkButton, PageHeader, Select, buttonClass } from "@/components/ui";
import { CaseTable } from "./case-table";

export const metadata = { title: "Cases" };

type Search = { stage?: string; service?: string; staff?: string; priority?: string; view?: string; mine?: string };

// Filters are non-personal (stage, service, staff id…) so they live in the
// URL; free-text search runs in the browser.
export default async function CasesPage({ searchParams }: PageProps<"/cases">) {
  const sp = (await searchParams) as Search;
  const me = await getCurrentStaff();
  const supabase = await createClient();
  const [services, staff, settings] = await Promise.all([getServices(), getStaffOptions(), getSettings()]);

  const view = sp.view === "closed" || sp.view === "all" ? sp.view : "open";
  const mine = sp.mine === "1";

  let query = supabase
    .from("cases")
    .select(
      "id, reference, title, stage, priority, service_level, deadline, last_activity_at, cipo_complete, client:clients!cases_client_id_fkey(full_name, hebrew_name), service:services!cases_service_id_fkey(name), assigned:staff!cases_assigned_to_fkey(id, full_name)",
    )
    .order("last_activity_at", { ascending: false })
    .limit(1000);
  if (view === "open") query = query.neq("stage", "closed");
  if (view === "closed") query = query.eq("stage", "closed");
  if (sp.stage && STAGES.some((s) => s.value === sp.stage)) query = query.eq("stage", sp.stage as (typeof STAGES)[number]["value"]);
  if (sp.priority && PRIORITIES.some((p) => p.value === sp.priority))
    query = query.eq("priority", sp.priority as (typeof PRIORITIES)[number]["value"]);
  if (isUuid(sp.service)) query = query.eq("service_id", sp.service);
  if (mine) query = query.or(`assigned_to.eq.${me.id},manager_id.eq.${me.id}`);
  else if (isUuid(sp.staff)) query = query.eq("assigned_to", sp.staff);

  const { data: cases } = await query;

  return (
    <>
      <PageHeader
        title="Cases"
        subtitle={`${cases?.length ?? 0} ${view === "all" ? "" : view} cases${mine ? " assigned to me" : ""}`}
        actions={<LinkButton href="/cases/new">New case</LinkButton>}
      />

      <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <Select name="view" defaultValue={view} aria-label="Open or closed" options={[
          { value: "open", label: "Open cases" },
          { value: "closed", label: "Closed cases" },
          { value: "all", label: "All cases" },
        ]} />
        <Select name="stage" defaultValue={sp.stage ?? ""} aria-label="Stage" placeholder="Any stage" options={STAGES} />
        <Select
          name="service"
          defaultValue={sp.service ?? ""}
          aria-label="Service"
          placeholder="Any service"
          options={services.map((s) => ({ value: s.id, label: s.name }))}
        />
        <Select name="staff" defaultValue={sp.staff ?? ""} aria-label="Assigned to" placeholder="Anyone" options={staff} />
        <Select name="priority" defaultValue={sp.priority ?? ""} aria-label="Priority" placeholder="Any priority" options={PRIORITIES} />
        <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <input type="checkbox" name="mine" value="1" defaultChecked={mine} className="size-4" /> My cases
        </label>
        <div className="flex gap-2">
          <button className={buttonClass("secondary")}>Filter</button>
          <Link href="/cases" className={buttonClass("ghost")}>
            Reset
          </Link>
        </div>
      </form>

      <CaseTable
        staleDays={settings.staleAfterDays}
        rows={(cases ?? []).map((c) => ({
          id: c.id,
          reference: c.reference,
          title: c.title,
          stage: c.stage,
          priority: c.priority,
          service_level: c.service_level,
          deadline: c.deadline,
          last_activity_at: c.last_activity_at,
          client: c.client?.full_name ?? "",
          client_he: c.client?.hebrew_name ?? null,
          service: c.service?.name ?? "",
          assigned: c.assigned?.full_name ?? null,
        }))}
      />
    </>
  );
}
