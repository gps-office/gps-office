"use server";

import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Stage } from "@/lib/constants";

export type SearchResults = {
  clients: { id: string; full_name: string; hebrew_name: string | null; passport_number: string | null; date_of_birth: string | null }[];
  cases: { id: string; reference: string; stage: Stage; client: string | null; service: string | null; match: string | null }[];
  people: { case_id: string; reference: string | null; full_name: string; passport_number: string | null }[];
  documents: { case_id: string; reference: string | null; name: string }[];
};

const EMPTY: SearchResults = { clients: [], cases: [], people: [], documents: [] };

/**
 * Searches clients, cases (incl. external references), people on cases and
 * documents. A server action (POST) so search terms stay out of URLs/logs.
 */
export async function globalSearch(raw: string): Promise<SearchResults> {
  await getCurrentStaff();
  // Characters with meaning in PostgREST filters are dropped.
  const term = raw.replace(/[,()*%\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  if (term.length < 2) return EMPTY;
  const like = `%${term}%`;
  const compact = `%${term.replace(/\s+/g, "").toUpperCase()}%`;

  const supabase = await createClient();
  const [clients, cases, people, documents] = await Promise.all([
    supabase
      .from("clients")
      .select("id, full_name, hebrew_name, passport_number, date_of_birth")
      .or(
        `full_name.ilike.${like},hebrew_name.ilike.${like},passport_number.ilike.${compact},email.ilike.${like},phone.ilike.${like},whatsapp.ilike.${like}`,
      )
      .order("full_name")
      .limit(25),
    supabase
      .from("cases")
      .select(
        "id, reference, stage, title, ref_home_office, ref_hmpo, ref_uscis, ref_consulate, ref_other, client:clients!cases_client_id_fkey(full_name), service:services!cases_service_id_fkey(name)",
      )
      .or(
        `reference.ilike.${compact},title.ilike.${like},ref_home_office.ilike.${like},ref_hmpo.ilike.${like},ref_uscis.ilike.${like},ref_consulate.ilike.${like},ref_other.ilike.${like}`,
      )
      .order("opened_at", { ascending: false })
      .limit(25),
    supabase
      .from("case_people")
      .select("case_id, full_name, passport_number, case:cases!case_people_case_id_fkey(reference)")
      .or(`full_name.ilike.${like},hebrew_name.ilike.${like},passport_number.ilike.${compact}`)
      .limit(25),
    supabase
      .from("documents")
      .select("case_id, name, case:cases!documents_case_id_fkey(reference)")
      .ilike("name", like)
      .limit(25),
  ]);

  const lower = term.toLowerCase();
  return {
    clients: clients.data ?? [],
    cases: (cases.data ?? []).map((c) => ({
      id: c.id,
      reference: c.reference,
      stage: c.stage,
      client: c.client?.full_name ?? null,
      service: c.service?.name ?? null,
      match:
        [c.ref_home_office, c.ref_hmpo, c.ref_uscis, c.ref_consulate, c.ref_other].find((r) => r?.toLowerCase().includes(lower)) ??
        null,
    })),
    people: (people.data ?? []).map((p) => ({
      case_id: p.case_id,
      reference: p.case?.reference ?? null,
      full_name: p.full_name,
      passport_number: p.passport_number,
    })),
    documents: (documents.data ?? []).map((d) => ({ case_id: d.case_id, reference: d.case?.reference ?? null, name: d.name })),
  };
}
