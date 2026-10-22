import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/auth";
import { getCase } from "@/lib/queries";
import { DN_TYPES } from "@/lib/constants";
import { nowLondonLocal } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { addEntry } from "./actions";
import { DnTimeline } from "./timeline";

export const metadata = { title: "Details & Notes" };

export default async function NotesPage({ params }: PageProps<"/cases/[id]/notes">) {
  const { id } = await params;
  const [c, me] = await Promise.all([getCase(id), getCurrentStaff()]);
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("dn_entries")
    .select("id, entry_type, body, occurred_at, pinned, created_at, updated_at, author_id, author:staff!dn_entries_author_id_fkey(full_name)")
    .eq("case_id", c.id)
    .order("occurred_at", { ascending: false });

  const headline = [
    { label: "Next action", value: c.next_action },
    { label: "Outstanding", value: c.outstanding },
    { label: "Concerns", value: c.concerns, warn: true },
    { label: "Key facts", value: c.key_facts },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Add to the D&N">
          <ActionForm action={addEntry} resetOnSuccess className="space-y-3">
            <input type="hidden" name="case_id" value={c.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <Select name="entry_type" options={DN_TYPES} defaultValue="note" />
              </Field>
              <Field label="When (London time)">
                <Input name="occurred_at" type="datetime-local" defaultValue={nowLondonLocal()} />
              </Field>
            </div>
            <Field label="Details">
              <Textarea name="body" rows={4} required placeholder="What happened, what was said, what was agreed…" />
            </Field>
            <div className="flex items-center justify-between">
              <Checkbox name="pinned" label="Pin to top" />
              <SubmitButton>Add entry</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <DnTimeline
          caseId={c.id}
          meId={me.id}
          isAdmin={me.role === "admin"}
          entries={(entries ?? []).map((e) => ({
            id: e.id,
            type: e.entry_type,
            body: e.body,
            occurredAt: e.occurred_at,
            pinned: e.pinned,
            edited: new Date(e.updated_at).getTime() - new Date(e.created_at).getTime() > 1000,
            authorId: e.author_id,
            author: e.author?.full_name ?? "System",
          }))}
        />
      </div>

      <div>
        <Card title="Headline" actions={<Link href={`/cases/${c.id}`} className="text-xs text-brand-700">Edit</Link>}>
          <dl className="space-y-3 text-sm">
            {headline.map((h) => (
              <div key={h.label}>
                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{h.label}</dt>
                <dd dir="auto" className={`mt-0.5 whitespace-pre-line ${h.warn && h.value ? "rounded bg-amber-50 p-2 text-amber-900" : "text-slate-800"}`}>
                  {h.value || <span className="text-slate-400">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
