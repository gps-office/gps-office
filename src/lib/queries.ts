import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/forms";

export const getStaffOptions = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("id, full_name, active")
    .order("full_name");
  return (data ?? []).map((s) => ({ value: s.id, label: s.active ? s.full_name : `${s.full_name} (inactive)`, active: s.active }));
});

export const getServices = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, code, name, category, active, price_standard, price_premium, price_urgent")
    .order("sort_order");
  return data ?? [];
});

export const getSettings = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  const num = (key: string, fallback: number) => (typeof map[key] === "number" ? (map[key] as number) : fallback);
  return {
    staleAfterDays: num("stale_after_days", 7),
    deadlineWindowDays: num("deadline_window_days", 14),
    passportWarningDays: num("passport_expiry_warning_days", 180),
  };
});

const CASE_SELECT = `
  id, reference, title, stage, service_level, priority, deadline, cipo_complete,
  ref_home_office, ref_hmpo, ref_uscis, ref_consulate, ref_other,
  next_action, outstanding, concerns, key_facts,
  opened_at, closed_at, last_activity_at, created_at,
  client_id, service_id, assigned_to, manager_id,
  client:clients!cases_client_id_fkey ( id, full_name, hebrew_name ),
  service:services!cases_service_id_fkey ( id, code, name ),
  assigned:staff!cases_assigned_to_fkey ( id, full_name ),
  manager:staff!cases_manager_id_fkey ( id, full_name )
`;

/** A case by id with its client, service and staff, or a 404. */
export const getCase = cache(async (id: string) => {
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select(CASE_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  return data;
});

export type CaseDetail = Awaited<ReturnType<typeof getCase>>;
