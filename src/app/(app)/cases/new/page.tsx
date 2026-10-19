import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getServices, getStaffOptions } from "@/lib/queries";
import { isUuid } from "@/lib/forms";
import { PRIORITIES, SERVICE_LEVELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { createCase } from "../actions";

export const metadata = { title: "New case" };

export default async function NewCasePage({ searchParams }: PageProps<"/cases/new">) {
  const { client } = await searchParams;
  const me = await getCurrentStaff();
  const supabase = await createClient();
  const [{ data: clients }, services, staff] = await Promise.all([
    supabase.from("clients").select("id, full_name, date_of_birth").order("full_name").limit(2000),
    getServices(),
    getStaffOptions(),
  ]);
  const activeStaff = staff.filter((s) => s.active);
  const preselected = isUuid(client) ? client : "";

  // Group services by category for the dropdown.
  const categories = [...new Set(services.filter((s) => s.active).map((s) => s.category))];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New case" subtitle="The case reference (GPS-YY-NNNN) is assigned automatically." />
      <Card>
        <ActionForm action={createCase} className="space-y-4">
          <Field label="Client" hint="Not listed? Create the client first.">
            <Select
              name="client_id"
              required
              defaultValue={preselected}
              placeholder="Choose a client…"
              options={(clients ?? []).map((c) => ({
                value: c.id,
                label: c.date_of_birth ? `${c.full_name} (${formatDate(c.date_of_birth)})` : c.full_name,
              }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Service" className="sm:col-span-2">
              <select name="service_id" required defaultValue="" className="field">
                <option value="">Choose a service…</option>
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {services
                      .filter((s) => s.active && s.category === cat)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Service level">
              <Select name="service_level" options={SERVICE_LEVELS} defaultValue="standard" />
            </Field>
          </div>
          <Field label="Short description (optional)">
            <Input name="title" placeholder="e.g. Child’s first British passport" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assigned to">
              <Select name="assigned_to" options={activeStaff} defaultValue={me.id} placeholder="Unassigned" />
            </Field>
            <Field label="Responsible manager">
              <Select name="manager_id" options={activeStaff} placeholder="None" />
            </Field>
            <Field label="Priority">
              <Select name="priority" options={PRIORITIES} defaultValue="normal" />
            </Field>
            <Field label="Deadline">
              <Input name="deadline" type="date" />
            </Field>
          </div>
          <Field label="Next action">
            <Input name="next_action" placeholder="e.g. Send document checklist to client" />
          </Field>
          <Field label="Enquiry notes (added to the D&N)">
            <Textarea name="first_note" rows={4} />
          </Field>
          <div className="flex gap-2 pt-2">
            <SubmitButton pendingText="Creating…">Create case</SubmitButton>
            <LinkButton href="/cases" variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
