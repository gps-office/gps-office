import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getCase, getSettings } from "@/lib/queries";
import {
  CARRIERS,
  DOCUMENT_CATEGORIES,
  SHIPMENT_DIRECTIONS,
  SHIPMENT_STATUSES,
  labelOf,
  stageIndex,
} from "@/lib/constants";
import { daysUntil, formatDate, formatDateTime } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, EmptyState, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { ExpiryBadge } from "@/components/badges";
import { addShipment, deleteDocument, updateDocument, updateShipment } from "./actions";
import { AddDocumentForm, NewVersionUpload, OpenFile, ReturnedCheckbox } from "./upload";

export const metadata = { title: "Documents" };

function trackingUrl(carrier: string, n: string | null) {
  if (!n) return null;
  const c = carrier.toLowerCase();
  if (c.includes("royal mail")) return `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n)}`;
  if (c.includes("dhl")) return `https://www.dhl.com/gb-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(n)}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`;
  return null;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export default async function DocumentsPage({ params }: PageProps<"/cases/[id]/documents">) {
  const { id } = await params;
  const [c, me, settings] = await Promise.all([getCase(id), getCurrentStaff(), getSettings()]);
  const supabase = await createClient();
  const [{ data: items }, { data: docs }, { data: people }, { data: shipments }] = await Promise.all([
    supabase
      .from("service_checklist_items")
      .select("id, label, required")
      .eq("service_id", c.service_id)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("documents")
      .select(
        "*, person:case_people!documents_person_id_fkey(full_name), versions:document_versions(id, version, file_name, size_bytes, uploaded_at, uploader:staff!document_versions_uploaded_by_fkey(full_name))",
      )
      .eq("case_id", c.id)
      .order("created_at"),
    supabase.from("case_people").select("id, full_name").eq("case_id", c.id).order("created_at"),
    supabase.from("shipments").select("*").eq("case_id", c.id).order("created_at", { ascending: false }),
  ]);

  const docList = (docs ?? []).map((d) => ({ ...d, versions: [...d.versions].sort((a, b) => b.version - a.version) }));
  const checklist = (items ?? []).map((item) => ({
    ...item,
    docs: docList.filter((d) => d.checklist_item_id === item.id),
  }));
  const required = checklist.filter((i) => i.required);
  const missing = required.filter((i) => i.docs.length === 0);
  const expiring = docList.filter((d) => {
    const n = daysUntil(d.expires_on);
    return n !== null && n <= settings.passportWarningDays;
  });
  const originalsHeld = docList.filter((d) => d.is_original && !d.returned_to_client);
  const pastApproval = stageIndex(c.stage) >= stageIndex("approved");
  const shipmentOptions = (shipments ?? []).map((s) => ({
    value: s.id,
    label: `${s.carrier}${s.tracking_number ? ` ${s.tracking_number}` : ""} · ${labelOf(SHIPMENT_DIRECTIONS, s.direction)}`,
  }));

  return (
    <div className="space-y-6">
      {(missing.length > 0 || expiring.length > 0 || (pastApproval && originalsHeld.length > 0)) && (
        <div className="space-y-2">
          {missing.length > 0 && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              <strong>{missing.length} required document{missing.length === 1 ? "" : "s"} missing:</strong>{" "}
              {missing.map((m) => m.label).join(" · ")}
            </p>
          )}
          {expiring.length > 0 && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <strong>Expiry warning:</strong>{" "}
              {expiring.map((d) => `${d.name} (${formatDate(d.expires_on)})`).join(" · ")}
            </p>
          )}
          {pastApproval && originalsHeld.length > 0 && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <strong>Originals still held:</strong> {originalsHeld.map((d) => d.name).join(" · ")} — return them before closing the case.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={`Checklist · ${required.length - missing.length} of ${required.length} required`} className="lg:col-span-1">
          {checklist.length === 0 ? (
            <EmptyState>No checklist for this service. The office manager can add one in Settings.</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span
                    className={cx(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                      item.docs.length ? "bg-emerald-100 text-emerald-700" : item.required ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-400",
                    )}
                    aria-hidden
                  >
                    {item.docs.length ? "✓" : item.required ? "!" : "–"}
                  </span>
                  <div>
                    <div className={item.docs.length ? "text-slate-600" : "text-slate-900"}>
                      {item.label}
                      {!item.required && <span className="ml-1 text-xs text-slate-400">(if applicable)</span>}
                    </div>
                    {item.docs.map((d) => (
                      <div key={d.id} className="text-xs text-slate-500">
                        {d.name} · {d.is_original ? "original" : "copy"}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Documents (${docList.length})`} padded={false} className="lg:col-span-2">
          {docList.length === 0 ? (
            <EmptyState>No documents yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {docList.map((d) => (
                <li key={d.id} className="px-4 py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-medium text-slate-900" dir="auto">
                        {d.name}
                      </span>
                      <Badge>{labelOf(DOCUMENT_CATEGORIES, d.category)}</Badge>
                      {d.is_original ? (
                        d.returned_to_client ? <Badge tone="green">Original · returned</Badge> : <Badge tone="amber">Original · held</Badge>
                      ) : (
                        <Badge tone="slate">Copy</Badge>
                      )}
                      {d.person && <span className="text-slate-500">{d.person.full_name}</span>}
                      {d.expires_on && <ExpiryBadge date={d.expires_on} warnDays={settings.passportWarningDays} />}
                      <span className="ml-auto text-xs text-slate-500">
                        {d.versions.length ? `${d.versions.length} file${d.versions.length > 1 ? "s" : ""}` : "No file"}
                      </span>
                    </summary>

                    <div className="mt-3 space-y-4 border-t border-slate-100 pt-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="text-xs font-medium tracking-wide text-slate-500 uppercase">Files</h3>
                          <NewVersionUpload documentId={d.id} />
                        </div>
                        {d.versions.length === 0 ? (
                          <p className="text-sm text-slate-500">No file uploaded.</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {d.versions.map((v, i) => (
                              <li key={v.id} className="flex flex-wrap items-center gap-x-3">
                                <span className="text-slate-500">v{v.version}</span>
                                <OpenFile versionId={v.id}>{v.file_name}</OpenFile>
                                <span className="text-xs text-slate-500">
                                  {formatSize(v.size_bytes)} · {v.uploader?.full_name} · {formatDateTime(v.uploaded_at)}
                                </span>
                                {i === 0 && d.versions.length > 1 && <Badge tone="blue">Latest</Badge>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <ActionForm action={updateDocument} className="space-y-3">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="case_id" value={c.id} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Field label="Name">
                            <Input name="name" defaultValue={d.name} required />
                          </Field>
                          <Field label="Category">
                            <Select name="category" options={DOCUMENT_CATEGORIES} defaultValue={d.category} />
                          </Field>
                          <Field label="Checklist item">
                            <Select
                              name="checklist_item_id"
                              options={(items ?? []).map((i) => ({ value: i.id, label: i.label }))}
                              defaultValue={d.checklist_item_id ?? ""}
                              placeholder="— None —"
                            />
                          </Field>
                          <Field label="Belongs to">
                            <Select
                              name="person_id"
                              options={(people ?? []).map((p) => ({ value: p.id, label: p.full_name }))}
                              defaultValue={d.person_id ?? ""}
                              placeholder="— Whole case —"
                            />
                          </Field>
                          <Field label="Original or copy">
                            <Select
                              name="is_original"
                              options={[
                                { value: "copy", label: "Copy / scan" },
                                { value: "original", label: "Original (we hold it)" },
                              ]}
                              defaultValue={d.is_original ? "original" : "copy"}
                            />
                          </Field>
                          <Field label="Received on">
                            <Input name="received_on" type="date" defaultValue={d.received_on ?? ""} />
                          </Field>
                          <Field label="Expiry date">
                            <Input name="expires_on" type="date" defaultValue={d.expires_on ?? ""} />
                          </Field>
                        </div>
                        {d.is_original && (
                          <div className="grid gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
                            <div className="flex items-end pb-2">
                              <ReturnedCheckbox defaultChecked={d.returned_to_client} />
                            </div>
                            <Field label="Returned on">
                              <Input name="returned_on" type="date" defaultValue={d.returned_on ?? ""} />
                            </Field>
                            <Field label="Sent back by">
                              <Select
                                name="return_shipment_id"
                                options={shipmentOptions}
                                defaultValue={d.return_shipment_id ?? ""}
                                placeholder="— Hand-collected / not recorded —"
                              />
                            </Field>
                          </div>
                        )}
                        <Field label="Notes">
                          <Textarea name="notes" defaultValue={d.notes ?? ""} rows={2} />
                        </Field>
                        <SubmitButton size="sm">Save document</SubmitButton>
                      </ActionForm>
                      {me.role === "admin" && (
                        <ActionForm action={deleteDocument}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="case_id" value={c.id} />
                          <SubmitButton size="sm" variant="danger" pendingText="Deleting…">
                            Delete document and its files
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Add a document">
        <AddDocumentForm
          caseId={c.id}
          categories={DOCUMENT_CATEGORIES}
          checklist={(items ?? []).map((i) => ({ value: i.id, label: i.label }))}
          people={(people ?? []).map((p) => ({ value: p.id, label: p.full_name }))}
        />
      </Card>

      <Card title="Courier tracking" padded={false}>
        {shipments?.length ? (
          <ul className="divide-y divide-slate-100">
            {shipments.map((s) => {
              const url = trackingUrl(s.carrier, s.tracking_number);
              return (
                <li key={s.id} className="px-4 py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-medium">{s.carrier}</span>
                      {s.tracking_number &&
                        (url ? (
                          <a href={url} target="_blank" rel="noreferrer noopener" className="font-mono text-brand-700 hover:underline">
                            {s.tracking_number}
                          </a>
                        ) : (
                          <span className="font-mono">{s.tracking_number}</span>
                        ))}
                      <span className="text-slate-500">{labelOf(SHIPMENT_DIRECTIONS, s.direction)}</span>
                      <Badge tone={s.status === "delivered" ? "green" : s.status === "lost" ? "red" : s.status === "in_transit" ? "blue" : "slate"}>
                        {labelOf(SHIPMENT_STATUSES, s.status)}
                      </Badge>
                      <span className="text-slate-500">Sent {formatDate(s.sent_on)}</span>
                      <span className="ml-auto text-xs text-brand-600">Update</span>
                    </summary>
                    <ActionForm action={updateShipment} className="mt-3">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="case_id" value={c.id} />
                      <ShipmentFields s={s} />
                      <SubmitButton size="sm" className="mt-3">
                        Save
                      </SubmitButton>
                    </ActionForm>
                  </details>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState>No shipments recorded.</EmptyState>
        )}
        <details className="border-t border-slate-200 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-700">+ Add a shipment</summary>
          <ActionForm action={addShipment} resetOnSuccess className="mt-3">
            <input type="hidden" name="case_id" value={c.id} />
            <ShipmentFields />
            <SubmitButton size="sm" className="mt-3">
              Add shipment
            </SubmitButton>
          </ActionForm>
        </details>
      </Card>
    </div>
  );
}

function ShipmentFields({ s }: { s?: Record<string, string | null> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Carrier">
        <Select name="carrier" options={CARRIERS.map((x) => ({ value: x, label: x }))} defaultValue={s?.carrier ?? CARRIERS[0]} />
      </Field>
      <Field label="Tracking number">
        <Input name="tracking_number" defaultValue={s?.tracking_number ?? ""} />
      </Field>
      <Field label="Direction">
        <Select name="direction" options={SHIPMENT_DIRECTIONS} defaultValue={s?.direction ?? "to_client"} />
      </Field>
      <Field label="Status">
        <Select name="status" options={SHIPMENT_STATUSES} defaultValue={s?.status ?? "pending"} />
      </Field>
      <Field label="Sent on">
        <Input name="sent_on" type="date" defaultValue={s?.sent_on ?? ""} />
      </Field>
      <Field label="Delivered on">
        <Input name="delivered_on" type="date" defaultValue={s?.delivered_on ?? ""} />
      </Field>
      <Field label="Notes" className="sm:col-span-3">
        <Input name="notes" defaultValue={s?.notes ?? ""} />
      </Field>
    </div>
  );
}
