"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { date, oneOf, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import { RELATIONSHIPS } from "@/lib/constants";

function clientFields(fd: FormData) {
  return {
    full_name: text(fd, "full_name"),
    hebrew_name: text(fd, "hebrew_name"),
    date_of_birth: date(fd, "date_of_birth"),
    nationality: text(fd, "nationality"),
    passport_number: text(fd, "passport_number")?.toUpperCase().replace(/\s+/g, "") ?? null,
    passport_expiry: date(fd, "passport_expiry"),
    phone: text(fd, "phone"),
    whatsapp: text(fd, "whatsapp"),
    email: text(fd, "email")?.toLowerCase() ?? null,
    address: text(fd, "address"),
    notes: text(fd, "notes"),
  };
}

export async function createClientRecord(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const fields = clientFields(fd);
  if (!fields.full_name) return invalid("Enter the client’s full name.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...fields, full_name: fields.full_name })
    .select("id")
    .single();
  if (error) return failure(error);

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientRecord(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const fields = clientFields(fd);
  if (!id) return invalid("Missing client.");
  if (!fields.full_name) return invalid("Enter the client’s full name.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ ...fields, full_name: fields.full_name })
    .eq("id", id);
  if (error) return failure(error);

  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function addClientLink(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const clientId = uuid(fd, "client_id");
  const relatedId = uuid(fd, "related_client_id");
  const relationship = oneOf(fd, "relationship", RELATIONSHIPS);
  if (!clientId || !relatedId || !relationship) return invalid("Choose a person and a relationship.");
  if (clientId === relatedId) return invalid("A client cannot be linked to themselves.");

  const supabase = await createClient();
  // One link per pair, whichever direction it was recorded in.
  const { data: existing } = await supabase
    .from("client_links")
    .select("id")
    .or(
      `and(client_id.eq.${clientId},related_client_id.eq.${relatedId}),and(client_id.eq.${relatedId},related_client_id.eq.${clientId})`,
    );
  if (existing?.length) return invalid("These two clients are already linked.");

  const { error } = await supabase
    .from("client_links")
    .insert({ client_id: clientId, related_client_id: relatedId, relationship, notes: text(fd, "notes") });
  if (error) return failure(error);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${relatedId}`);
  return ok("Family link added.");
}

export async function removeClientLink(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can remove links.");
  const id = uuid(fd, "id");
  const back = uuid(fd, "client_id");
  if (!id) return invalid("Missing link.");
  const supabase = await createClient();
  const { error } = await supabase.from("client_links").delete().eq("id", id);
  if (error) return failure(error);
  if (back) revalidatePath(`/clients/${back}`);
  return ok("Link removed.");
}
