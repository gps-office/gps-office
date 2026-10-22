import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { isUuid } from "@/lib/forms";
import { RELATIONSHIPS, labelOf, type Relationship } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Detail, EmptyState, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { DueDate, ExpiryBadge, StageBadge } from "@/components/badges";
import { addClientLink, removeClientLink } from "../actions";

export const metadata = { title: "Client" };

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const me = await getCurrentStaff();
  const supabase = await createClient();

  const [{ data: client }, { data: cases }, { data: linksFrom }, { data: linksTo }, { data: allClients }, settings] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("cases")
        .select("id, reference, title, stage, deadline, opened_at, service:services!cases_service_id_fkey(name), assigned:staff!cases_assigned_to_fkey(full_name)")
        .eq("client_id", id)
        .order("opened_at", { ascending: false }),
      supabase
        .from("client_links")
        .select("id, relationship, notes, other:clients!client_links_related_client_id_fkey(id, full_name, hebrew_name, passport_expiry)")
        .eq("client_id", id),
      supabase
        .from("client_links")
        .select("id, relationship, notes, other:clients!client_links_client_id_fkey(id, full_name, hebrew_name, passport_expiry)")
        .eq("related_client_id", id),
      supabase.from("clients").select("id, full_name, date_of_birth").neq("id", id).order("full_name").limit(2000),
      getSettings(),
    ]);
  if (!client) notFound();

  // Show each link from this client's point of view.
  const inverse = (r: Relationship) => RELATIONSHIPS.find((x) => x.value === r)!.inverse;
  const family = [
    ...(linksFrom ?? []).map((l) => ({ ...l, label: labelOf(RELATIONSHIPS, l.relationship) })),
    ...(linksTo ?? []).map((l) => ({ ...l, label: labelOf(RELATIONSHIPS, inverse(l.relationship)) })),
  ];

  return (
    <>
      <PageHeader
        title={
          <span dir="auto">
            {client.full_name}
            {client.hebrew_name && (
              <span className="ml-3 text-lg font-normal text-slate-500" dir="rtl" lang="he">
                {client.hebrew_name}
              </span>
            )}
          </span>
        }
        subtitle={`Client since ${formatDate(client.created_at)}`}
        actions={
          <>
            <LinkButton href={`/clients/${client.id}/edit`} variant="secondary">
              Edit details
            </LinkButton>
            <LinkButton href={`/cases/new?client=${client.id}`}>New case</LinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`Cases (${cases?.length ?? 0})`} padded={false}>
            {cases?.length ? (
              <ul className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <li key={c.id}>
                    <Link href={`/cases/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
                      <span className="font-mono text-sm font-medium text-brand-700">{c.reference}</span>
                      <span className="text-sm text-slate-800">{c.service?.name}</span>
                      {c.title && <span className="text-sm text-slate-500">{c.title}</span>}
                      <span className="ml-auto flex items-center gap-3 text-sm">
                        {c.deadline && <DueDate date={c.deadline} closed={c.stage === "closed"} />}
                        <StageBadge stage={c.stage} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState>No cases yet.</EmptyState>
            )}
          </Card>

          <Card title="Family links">
            {family.length ? (
              <ul className="mb-4 divide-y divide-slate-100">
                {family.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="w-28 text-slate-500">{l.label}</span>
                    <Link href={`/clients/${l.other!.id}`} className="font-medium text-brand-700 hover:underline" dir="auto">
                      {l.other!.full_name}
                    </Link>
                    {l.other!.hebrew_name && <span className="text-slate-500" dir="rtl">{l.other!.hebrew_name}</span>}
                    <ExpiryBadge date={l.other!.passport_expiry} warnDays={settings.passportWarningDays} />
                    {l.notes && <span className="text-slate-500">· {l.notes}</span>}
                    {me.role === "admin" && (
                      <ActionForm action={removeClientLink} className="ml-auto">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="client_id" value={client.id} />
                        <SubmitButton size="sm" variant="ghost" pendingText="…">
                          Remove
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-slate-500">No family members linked.</p>
            )}
            <ActionForm action={addClientLink} className="grid gap-2 sm:grid-cols-[1fr_10rem_1fr_auto]">
              <input type="hidden" name="client_id" value={client.id} />
              <Select
                name="related_client_id"
                aria-label="Family member"
                placeholder="Choose a client…"
                required
                options={(allClients ?? []).map((c) => ({
                  value: c.id,
                  label: c.date_of_birth ? `${c.full_name} (${formatDate(c.date_of_birth)})` : c.full_name,
                }))}
              />
              <Select name="relationship" aria-label="Relationship" options={RELATIONSHIPS} placeholder="is their…" required />
              <Input name="notes" placeholder="Notes (optional)" aria-label="Notes" />
              <SubmitButton size="md" variant="secondary">
                Link
              </SubmitButton>
            </ActionForm>
            <p className="mt-2 text-xs text-slate-500">
              Read as: the chosen client is this client’s <em>relationship</em>. Add the family member as a client first if needed.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="divide-y divide-slate-100">
              <Detail label="Date of birth">{formatDate(client.date_of_birth)}</Detail>
              <Detail label="Nationality">{client.nationality}</Detail>
              <Detail label="Passport">{client.passport_number && <span className="font-mono">{client.passport_number}</span>}</Detail>
              <Detail label="Passport expiry">
                <ExpiryBadge date={client.passport_expiry} warnDays={settings.passportWarningDays} />
              </Detail>
              <Detail label="Phone">{client.phone && <a href={`tel:${client.phone}`} className="text-brand-700">{client.phone}</a>}</Detail>
              <Detail label="WhatsApp">
                {client.whatsapp && (
                  <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-brand-700">
                    {client.whatsapp}
                  </a>
                )}
              </Detail>
              <Detail label="Email">{client.email && <a href={`mailto:${client.email}`} className="text-brand-700">{client.email}</a>}</Detail>
              <Detail label="Address">
                <span className="whitespace-pre-line">{client.address}</span>
              </Detail>
            </dl>
          </Card>
          {client.notes && (
            <Card title="Notes">
              <p className="text-sm whitespace-pre-line text-slate-700" dir="auto">
                {client.notes}
              </p>
            </Card>
          )}
          <p className="text-xs text-slate-400">Last updated {formatDateTime(client.updated_at)}</p>
        </div>
      </div>
    </>
  );
}
