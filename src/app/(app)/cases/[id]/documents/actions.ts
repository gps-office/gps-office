"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bool, date, isUuid, oneOf, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import {
  CARRIERS,
  DOCUMENT_CATEGORIES,
  DOCUMENTS_BUCKET,
  MAX_UPLOAD_BYTES,
  SHIPMENT_DIRECTIONS,
  SHIPMENT_STATUSES,
  UPLOAD_TYPES,
} from "@/lib/constants";

const SIGNED_URL_SECONDS = 60;

function refresh(caseId: string) {
  revalidatePath(`/cases/${caseId}`, "layout");
}

function documentFields(fd: FormData) {
  return {
    name: text(fd, "name"),
    category: oneOf(fd, "category", DOCUMENT_CATEGORIES) ?? "other",
    checklist_item_id: uuid(fd, "checklist_item_id"),
    person_id: uuid(fd, "person_id"),
    is_original: fd.get("is_original") === "original",
    received_on: date(fd, "received_on"),
    expires_on: date(fd, "expires_on"),
    notes: text(fd, "notes"),
  };
}

export async function createDocument(fd: FormData): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  const fields = documentFields(fd);
  if (!caseId) return { ok: false, error: "Missing case." };
  if (!fields.name) return { ok: false, error: "Give the document a name." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({ ...fields, name: fields.name, case_id: caseId })
    .select("id")
    .single();
  if (error) {
    const f = failure(error);
    return { ok: false, error: f.ok ? "" : f.error };
  }
  refresh(caseId);
  return { ok: true, id: data.id };
}

export async function updateDocument(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  const fields = documentFields(fd);
  if (!id || !caseId) return invalid("Missing document.");
  if (!fields.name) return invalid("Give the document a name.");
  const returned = bool(fd, "returned_to_client");

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      ...fields,
      name: fields.name,
      returned_to_client: returned,
      returned_on: returned ? (date(fd, "returned_on") ?? new Date().toISOString().slice(0, 10)) : null,
      return_shipment_id: returned ? uuid(fd, "return_shipment_id") : null,
    })
    .eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Document updated.");
}

export async function deleteDocument(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can delete documents.");
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing document.");

  const supabase = await createClient();
  const { data: versions } = await supabase.from("document_versions").select("storage_path").eq("document_id", id);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return failure(error);
  if (versions?.length) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove(versions.map((v) => v.storage_path));
  }
  refresh(caseId);
  return ok("Document deleted.");
}

/**
 * Step 1 of an upload: checks the file and returns a one-time signed upload
 * URL token. The browser uploads straight to private storage (no size limit
 * from the web server), then calls recordVersion().
 */
export async function prepareUpload(
  documentId: string,
  mimeType: string,
  size: number,
): Promise<{ ok: true; path: string; token: string } | { ok: false; error: string }> {
  await getCurrentStaff();
  if (!isUuid(documentId)) return { ok: false, error: "Missing document." };
  const ext = UPLOAD_TYPES[mimeType];
  if (!ext) return { ok: false, error: "That file type isn’t allowed. Use PDF, an image, Word, Excel or email files." };
  if (!(size > 0) || size > MAX_UPLOAD_BYTES) return { ok: false, error: "Files must be under 50 MB." };

  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("id, case_id").eq("id", documentId).maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  const path = `cases/${doc.case_id}/${doc.id}/${randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[gps] signed upload url failed");
    return { ok: false, error: "The upload could not start. Please try again." };
  }
  return { ok: true, path: data.path, token: data.token };
}

/** Step 2 of an upload: records the uploaded file as the next version. */
export async function recordVersion(
  documentId: string,
  path: string,
  fileName: string,
  mimeType: string,
  size: number,
): Promise<ActionResult> {
  await getCurrentStaff();
  if (!isUuid(documentId)) return invalid("Missing document.");

  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("id, case_id").eq("id", documentId).maybeSingle();
  if (!doc) return invalid("Document not found.");
  // The path must be one prepareUpload() issued for this document.
  const expected = new RegExp(`^cases/${doc.case_id}/${doc.id}/[0-9a-f-]{36}\\.[a-z]{2,5}$`);
  if (!expected.test(path)) return invalid("Upload not recognised.");

  const { data: exists } = await supabase.storage.from(DOCUMENTS_BUCKET).exists(path);
  if (!exists) return invalid("The file did not finish uploading. Please try again.");

  const { error } = await supabase.from("document_versions").insert({
    document_id: doc.id,
    case_id: doc.case_id,
    version: 0, // numbered by the database
    storage_path: path,
    file_name: fileName.slice(0, 255),
    mime_type: mimeType,
    size_bytes: size,
  });
  if (error) return failure(error);
  refresh(doc.case_id);
  return ok("File uploaded.");
}

/** A short-lived link to view one file version. */
export async function getFileUrl(versionId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await getCurrentStaff();
  if (!isUuid(versionId)) return { ok: false, error: "Missing file." };
  const supabase = await createClient();
  const { data: v } = await supabase.from("document_versions").select("storage_path").eq("id", versionId).maybeSingle();
  if (!v) return { ok: false, error: "File not found." };
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(v.storage_path, SIGNED_URL_SECONDS);
  if (error || !data) return { ok: false, error: "The file could not be opened. Please try again." };
  return { ok: true, url: data.signedUrl };
}

function shipmentFields(fd: FormData) {
  return {
    carrier: text(fd, "carrier") ?? CARRIERS[0]!,
    tracking_number: text(fd, "tracking_number")?.replace(/\s+/g, "").toUpperCase() ?? null,
    direction: oneOf(fd, "direction", SHIPMENT_DIRECTIONS) ?? "to_client",
    status: oneOf(fd, "status", SHIPMENT_STATUSES) ?? "pending",
    sent_on: date(fd, "sent_on"),
    delivered_on: date(fd, "delivered_on"),
    notes: text(fd, "notes"),
  };
}

export async function addShipment(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  if (!caseId) return invalid("Missing case.");
  const supabase = await createClient();
  const { error } = await supabase.from("shipments").insert({ ...shipmentFields(fd), case_id: caseId });
  if (error) return failure(error);
  refresh(caseId);
  return ok("Shipment added.");
}

export async function updateShipment(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing shipment.");
  const supabase = await createClient();
  const { error } = await supabase.from("shipments").update(shipmentFields(fd)).eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Shipment updated.");
}
