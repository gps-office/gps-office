import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getCase, getServices, getSettings, getStaffOptions } from "@/lib/queries";
import { PRIORITIES, SERVICE_LEVELS, STAGES, labelOf, stageIndex } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Detail, EmptyState, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { ExpiryBadge } from "@/components/badges";
import { addPerson, changeStage, removePerson, updateCaseDetails, updateHeadline, updatePerson } from "../actions";

export const metadata = { title: "Case overview" };

function PersonFields({ p }: { p?: Record<string, string | null | boolean> }) {
  const v = (k: string) => (typeof p?.[k] === "string" ? (p[k] as string) : "");
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Full name">
        <Input name="full_name" defaultValue={v("full_name")} />
      </Field>
      <Field label="Hebrew name">
        <Input name="hebrew_name" defaultValue={v("hebrew_name")} dir="rtl" />
      </Field>
      <Field label="Relationship">
        <Input name="relationship" defaultValue={v("relationship")} placeholder="e.g. Child, Spouse" />
      </Field>
      <Field label="Date of birth">
        <Input name="date_of_birth" type="date" defaultValue={v("date_of_birth")} />
      </Field>
      <Field label="Nationality">
        <Input name="nationality" defaultValue={v("nationality")} />
      </Field>
      <Field label="Passport number">
        <Input name="passport_number" defaultValue={v("passport_number")} autoComplete="off" />
      </Field>
      <Field label="Passport expiry">
        <Input name="passport_expiry" type="date" defaultValue={v("passport_expiry")} />
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <Input name="notes" defaultValue={v("notes")} />
      </Field>
    </div>
  );
}

export default async function CaseOverviewPage({ params }: PageProps<"/cases/[id]">) {
  const { id } = await params;
  const [c, me, services, staff, settings] = await Promise.all([
    getCase(id),
    getCurrentStaff(),
    getServices(),
    getStaffOptions(),
    getSettings(),
  ]);
  const supabase = await createClient();
  const [{ data: people }, { data: clients }] = await Promise.all([
    supabase.from("case_people").select("*").eq("case_id", c.id).order("is_main_applicant", { ascending: false }).order("created_at"),
    supabase.from("clients").select("id, full_name, date_of_birth").order("full_name").limit(2000),
  ]);
  const current = stageIndex(c.stage);
  const activeStaff = staff.filter((s) => s.active || s.value === c.assigned_to || s.value === c.manager_id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Stage">
          <ol className="mb-4 grid grid-cols-7 gap-1">
            {STAGES.map((s, i) => (
              <li key={s.value} title={s.label}>
                <div className={cx("h-1.5 rounded-full", i <= current ? "bg-brand-600" : "bg-slate-200")} />
                <div className={cx("mt-1 hidden text-[11px] leading-tight md:block", i === current ? "font-semibold text-brand-700" : "text-slate-500")}>
                  {s.short}
                </div>
              </li>
            ))}
          </ol>
          <ActionForm action={changeStage} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Move case to" className="min-w-64 flex-1">
              <Select name="stage" options={STAGES} defaultValue={c.stage} />
            </Field>
            <SubmitButton variant="secondary">Update stage</SubmitButton>
          </ActionForm>
          {!c.cipo_complete && (
            <p className="mt-2 text-xs text-slate-500">
              The case can’t move past CIPO / Intake until all nine CIPO steps are ticked.
            </p>
          )}
        </Card>

        <Card title="Details & Notes headline">
          <ActionForm action={updateHeadline} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Next action">
              <Input name="next_action" defaultValue={c.next_action ?? ""} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Outstanding">
                <Textarea name="outstanding" defaultValue={c.outstanding ?? ""} />
              </Field>
              <Field label="Concerns">
                <Textarea name="concerns" defaultValue={c.concerns ?? ""} className={c.concerns ? "border-amber-300 bg-amber-50/40" : ""} />
              </Field>
            </div>
            <Field label="Key facts">
              <Textarea name="key_facts" defaultValue={c.key_facts ?? ""} rows={4} />
            </Field>
            <SubmitButton size="sm">Save headline</SubmitButton>
          </ActionForm>
        </Card>

        <Card title={`People on this case (${people?.length ?? 0})`} padded={false}>
          {people?.length ? (
            <ul className="divide-y divide-slate-100">
              {people.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium text-slate-900" dir="auto">
                        {p.full_name}
                      </span>
                      {p.hebrew_name && <span className="text-slate-500" dir="rtl">{p.hebrew_name}</span>}
                      <span className="text-slate-500">{p.relationship}</span>
                      <span className="text-slate-500">{formatDate(p.date_of_birth)}</span>
                      {p.passport_number && <span className="font-mono text-slate-600">{p.passport_number}</span>}
                      <ExpiryBadge date={p.passport_expiry} warnDays={settings.passportWarningDays} />
                      <span className="ml-auto text-xs text-brand-600">Edit</span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <ActionForm action={updatePerson} className="space-y-3">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="case_id" value={c.id} />
                        {p.client_id && <input type="hidden" name="client_id" value={p.client_id} />}
                        <PersonFields p={p} />
                        <SubmitButton size="sm">Save</SubmitButton>
                      </ActionForm>
                      {me.role === "admin" && (
                        <ActionForm action={removePerson}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="case_id" value={c.id} />
                          <SubmitButton size="sm" variant="danger" pendingText="Removing…">
                            Remove from case
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>No people recorded.</EmptyState>
          )}
          <details className="border-t border-slate-200 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-brand-700">+ Add a person</summary>
            <ActionForm action={addPerson} resetOnSuccess className="mt-3 space-y-3">
              <input type="hidden" name="case_id" value={c.id} />
              <Field label="Copy from an existing client (optional)">
                <Select
                  name="client_id"
                  placeholder="— Enter details below instead —"
                  options={(clients ?? []).map((cl) => ({
                    value: cl.id,
                    label: cl.date_of_birth ? `${cl.full_name} (${formatDate(cl.date_of_birth)})` : cl.full_name,
                  }))}
                />
              </Field>
              <PersonFields />
              <SubmitButton size="sm">Add person</SubmitButton>
            </ActionForm>
          </details>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Case details">
          <dl className="divide-y divide-slate-100">
            <Detail label="Service">{c.service?.name}</Detail>
            <Detail label="Level">{labelOf(SERVICE_LEVELS, c.service_level)}</Detail>
            <Detail label="Priority">{labelOf(PRIORITIES, c.priority)}</Detail>
            <Detail label="Manager">{c.manager?.full_name}</Detail>
            <Detail label="Home Office ref">{c.ref_home_office}</Detail>
            <Detail label="HMPO ref">{c.ref_hmpo}</Detail>
            <Detail label="USCIS ref">{c.ref_uscis}</Detail>
            <Detail label="Consulate ref">{c.ref_consulate}</Detail>
            <Detail label="Other ref">{c.ref_other}</Detail>
            {c.closed_at && <Detail label="Closed">{formatDate(c.closed_at)}</Detail>}
          </dl>
          <details className="mt-3 border-t border-slate-100 pt-3">
            <summary className="cursor-pointer text-sm font-medium text-brand-700">Edit case details</summary>
            <ActionForm action={updateCaseDetails} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={c.id} />
              <Field label="Service">
                <Select name="service_id" defaultValue={c.service_id} options={services.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              <Field label="Short description">
                <Input name="title" defaultValue={c.title ?? ""} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Level">
                  <Select name="service_level" options={SERVICE_LEVELS} defaultValue={c.service_level} />
                </Field>
                <Field label="Priority">
                  <Select name="priority" options={PRIORITIES} defaultValue={c.priority} />
                </Field>
              </div>
              <Field label="Assigned to">
                <Select name="assigned_to" options={activeStaff} defaultValue={c.assigned_to ?? ""} placeholder="Unassigned" />
              </Field>
              <Field label="Responsible manager">
                <Select name="manager_id" options={activeStaff} defaultValue={c.manager_id ?? ""} placeholder="None" />
              </Field>
              <Field label="Deadline">
                <Input name="deadline" type="date" defaultValue={c.deadline ?? ""} />
              </Field>
              <Field label="Home Office reference">
                <Input name="ref_home_office" defaultValue={c.ref_home_office ?? ""} />
              </Field>
              <Field label="HMPO reference">
                <Input name="ref_hmpo" defaultValue={c.ref_hmpo ?? ""} />
              </Field>
              <Field label="USCIS reference">
                <Input name="ref_uscis" defaultValue={c.ref_uscis ?? ""} />
              </Field>
              <Field label="Consulate reference">
                <Input name="ref_consulate" defaultValue={c.ref_consulate ?? ""} />
              </Field>
              <Field label="Other reference">
                <Input name="ref_other" defaultValue={c.ref_other ?? ""} />
              </Field>
              <SubmitButton size="sm">Save details</SubmitButton>
            </ActionForm>
          </details>
        </Card>
      </div>
    </div>
  );
}
