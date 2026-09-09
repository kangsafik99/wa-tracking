"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(dashboard)/actions";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/leads", label: "Leads" },
  { href: "/logs", label: "Webhook Log" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">SINYAL CRM</h1>
        <p className="text-xs text-slate-500 mt-0.5">Offline Conversion Tracking</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 truncate mb-2">{email}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left text-sm text-slate-500 hover:text-red-600 transition"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
