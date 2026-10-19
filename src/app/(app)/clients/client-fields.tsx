import { Field, Input, Textarea } from "@/components/ui";
import type { Row } from "@/lib/db";

export function ClientFields({ client }: { client?: Partial<Row<"clients">> }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name (as on passport)">
          <Input name="full_name" defaultValue={client?.full_name ?? ""} required />
        </Field>
        <Field label="Hebrew name">
          <Input name="hebrew_name" defaultValue={client?.hebrew_name ?? ""} dir="rtl" lang="he" />
        </Field>
        <Field label="Date of birth">
          <Input name="date_of_birth" type="date" defaultValue={client?.date_of_birth ?? ""} />
        </Field>
        <Field label="Nationality / nationalities">
          <Input name="nationality" defaultValue={client?.nationality ?? ""} placeholder="e.g. British, Israeli" />
        </Field>
        <Field label="Passport number">
          <Input name="passport_number" defaultValue={client?.passport_number ?? ""} autoComplete="off" />
        </Field>
        <Field label="Passport expiry">
          <Input name="passport_expiry" type="date" defaultValue={client?.passport_expiry ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Phone">
          <Input name="phone" type="tel" defaultValue={client?.phone ?? ""} />
        </Field>
        <Field label="WhatsApp">
          <Input name="whatsapp" type="tel" defaultValue={client?.whatsapp ?? ""} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={client?.email ?? ""} />
        </Field>
      </div>
      <Field label="Address">
        <Textarea name="address" defaultValue={client?.address ?? ""} rows={2} />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={client?.notes ?? ""} />
      </Field>
    </div>
  );
}
