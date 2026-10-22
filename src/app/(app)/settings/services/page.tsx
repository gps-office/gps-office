import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, Checkbox, Field, Input, Textarea } from "@/components/ui";
import { addChecklistItem, addService, updateChecklistItem, updateService } from "./actions";

export const metadata = { title: "Services" };

type ServiceLike = {
  name?: string;
  category?: string;
  description?: string | null;
  price_standard?: number | null;
  price_premium?: number | null;
  price_urgent?: number | null;
  sort_order?: number;
};

function ServiceFields({ s }: { s?: ServiceLike }) {
  const price = (v: number | null | undefined) => (v == null ? "" : Number(v).toFixed(2));
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label="Name" className="sm:col-span-3">
        <Input name="name" defaultValue={s?.name ?? ""} required />
      </Field>
      <Field label="Group" className="sm:col-span-2">
        <Input name="category" defaultValue={s?.category ?? ""} placeholder="e.g. United Kingdom" />
      </Field>
      <Field label="Order">
        <Input name="sort_order" type="number" defaultValue={s?.sort_order ?? ""} />
      </Field>
      <Field label="Standard £" className="sm:col-span-2">
        <Input name="price_standard" inputMode="decimal" defaultValue={price(s?.price_standard)} />
      </Field>
      <Field label="Premium £" className="sm:col-span-2">
        <Input name="price_premium" inputMode="decimal" defaultValue={price(s?.price_premium)} />
      </Field>
      <Field label="Urgent £" className="sm:col-span-2">
        <Input name="price_urgent" inputMode="decimal" defaultValue={price(s?.price_urgent)} />
      </Field>
      <Field label="Description" className="sm:col-span-6">
        <Textarea name="description" defaultValue={s?.description ?? ""} rows={2} />
      </Field>
    </div>
  );
}

export default async function ServicesSettingsPage() {
  const supabase = await createClient();
  const [{ data: services }, { data: items }] = await Promise.all([
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("service_checklist_items").select("*").order("sort_order"),
  ]);

  return (
    <div className="space-y-6">
      <Card title="Services, document checklists and price list" padded={false}>
        <ul className="divide-y divide-slate-200">
          {(services ?? []).map((s) => {
            const list = (items ?? []).filter((i) => i.service_id === s.id);
            return (
              <li key={s.id} className="px-4 py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium text-slate-900">{s.name}</span>
                    <span className="text-slate-500">{s.category}</span>
                    {!s.active && <Badge tone="red">Not offered</Badge>}
                    <span className="text-xs text-slate-500">{list.filter((i) => i.active).length} checklist items</span>
                    <span className="ml-auto text-xs text-slate-600 tabular-nums">
                      {[s.price_standard, s.price_premium, s.price_urgent].some((p) => p != null)
                        ? `${formatMoney(s.price_standard)} · ${formatMoney(s.price_premium)} · ${formatMoney(s.price_urgent)}`
                        : <span className="text-amber-700">No prices set</span>}
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-6 border-t border-slate-100 pt-4 lg:grid-cols-2">
                    <ActionForm action={updateService} className="space-y-3">
                      <input type="hidden" name="id" value={s.id} />
                      <ServiceFields s={s} />
                      <Checkbox name="active" defaultChecked={s.active} label="Offered (shown when opening new cases)" />
                      <div>
                        <SubmitButton size="sm">Save service</SubmitButton>
                      </div>
                    </ActionForm>
                    <div>
                      <h3 className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">Document checklist</h3>
                      <ul className="space-y-1">
                        {list.map((i) => (
                          <li key={i.id}>
                            <ActionForm action={updateChecklistItem} className="flex flex-wrap items-center gap-2">
                              <input type="hidden" name="id" value={i.id} />
                              <Input name="sort_order" type="number" defaultValue={i.sort_order} className="w-16 py-1" aria-label="Order" />
                              <Input name="label" defaultValue={i.label} className={`min-w-48 flex-1 py-1 ${i.active ? "" : "text-slate-400 line-through"}`} aria-label="Document" />
                              <Checkbox name="required" defaultChecked={i.required} label="Required" />
                              <Checkbox name="active" defaultChecked={i.active} label="In use" />
                              <SubmitButton size="sm" variant="secondary" pendingText="…">
                                Save
                              </SubmitButton>
                            </ActionForm>
                          </li>
                        ))}
                      </ul>
                      <ActionForm action={addChecklistItem} resetOnSuccess className="mt-3 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="service_id" value={s.id} />
                        <Input name="label" placeholder="Add a document to the checklist…" className="min-w-48 flex-1 py-1" aria-label="New checklist item" />
                        <Checkbox name="required" defaultChecked label="Required" />
                        <SubmitButton size="sm" pendingText="…">
                          Add
                        </SubmitButton>
                      </ActionForm>
                      <p className="mt-2 text-xs text-slate-500">
                        Untick “In use” rather than deleting, so existing cases keep their history.
                      </p>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Add a service">
        <ActionForm action={addService} resetOnSuccess className="space-y-3">
          <ServiceFields />
          <SubmitButton size="sm">Add service</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
