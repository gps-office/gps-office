"use client";

import { useMemo, useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, EmptyState, Select, Textarea, cx, type Tone } from "@/components/ui";
import { DN_TYPES, labelOf, type DnType } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { deleteEntry, togglePin, updateEntry } from "./actions";

type Entry = {
  id: string;
  type: DnType;
  body: string;
  occurredAt: string;
  pinned: boolean;
  edited: boolean;
  authorId: string | null;
  author: string;
};

const TONE: Record<DnType, Tone> = {
  note: "slate",
  call: "blue",
  email: "blue",
  whatsapp: "green",
  event: "purple",
  concern: "red",
  submission: "amber",
};

export function DnTimeline({ caseId, meId, isAdmin, entries }: { caseId: string; meId: string; isAdmin: boolean; entries: Entry[] }) {
  const [filter, setFilter] = useState<DnType | "">("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = entries.filter((e) => (!filter || e.type === filter) && (!term || e.body.toLowerCase().includes(term)));
    return [...list.filter((e) => e.pinned), ...list.filter((e) => !e.pinned)];
  }, [entries, filter, q]);

  return (
    <Card
      title={`Log (${entries.length})`}
      padded={false}
      actions={
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search log…" className="field w-40 py-1" dir="auto" aria-label="Search log" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as DnType | "")} className="field w-36 py-1" aria-label="Filter by type">
            <option value="">All types</option>
            {DN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </>
      }
    >
      {shown.length === 0 ? (
        <EmptyState>Nothing logged yet.</EmptyState>
      ) : (
        <ol className="divide-y divide-slate-100">
          {shown.map((e) => {
            const canEdit = isAdmin || e.authorId === meId;
            return (
              <li key={e.id} className={cx("px-4 py-3", e.pinned && "bg-amber-50/50", e.type === "concern" && "border-l-4 border-red-400")}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge tone={TONE[e.type]}>{labelOf(DN_TYPES, e.type)}</Badge>
                  <span>{formatDateTime(e.occurredAt)}</span>
                  <span>· {e.author}</span>
                  {e.edited && <span>· edited</span>}
                  {e.pinned && <span className="font-medium text-amber-700">· Pinned</span>}
                  {canEdit && (
                    <span className="ml-auto flex items-center gap-3">
                      <ActionForm action={togglePin}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="case_id" value={caseId} />
                        <input type="hidden" name="pinned" value={e.pinned ? "" : "on"} />
                        <button className="hover:text-brand-700">{e.pinned ? "Unpin" : "Pin"}</button>
                      </ActionForm>
                      <button onClick={() => setEditing(editing === e.id ? null : e.id)} className="hover:text-brand-700">
                        {editing === e.id ? "Cancel" : "Edit"}
                      </button>
                    </span>
                  )}
                </div>
                {editing === e.id ? (
                  <div className="space-y-2">
                    <ActionForm action={updateEntry} onSuccess={() => setEditing(null)} className="space-y-2">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="case_id" value={caseId} />
                      <Select name="entry_type" options={DN_TYPES} defaultValue={e.type} className="w-40" />
                      <Textarea name="body" defaultValue={e.body} rows={4} />
                      <SubmitButton size="sm">Save</SubmitButton>
                    </ActionForm>
                    {isAdmin && (
                      <ActionForm action={deleteEntry}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="case_id" value={caseId} />
                        <SubmitButton size="sm" variant="danger" pendingText="Deleting…">
                          Delete entry
                        </SubmitButton>
                      </ActionForm>
                    )}
                  </div>
                ) : (
                  <p dir="auto" className="text-sm whitespace-pre-line text-slate-800">
                    {e.body}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
