"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { bool, money, text, uuid } from "@/lib/forms";
import { failure, invalid, ok, type ActionResult } from "@/lib/errors";

async function admin() {
  const me = await getCurrentStaff();
  return me.role === "admin";
}

function refresh() {
  revalidatePath("/settings/services");
  revalidatePath("/cases", "layout");
}

function serviceFields(fd: FormData) {
  return {
    name: text(fd, "name"),
    category: text(fd, "category") ?? "Other",
    description: text(fd, "description"),
    price_standard: money(fd, "price_standard"),
    price_premium: money(fd, "price_premium"),
    price_urgent: money(fd, "price_urgent"),
    sort_order: Number(text(fd, "sort_order") ?? 0) || 0,
  };
}

export async function addService(_prev: unknown, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return invalid("Only the office manager can change services.");
  const f = serviceFields(fd);
  if (!f.name) return invalid("Enter the service name.");
  const code = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "service";
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .insert({ ...f, name: f.name, code: `${code}_${Date.now().toString(36)}`, sort_order: f.sort_order || 999 });
  if (error) return failure(error);
  refresh();
  return ok("Service added.");
}

export async function updateService(_prev: unknown, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return invalid("Only the office manager can change services.");
  const id = uuid(fd, "id");
  const f = serviceFields(fd);
  if (!id || !f.name) return invalid("Enter the service name.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({ ...f, name: f.name, active: bool(fd, "active") })
    .eq("id", id);
  if (error) return failure(error);
  refresh();
  return ok("Saved.");
}

export async function addChecklistItem(_prev: unknown, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return invalid("Only the office manager can change checklists.");
  const serviceId = uuid(fd, "service_id");
  const label = text(fd, "label");
  if (!serviceId || !label) return invalid("Enter the document needed.");
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("service_checklist_items")
    .select("sort_order")
    .eq("service_id", serviceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("service_checklist_items").insert({
    service_id: serviceId,
    label,
    required: bool(fd, "required"),
    sort_order: (last?.sort_order ?? 0) + 10,
  });
  if (error) return failure(error);
  refresh();
  return ok("Added.");
}

export async function updateChecklistItem(_prev: unknown, fd: FormData): Promise<ActionResult> {
  if (!(await admin())) return invalid("Only the office manager can change checklists.");
  const id = uuid(fd, "id");
  const label = text(fd, "label");
  if (!id || !label) return invalid("Enter the document needed.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_checklist_items")
    .update({
      label,
      required: bool(fd, "required"),
      active: bool(fd, "active"),
      sort_order: Number(text(fd, "sort_order") ?? 0) || 0,
    })
    .eq("id", id);
  if (error) return failure(error);
  refresh();
  return ok();
}
