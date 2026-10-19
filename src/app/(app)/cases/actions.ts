"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bool, date, oneOf, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";
import { PRIORITIES, SERVICE_LEVELS, STAGES } from "@/lib/constants";

function refresh(caseId: string) {
  revalidatePath(`/cases/${caseId}`, "layout");
  revalidatePath("/cases");
}

export async function createCase(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const clientId = uuid(fd, "client_id");
  const serviceId = uuid(fd, "service_id");
  if (!clientId) return invalid("Choose the client.");
  if (!serviceId) return invalid("Choose the service.");

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("cases")
    .insert({
      client_id: clientId,
      service_id: serviceId,
      title: text(fd, "title"),
      service_level: oneOf(fd, "service_level", SERVICE_LEVELS) ?? "standard",
      priority: oneOf(fd, "priority", PRIORITIES) ?? "normal",
      assigned_to: uuid(fd, "assigned_to"),
      manager_id: uuid(fd, "manager_id"),
      deadline: date(fd, "deadline"),
      next_action: text(fd, "next_action"),
    })
    .select("id, reference")
    .single();
  if (error) return failure(error);

  // The client is the main applicant on their own case.
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, hebrew_name, date_of_birth, nationality, passport_number, passport_expiry")
    .eq("id", clientId)
    .single();
  if (client) {
    const { id: _clientRecordId, ...person } = client;
    await supabase.from("case_people").insert({
      case_id: created.id,
      client_id: client.id,
      ...person,
      relationship: "Main applicant",
      is_main_applicant: true,
    });
  }

  const note = text(fd, "first_note");
  if (note) await supabase.from("dn_entries").insert({ case_id: created.id, entry_type: "note", body: note });

  revalidatePath("/cases");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/cases/${created.id}`);
}

export async function updateCaseDetails(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const serviceId = uuid(fd, "service_id");
  if (!id || !serviceId) return invalid("Missing case or service.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      service_id: serviceId,
      title: text(fd, "title"),
      service_level: oneOf(fd, "service_level", SERVICE_LEVELS) ?? "standard",
      priority: oneOf(fd, "priority", PRIORITIES) ?? "normal",
      assigned_to: uuid(fd, "assigned_to"),
      manager_id: uuid(fd, "manager_id"),
      deadline: date(fd, "deadline"),
      ref_home_office: text(fd, "ref_home_office"),
      ref_hmpo: text(fd, "ref_hmpo"),
      ref_uscis: text(fd, "ref_uscis"),
      ref_consulate: text(fd, "ref_consulate"),
      ref_other: text(fd, "ref_other"),
    })
    .eq("id", id);
  if (error) return failure(error);
  refresh(id);
  return ok("Case details saved.");
}

export async function updateHeadline(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  if (!id) return invalid("Missing case.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      next_action: text(fd, "next_action"),
      outstanding: text(fd, "outstanding"),
      concerns: text(fd, "concerns"),
      key_facts: text(fd, "key_facts"),
    })
    .eq("id", id);
  if (error) return failure(error);
  refresh(id);
  return ok("Saved.");
}

export async function changeStage(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const stage = oneOf(fd, "stage", STAGES);
  if (!id || !stage) return invalid("Choose a stage.");
  const supabase = await createClient();
  const { error } = await supabase.from("cases").update({ stage }).eq("id", id);
  if (error) return failure(error);
  refresh(id);
  return ok("Stage updated.");
}

export async function setCipoStep(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  const step = Number(fd.get("step"));
  if (!caseId || !Number.isInteger(step) || step < 1 || step > 9) return invalid("Missing CIPO step.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("cipo_checks")
    .update({ checked: bool(fd, "checked"), note: text(fd, "note") })
    .eq("case_id", caseId)
    .eq("step", step);
  if (error) return failure(error);
  refresh(caseId);
  return ok();
}

function personFields(fd: FormData) {
  return {
    full_name: text(fd, "full_name"),
    hebrew_name: text(fd, "hebrew_name"),
    date_of_birth: date(fd, "date_of_birth"),
    nationality: text(fd, "nationality"),
    passport_number: text(fd, "passport_number")?.toUpperCase().replace(/\s+/g, "") ?? null,
    passport_expiry: date(fd, "passport_expiry"),
    relationship: text(fd, "relationship"),
    client_id: uuid(fd, "client_id"),
    notes: text(fd, "notes"),
  };
}

export async function addPerson(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const caseId = uuid(fd, "case_id");
  if (!caseId) return invalid("Missing case.");
  const supabase = await createClient();
  let fields = personFields(fd);

  // Copying an existing client fills in their details.
  if (fields.client_id && !fields.full_name) {
    const { data: c } = await supabase
      .from("clients")
      .select("full_name, hebrew_name, date_of_birth, nationality, passport_number, passport_expiry")
      .eq("id", fields.client_id)
      .single();
    if (c) fields = { ...fields, ...c };
  }
  if (!fields.full_name) return invalid("Enter a name or choose an existing client.");

  const { error } = await supabase.from("case_people").insert({ ...fields, full_name: fields.full_name, case_id: caseId });
  if (error) return failure(error);
  refresh(caseId);
  return ok("Person added.");
}

export async function updatePerson(_prev: unknown, fd: FormData): Promise<ActionResult> {
  await getCurrentStaff();
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  const fields = personFields(fd);
  if (!id || !caseId) return invalid("Missing person.");
  if (!fields.full_name) return invalid("Enter the person’s name.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("case_people")
    .update({ ...fields, full_name: fields.full_name })
    .eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Saved.");
}

export async function removePerson(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const me = await getCurrentStaff();
  if (me.role !== "admin") return invalid("Only the office manager can remove people from a case.");
  const id = uuid(fd, "id");
  const caseId = uuid(fd, "case_id");
  if (!id || !caseId) return invalid("Missing person.");
  const supabase = await createClient();
  const { error } = await supabase.from("case_people").delete().eq("id", id);
  if (error) return failure(error);
  refresh(caseId);
  return ok("Removed.");
}
