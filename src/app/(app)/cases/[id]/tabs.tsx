"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const TABS = [
  { path: "", label: "Overview" },
  { path: "/cipo", label: "CIPO" },
  { path: "/notes", label: "D&N" },
  { path: "/documents", label: "Documents" },
  { path: "/tasks", label: "Tasks" },
  { path: "/finance", label: "Finance" },
  { path: "/history", label: "History" },
];

export function CaseTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/cases/${id}`;
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      {TABS.map((t) => {
        const href = base + t.path;
        const active = t.path === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={t.path}
            href={href}
            className={cx(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
              active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
