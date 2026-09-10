"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Users,
  ChatCircleText,
  GearSix,
  SignOut,
  ChatCircleDots,
  PaperPlaneTilt,
} from "@phosphor-icons/react/ssr";
import { logoutAction } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: SquaresFour },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/export", label: "Export", icon: PaperPlaneTilt },
  { href: "/logs", label: "Webhook Log", icon: ChatCircleText },
  { href: "/settings", label: "Settings", icon: GearSix },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-2.5">
        <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 text-white">
          <ChatCircleDots size={18} weight="fill" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-tight">WA TRACKING</h1>
          <p className="text-[11px] text-slate-400 leading-tight">Offline Conversion Tracking</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon size={17} weight={active ? "fill" : "regular"} />
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
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition"
          >
            <SignOut size={15} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
