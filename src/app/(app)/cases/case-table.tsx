"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";
import { DueDate, LevelBadge, PriorityBadge, StageBadge } from "@/components/badges";
import type { Stage } from "@/lib/constants";
import { daysSince } from "@/lib/format";

export type CaseRow = {
  id: string;
  reference: string;
  title: string | null;
  stage: Stage;
  priority: string;
  service_level: string;
  deadline: string | null;
  last_activity_at: string;
  client: string;
  client_he: string | null;
  service: string;
  assigned: string | null;
};

export function CaseTable({ rows, staleDays }: { rows: CaseRow[]; staleDays: number }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.reference, r.client, r.client_he, r.title, r.service].filter(Boolean).some((v) => v!.toLowerCase().includes(term)),
    );
  }, [rows, q]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center gap-3 border-b border-slate-200 p-3">
        <input
          dir="auto"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reference, client, service…"
          className="field max-w-md"
          aria-label="Search cases"
        />
        <span className="ml-auto text-xs text-slate-500">{filtered.length} shown</span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState>No cases match.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Client</th>
                <th className="hidden px-4 py-2 md:table-cell">Service</th>
                <th className="px-4 py-2">Stage</th>
                <th className="hidden px-4 py-2 lg:table-cell">Assigned</th>
                <th className="hidden px-4 py-2 sm:table-cell">Deadline</th>
                <th className="hidden px-4 py-2 xl:table-cell">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const idle = daysSince(r.last_activity_at) ?? 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link href={`/cases/${r.id}`} className="font-mono font-medium text-brand-700 hover:underline">
                        {r.reference}
                      </Link>
                      <div className="mt-0.5 flex gap-1">
                        <PriorityBadge priority={r.priority} />
                        <LevelBadge level={r.service_level} />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div dir="auto">{r.client}</div>
                      {r.client_he && (
                        <div className="text-xs text-slate-500" dir="rtl">
                          {r.client_he}
                        </div>
                      )}
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      {r.service}
                      {r.title && <div className="text-xs text-slate-500">{r.title}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <StageBadge stage={r.stage} />
                    </td>
                    <td className="hidden px-4 py-2 lg:table-cell">{r.assigned ?? <span className="text-amber-700">Unassigned</span>}</td>
                    <td className="hidden px-4 py-2 sm:table-cell">
                      <DueDate date={r.deadline} closed={r.stage === "closed"} />
                    </td>
                    <td className={`hidden px-4 py-2 xl:table-cell ${idle >= staleDays && r.stage !== "closed" ? "text-amber-700" : "text-slate-500"}`}>
                      {idle === 0 ? "Today" : `${idle}d ago`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
