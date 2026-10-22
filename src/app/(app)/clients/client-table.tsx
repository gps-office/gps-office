"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { daysUntil, formatDate } from "@/lib/format";

type ClientRow = {
  id: string;
  full_name: string;
  hebrew_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  phone: string | null;
  email: string | null;
  cases: number;
};

function Expiry({ date, warnDays }: { date: string | null; warnDays: number }) {
  const d = daysUntil(date);
  if (d === null) return <span className="text-slate-400">—</span>;
  if (d < 0) return <Badge tone="red">Expired</Badge>;
  if (d <= warnDays) return <Badge tone="amber">{formatDate(date)}</Badge>;
  return <>{formatDate(date)}</>;
}

// Filtering happens in the browser so search terms (names, passport
// numbers) never appear in URLs or server logs.
export function ClientTable({ rows, warnDays }: { rows: ClientRow[]; warnDays: number }) {
  const [q, setQ] = useState("");
  const [expiring, setExpiring] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (expiring) {
        const d = daysUntil(r.passport_expiry);
        if (d === null || d > warnDays) return false;
      }
      if (!term) return true;
      return [r.full_name, r.hebrew_name, r.passport_number, r.phone, r.email, r.nationality]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    });
  }, [rows, q, expiring, warnDays]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        <input
          dir="auto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, Hebrew name, passport, phone, email…"
          className="field max-w-md"
          aria-label="Search clients"
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={expiring} onChange={(e) => setExpiring(e.target.checked)} className="size-4 rounded border-slate-300" />
          Passport expired or expiring
        </label>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} shown</span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState>No clients match.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="hidden px-4 py-2 md:table-cell">Date of birth</th>
                <th className="hidden px-4 py-2 lg:table-cell">Nationality</th>
                <th className="px-4 py-2">Passport expiry</th>
                <th className="hidden px-4 py-2 md:table-cell">Phone</th>
                <th className="px-4 py-2 text-right">Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/clients/${r.id}`} className="font-medium text-brand-700 hover:underline" dir="auto">
                      {r.full_name}
                    </Link>
                    {r.hebrew_name && (
                      <div className="text-xs text-slate-500" dir="rtl" lang="he">
                        {r.hebrew_name}
                      </div>
                    )}
                  </td>
                  <td className="hidden px-4 py-2 md:table-cell">{formatDate(r.date_of_birth)}</td>
                  <td className="hidden px-4 py-2 lg:table-cell">{r.nationality ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Expiry date={r.passport_expiry} warnDays={warnDays} />
                  </td>
                  <td className="hidden px-4 py-2 md:table-cell">{r.phone ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
