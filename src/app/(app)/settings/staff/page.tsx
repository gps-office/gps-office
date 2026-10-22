import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, Checkbox, Field, Input, Select } from "@/components/ui";
import { inviteStaff, resendInvite, resetStaffMfa, updateStaff } from "./actions";

export const metadata = { title: "Staff" };

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin (manager)" },
];

function Specialisms({ services, selected }: { services: { code: string; name: string }[]; selected: string[] }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">Service specialisms</legend>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {services.map((s) => (
          <Checkbox key={s.code} name="specialisms" value={s.code} defaultChecked={selected.includes(s.code)} label={s.name} />
        ))}
      </div>
    </fieldset>
  );
}

export default async function StaffSettingsPage() {
  const me = await getCurrentStaff();
  const supabase = await createClient();
  const [{ data: staff }, { data: services }] = await Promise.all([
    supabase.from("staff").select("id, full_name, email, role, active, specialisms").order("full_name"),
    supabase.from("services").select("code, name").eq("active", true).order("sort_order"),
  ]);
  const serviceList = services ?? [];
  const serviceName = Object.fromEntries(serviceList.map((s) => [s.code, s.name]));

  return (
    <div className="space-y-6">
      <Card title="Invite a staff member">
        <ActionForm action={inviteStaff} resetOnSuccess className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Full name">
              <Input name="full_name" required placeholder="e.g. Mrs Wosner" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Field label="Role">
              <Select name="role" options={ROLES} defaultValue="staff" />
            </Field>
          </div>
          <Specialisms services={serviceList} selected={[]} />
          <p className="text-xs text-slate-500">
            They will get an email to choose a password, then set up two-factor authentication on first sign-in.
          </p>
          <SubmitButton pendingText="Sending…">Send invitation</SubmitButton>
        </ActionForm>
      </Card>

      <Card title={`Staff (${staff?.length ?? 0})`} padded={false}>
        <ul className="divide-y divide-slate-200">
          {(staff ?? []).map((s) => (
            <li key={s.id} className="px-4 py-3">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{s.full_name}</span>
                  <span className="text-sm text-slate-500">{s.email}</span>
                  {s.role === "admin" && <Badge tone="blue">Admin</Badge>}
                  {!s.active && <Badge tone="red">Inactive</Badge>}
                  {(s.specialisms ?? []).map((code: string) => (
                    <Badge key={code}>{serviceName[code] ?? code}</Badge>
                  ))}
                  <span className="ml-auto text-xs text-brand-600">Edit</span>
                </summary>
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <ActionForm action={updateStaff} className="space-y-4">
                    <input type="hidden" name="id" value={s.id} />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Full name">
                        <Input name="full_name" defaultValue={s.full_name} required />
                      </Field>
                      <Field label="Role">
                        <Select name="role" options={ROLES} defaultValue={s.role} disabled={s.id === me.id} />
                        {s.id === me.id && <input type="hidden" name="role" value={s.role} />}
                      </Field>
                      <div className="flex items-end pb-2">
                        {s.id === me.id ? (
                          <>
                            <input type="hidden" name="active" value="on" />
                            <span className="text-sm text-slate-500">This is you</span>
                          </>
                        ) : (
                          <Checkbox name="active" defaultChecked={s.active} label="Active (can sign in)" />
                        )}
                      </div>
                    </div>
                    <Specialisms services={serviceList} selected={s.specialisms ?? []} />
                    <SubmitButton size="sm">Save changes</SubmitButton>
                  </ActionForm>
                  {s.id !== me.id && (
                    <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                      <ActionForm action={resendInvite}>
                        <input type="hidden" name="email" value={s.email} />
                        <SubmitButton size="sm" variant="secondary" pendingText="Sending…">
                          Re-send invitation
                        </SubmitButton>
                      </ActionForm>
                      <ActionForm action={resetStaffMfa}>
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton size="sm" variant="danger" pendingText="Resetting…">
                          Reset two-factor (lost phone)
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
