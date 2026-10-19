"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cx } from "@/components/ui";
import { initials } from "@/lib/format";

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/cases", label: "Cases", icon: "M4 7h16v12H4zM9 7V5h6v2" },
  { href: "/clients", label: "Clients", icon: "M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 10a3 3 0 100-6 3 3 0 000 6M20 19v-1a4 4 0 00-3-3.9M15 4.1a3 3 0 010 5.8" },
  { href: "/tasks", label: "Tasks", icon: "M9 11l2 2 4-4M5 4h14v16H5z" },
  { href: "/finance", label: "Finance", icon: "M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H6" },
  { href: "/search", label: "Search", icon: "M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4" },
];
const ADMIN_NAV = [{ href: "/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" }];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-5 shrink-0" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function AppNav({
  staff,
  signOut,
}: {
  staff: { name: string; role: "admin" | "staff" };
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = staff.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const links = (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cx(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
            isActive(item.href) ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white",
          )}
        >
          <Icon d={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 pt-3">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
          {initials(staff.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{staff.name}</div>
          <div className="text-xs text-brand-200">{staff.role === "admin" ? "Manager" : "Staff"}</div>
        </div>
      </div>
      <form action={signOut} className="mt-2">
        <button className="w-full rounded-md px-3 py-2 text-left text-sm text-brand-100 hover:bg-white/10 hover:text-white">
          Sign out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-900 px-4 py-3 lg:hidden">
        <Link href="/" className="font-semibold text-white">
          GPS Office
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="rounded-md p-1.5 text-white hover:bg-white/10"
        >
          <Icon d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col justify-between bg-brand-900 p-3 pt-16">
            {links}
            {footer}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between bg-brand-900 p-3 lg:flex">
        <div>
          <Link href="/" className="mb-6 block px-3 pt-2">
            <div className="text-lg font-semibold text-white">GPS Office</div>
            <div className="text-xs text-brand-200">Global Pass Services</div>
          </Link>
          {links}
        </div>
        {footer}
      </aside>
    </>
  );
}
