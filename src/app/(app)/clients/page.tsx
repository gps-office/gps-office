import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/queries";
import { LinkButton, PageHeader } from "@/components/ui";
import { ClientTable } from "./client-table";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = await createClient();
  const [{ data: clients }, settings] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, hebrew_name, date_of_birth, nationality, passport_number, passport_expiry, phone, email, cases(count)")
      .order("full_name")
      .limit(2000),
    getSettings(),
  ]);

  const rows = (clients ?? []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    hebrew_name: c.hebrew_name,
    date_of_birth: c.date_of_birth,
    nationality: c.nationality,
    passport_number: c.passport_number,
    passport_expiry: c.passport_expiry,
    phone: c.phone,
    email: c.email,
    cases: c.cases[0]?.count ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${rows.length} clients`}
        actions={<LinkButton href="/clients/new">New client</LinkButton>}
      />
      <ClientTable rows={rows} warnDays={settings.passportWarningDays} />
    </>
  );
}
