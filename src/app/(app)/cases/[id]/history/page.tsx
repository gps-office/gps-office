import { createClient } from "@/lib/supabase/server";
import { getCase, getStaffOptions } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, type Tone } from "@/components/ui";
import type { Json } from "@/lib/database.types";
import { STAGE_LABEL, type Stage } from "@/lib/constants";

export const metadata = { title: "Case history" };

const TABLE_LABEL: Record<string, string> = {
  cases: "Case",
  case_people: "Person",
  cipo_checks: "CIPO",
  dn_entries: "D&N",
  documents: "Document",
  document_versions: "File",
  tasks: "Task",
  finance_lines: "Finance",
  shipments: "Shipment",
};

// Bookkeeping fields, and who/when stamps already shown on each row.
const HIDDEN = new Set([
  "id", "case_id", "created_at", "updated_at", "last_activity_at", "created_by", "storage_path", "document_id",
  "checked_at", "checked_by", "done_at", "done_by", "version", "closed_at",
]);

function humanise(field: string) {
  return field.replace(/_id$/, "").replace(/_/g, " ").replace(/^ref /, "ref. ");
}

function show(v: Json | undefined, names: Record<string, string> = {}): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && names[v]) return names[v];
  if (typeof v === "string" && v in STAGE_LABEL) return STAGE_LABEL[v as Stage];
  if (typeof v === "boolean") return v ? "yes" : "no";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

function summary(row: { table_name: string; new_data: Json; old_data: Json }) {
  const data = (row.new_data ?? row.old_data) as Record<string, Json> | null;
  if (!data) return "";
  const pick = ["name", "title", "full_name", "body", "line_type", "carrier", "file_name", "step"].find((k) => data[k] !== undefined && data[k] !== null);
  if (!pick) return "";
  const value = show(data[pick]);
  return pick === "step" ? `step ${value}` : value;
}

export default async function HistoryPage({ params }: PageProps<"/cases/[id]/history">) {
  const { id } = await params;
  const c = await getCase(id);
  const supabase = await createClient();
  const [{ data: rows }, staff] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, table_name, action, changed_by, changed_at, changed_fields, old_data, new_data")
      .eq("case_id", c.id)
      // The nine CIPO rows created with every case are not interesting history.
      .or("table_name.neq.cipo_checks,action.neq.INSERT")
      .order("changed_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(500),
    getStaffOptions(),
  ]);
  const names = Object.fromEntries(staff.map((s) => [s.value, s.label]));
  const tone: Record<string, Tone> = { INSERT: "green", UPDATE: "blue", DELETE: "red" };
  const verb: Record<string, string> = { INSERT: "added", UPDATE: "changed", DELETE: "deleted" };

  return (
    <Card title="History" padded={false} actions={<span className="text-xs text-slate-500">Every change, recorded automatically · latest 500</span>}>
      {!rows?.length ? (
        <EmptyState>No history yet.</EmptyState>
      ) : (
        <ol className="divide-y divide-slate-100">
          {rows.map((r) => {
            const fields = (r.changed_fields ?? []).filter((f) => !HIDDEN.has(f));
            const oldData = (r.old_data ?? {}) as Record<string, Json>;
            const newData = (r.new_data ?? {}) as Record<string, Json>;
            return (
              <li key={r.id} className="px-4 py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-36 shrink-0 text-xs text-slate-500">{formatDateTime(r.changed_at)}</span>
                  <Badge tone={tone[r.action]}>
                    {TABLE_LABEL[r.table_name] ?? r.table_name} {verb[r.action]}
                  </Badge>
                  <span className="text-slate-700">{r.changed_by ? (names[r.changed_by] ?? "Former staff") : "System"}</span>
                  <span className="truncate text-slate-500" dir="auto">
                    {summary(r)}
                  </span>
                </div>
                {r.action === "UPDATE" && fields.length > 0 && (
                  <ul className="mt-1 ml-0 space-y-0.5 text-xs text-slate-600 sm:ml-38">
                    {fields.map((f) => (
                      <li key={f} dir="auto">
                        <span className="text-slate-500">{humanise(f)}:</span> {show(oldData[f], names)} → <span className="text-slate-900">{show(newData[f], names)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
