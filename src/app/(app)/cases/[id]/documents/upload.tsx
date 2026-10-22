"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DOCUMENTS_BUCKET, MAX_UPLOAD_BYTES, UPLOAD_TYPES } from "@/lib/constants";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { createDocument, getFileUrl, prepareUpload, recordVersion } from "./actions";

const ACCEPT = Object.keys(UPLOAD_TYPES).join(",");

/** Uploads a file straight to private storage, then records it as a version. */
async function uploadFile(documentId: string, file: File): Promise<string | null> {
  const type = file.type || "application/octet-stream";
  if (!UPLOAD_TYPES[type]) return "That file type isn’t allowed. Use PDF, an image, Word, Excel or email files.";
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be under 50 MB.";

  const prepared = await prepareUpload(documentId, type, file.size);
  if (!prepared.ok) return prepared.error;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: type });
  if (error) return "The upload failed. Check your connection and try again.";
  const recorded = await recordVersion(documentId, prepared.path, file.name, type, file.size);
  return recorded.ok ? null : recorded.error;
}

type Option = { value: string; label: string };

export function AddDocumentForm({
  caseId,
  categories,
  checklist,
  people,
}: {
  caseId: string;
  categories: readonly Option[];
  checklist: Option[];
  people: Option[];
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    fd.delete("file");
    const created = await createDocument(fd);
    if (!created.ok) {
      setBusy(false);
      setMessage({ ok: false, text: created.error });
      return;
    }
    if (file instanceof File && file.size > 0) {
      const err = await uploadFile(created.id, file);
      if (err) {
        setBusy(false);
        setMessage({ ok: false, text: `Document recorded, but the file was not saved: ${err}` });
        router.refresh();
        return;
      }
    }
    form.current?.reset();
    setBusy(false);
    setMessage({ ok: true, text: "Document added." });
    router.refresh();
  }

  return (
    <form ref={form} onSubmit={submit} className="space-y-3">
      <input type="hidden" name="case_id" value={caseId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Document name">
          <Input name="name" required placeholder="e.g. Current British passport" />
        </Field>
        <Field label="Category">
          <Select name="category" options={categories} defaultValue="other" />
        </Field>
        <Field label="Satisfies checklist item">
          <Select name="checklist_item_id" options={checklist} placeholder="— None —" />
        </Field>
        <Field label="Belongs to">
          <Select name="person_id" options={people} placeholder="— Whole case —" />
        </Field>
        <Field label="Original or copy">
          <Select
            name="is_original"
            options={[
              { value: "copy", label: "Copy / scan" },
              { value: "original", label: "Original (we hold it)" },
            ]}
            defaultValue="copy"
          />
        </Field>
        <Field label="Received on">
          <Input name="received_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Document expiry date">
          <Input name="expires_on" type="date" />
        </Field>
        <Field label="File (optional)" hint="PDF, image, Word, Excel or email · max 50 MB">
          <input name="file" type="file" accept={ACCEPT} className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea name="notes" rows={2} />
      </Field>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Add document"}
      </Button>
    </form>
  );
}

export function NewVersionUpload({ documentId }: { documentId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const err = await uploadFile(documentId, file);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (err) setError(err);
    else router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <label className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
        {busy ? "Uploading…" : "Upload file / new version"}
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" onChange={onChange} disabled={busy} />
      </label>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}

export function OpenFile({ versionId, children }: { versionId: string; children: React.ReactNode }) {
  const [error, setError] = useState(false);
  async function open() {
    // Open the tab synchronously so pop-up blockers allow it.
    const win = window.open("about:blank", "_blank");
    const res = await getFileUrl(versionId);
    if (res.ok && win) {
      win.location.replace(res.url);
    } else {
      win?.close();
      setError(true);
    }
  }
  return (
    <button type="button" onClick={open} className="text-brand-700 hover:underline">
      {children}
      {error && <span className="ml-1 text-xs text-red-700">(could not open)</span>}
    </button>
  );
}

export function ReturnedCheckbox({ defaultChecked }: { defaultChecked: boolean }) {
  return <Checkbox name="returned_to_client" defaultChecked={defaultChecked} label="Original returned to client" />;
}
