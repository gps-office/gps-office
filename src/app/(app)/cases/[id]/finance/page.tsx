import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getCase, getServices } from "@/lib/queries";
import { FINANCE_TYPES, SERVICE_LEVELS, labelOf } from "@/lib/constants";
import { formatDate, formatMoney, todayLondon } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Stat, type Tone } from "@/components/ui";
import { addFinanceLine, deleteFinanceLine, updateFinanceLine } from "./actions";

export const metadata = { title: "Case finance" };

const KIND_TONE: Record<string, Tone> = { info: "slate", charge: "amber", payment: "green", refund: "red" };
const METHODS = ["Bank transfer", "Card", "Cash", "Cheque", "Other"].map((m) => ({ value: m, label: m }));

function LineFields({ line }: { line?: { line_type: string; amount: number; line_date: string; description: string | null; payment_method: string | null } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <Field label="Type">
        <Select name="line_type" options={FINANCE_TYPES} defaultValue={line?.line_type ?? "invoice"} />
      </Field>
      <Field label="Amount (£)">
        <Input name="amount" inputMode="decimal" defaultValue={line ? Number(line.amount).toFixed(2) : ""} required placeholder="0.00" />
      </Field>
      <Field label="Date">
        <Input name="line_date" type="date" defaultValue={line?.line_date ?? todayLondon()} />
      </Field>
      <Field label="Description" className="sm:col-span-1">
        <Input name="description" defaultValue={line?.description ?? ""} />
      </Field>
      <Field label="Method (payments)">
        <Select name="payment_method" options={METHODS} defaultValue={line?.payment_method ?? ""} placeholder="—" />
      </Field>
    </div>
  );
}

export default async function CaseFinancePage({ params }: PageProps<"/cases/[id]/finance">) {
  const { id } = await params;
  const [c, me, services] = await Promise.all([getCase(id), getCurrentStaff(), getServices()]);
  const supabase = await createClient();
  const [{ data: lines }, { data: balance }] = await Promise.all([
    supabase.from("finance_lines").select("*").eq("case_id", c.id).order("line_date").order("created_at"),
    supabase.from("case_balances").select("*").eq("case_id", c.id).maybeSingle(),
  ]);
  const service = services.find((s) => s.id === c.service_id);
  const listPrice =
    c.service_level === "premium" ? service?.price_premium : c.service_level === "urgent" ? service?.price_urgent : service?.price_standard;
  const owed = Number(balance?.balance ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Quoted" value={formatMoney(balance?.quoted ?? 0)} />
        <Stat label="Charged" value={formatMoney(balance?.charged ?? 0)} />
        <Stat label="Paid (net of refunds)" value={formatMoney(balance?.paid ?? 0)} />
        <Stat label={owed < 0 ? "In credit" : "Balance due"} value={formatMoney(Math.abs(owed))} tone={owed > 0 ? "red" : undefined} />
      </div>

      <Card title="Entries" padded={false}>
        {lines?.length ? (
          <ul className="divide-y divide-slate-100">
            {lines.map((l) => {
              const kind = FINANCE_TYPES.find((t) => t.value === l.line_type)?.kind ?? "info";
              return (
                <li key={l.id} className="px-4 py-2.5">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="w-24 text-slate-500">{formatDate(l.line_date)}</span>
                      <Badge tone={KIND_TONE[kind]}>{labelOf(FINANCE_TYPES, l.line_type)}</Badge>
                      <span className="text-slate-700" dir="auto">
                        {l.description}
                      </span>
                      {l.payment_method && <span className="text-xs text-slate-500">{l.payment_method}</span>}
                      <span className={`ml-auto font-medium tabular-nums ${kind === "payment" ? "text-emerald-700" : kind === "refund" ? "text-red-700" : kind === "info" ? "text-slate-400" : "text-slate-900"}`}>
                        {kind === "payment" ? "+" : kind === "refund" ? "−" : ""}
                        {formatMoney(l.amount)}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                      <ActionForm action={updateFinanceLine} className="space-y-3">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="case_id" value={c.id} />
                        <LineFields line={l} />
                        <SubmitButton size="sm">Save</SubmitButton>
                      </ActionForm>
                      {me.role === "admin" && (
                        <ActionForm action={deleteFinanceLine}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="case_id" value={c.id} />
                          <SubmitButton size="sm" variant="danger" pendingText="Deleting…">
                            Delete entry
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>No quotes, charges or payments yet.</EmptyState>
        )}
      </Card>

      <Card title="Add an entry">
        {listPrice != null && (
          <p className="mb-3 text-sm text-slate-600">
            Price list: {service?.name} · {labelOf(SERVICE_LEVELS, c.service_level)} ={" "}
            <strong className="text-slate-900">{formatMoney(listPrice)}</strong>
          </p>
        )}
        <ActionForm action={addFinanceLine} resetOnSuccess className="space-y-3">
          <input type="hidden" name="case_id" value={c.id} />
          <LineFields />
          <SubmitButton size="sm">Add entry</SubmitButton>
        </ActionForm>
        <p className="mt-3 text-xs text-slate-500">
          Balance = invoices + government, solicitor and courier fees − (deposits + payments − refunds). Quotations are for reference only.
        </p>
      </Card>
    </div>
  );
}
