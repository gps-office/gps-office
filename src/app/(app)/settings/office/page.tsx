import { getSettings } from "@/lib/queries";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Field, Input } from "@/components/ui";
import { saveOfficeSettings } from "./actions";

export const metadata = { title: "Office settings" };

export default async function OfficeSettingsPage() {
  const s = await getSettings();
  return (
    <Card title="Office settings" className="max-w-xl">
      <ActionForm action={saveOfficeSettings} className="space-y-4">
        <Field label="Flag cases with no activity after (days)" hint="Shown on the dashboard as needing attention.">
          <Input name="stale_after_days" type="number" min={1} defaultValue={s.staleAfterDays} required />
        </Field>
        <Field label="Dashboard deadline window (days)" hint="Deadlines within this many days appear on the dashboard.">
          <Input name="deadline_window_days" type="number" min={1} defaultValue={s.deadlineWindowDays} required />
        </Field>
        <Field label="Warn about passport / document expiry within (days)">
          <Input name="passport_expiry_warning_days" type="number" min={1} defaultValue={s.passportWarningDays} required />
        </Field>
        <SubmitButton>Save settings</SubmitButton>
      </ActionForm>
    </Card>
  );
}
