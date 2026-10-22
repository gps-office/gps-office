"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Card, EmptyState } from "@/components/ui";
import { StageBadge } from "@/components/badges";
import { formatDate } from "@/lib/format";
import { globalSearch, type SearchResults } from "./actions";

export function SearchBox() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = ++latest.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearch(term);
        if (id === latest.current) setResults(r);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  const shown = q.trim().length >= 2 ? results : null;
  const total = shown ? shown.clients.length + shown.cases.length + shown.people.length + shown.documents.length : 0;

  return (
    <>
      <input
        autoFocus
        dir="auto"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Type at least 2 characters…"
        aria-label="Search"
        className="field mb-6 py-3 text-base"
      />
      {pending && <p className="mb-4 text-sm text-slate-500">Searching…</p>}
      {shown && total === 0 && !pending && <EmptyState>No matches.</EmptyState>}
      {shown && total > 0 && (
        <div className="space-y-4">
          {shown.cases.length > 0 && (
            <Card title="Cases" padded={false}>
              <ul className="divide-y divide-slate-100">
                {shown.cases.map((c) => (
                  <li key={c.id}>
                    <Link href={`/cases/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <span className="font-mono font-medium text-brand-700">{c.reference}</span>
                      <span dir="auto">{c.client}</span>
                      <span className="text-slate-500">{c.service}</span>
                      {c.match && <span className="font-mono text-xs text-slate-600">ref {c.match}</span>}
                      <span className="ml-auto">
                        <StageBadge stage={c.stage} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {shown.clients.length > 0 && (
            <Card title="Clients" padded={false}>
              <ul className="divide-y divide-slate-100">
                {shown.clients.map((c) => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <span className="font-medium text-brand-700" dir="auto">
                        {c.full_name}
                      </span>
                      {c.hebrew_name && <span className="text-slate-500" dir="rtl">{c.hebrew_name}</span>}
                      <span className="text-slate-500">{formatDate(c.date_of_birth)}</span>
                      {c.passport_number && <span className="ml-auto font-mono text-xs text-slate-600">{c.passport_number}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {shown.people.length > 0 && (
            <Card title="People on cases" padded={false}>
              <ul className="divide-y divide-slate-100">
                {shown.people.map((p, i) => (
                  <li key={`${p.case_id}-${i}`}>
                    <Link href={`/cases/${p.case_id}`} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <span dir="auto">{p.full_name}</span>
                      {p.passport_number && <span className="font-mono text-xs text-slate-600">{p.passport_number}</span>}
                      <span className="ml-auto font-mono text-xs text-brand-700">{p.reference}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {shown.documents.length > 0 && (
            <Card title="Documents" padded={false}>
              <ul className="divide-y divide-slate-100">
                {shown.documents.map((d, i) => (
                  <li key={`${d.case_id}-${i}`}>
                    <Link href={`/cases/${d.case_id}/documents`} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <span dir="auto">{d.name}</span>
                      <span className="ml-auto font-mono text-xs text-brand-700">{d.reference}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
