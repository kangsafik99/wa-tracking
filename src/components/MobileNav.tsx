"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, ChatCircleDots, SignOut } from "@phosphor-icons/react/ssr";
import { logoutAction } from "@/app/(dashboard)/actions";
import { NAV_ITEMS } from "@/components/nav-items";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

export function MobileNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tutup drawer otomatis begitu pindah halaman (klik link di dalamnya).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex lg:hidden sticky top-0 z-40 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="grid place-items-center w-7 h-7 rounded-lg bg-brand-600 text-white">
          <ChatCircleDots size={15} weight="fill" />
        </div>
        <h1 className="text-sm font-semibold text-slate-900">WA TRACKING</h1>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <List size={20} />
          <span className="sr-only">Buka menu</span>
        </SheetTrigger>
        <SheetContent title="Menu navigasi" className="p-0">
          <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-2.5">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 text-white">
              <ChatCircleDots size={18} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">WA TRACKING</p>
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
