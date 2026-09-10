import Link from "next/link";
import { MagnifyingGlass, CaretLeft, CaretRight, UsersThree } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/leads";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusSelect } from "@/components/StatusSelect";
import { Button, buttonVariants } from "@/components/ui/Button";
import type { LeadStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

const STATUS_OPTIONS: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACT",
  "FOLLOW_UP",
  "QUALIFIED_LEAD",
  "BOOKING",
  "PURCHASE",
  "CLOSED_LOST",
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status as LeadStatus | undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { voucherCode: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status: sp.status, q: sp.q, page: sp.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return `/leads?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Leads</h2>
        <p className="text-sm text-slate-500">{total.toLocaleString("id-ID")} lead ditemukan.</p>
      </div>

      <form className="flex flex-wrap gap-3 items-end" action="/leads" method="GET">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Cari</label>
          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={sp.q || ""}
              placeholder="Voucher, nama, no HP, email"
              className="rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
          <select
            name="status"
            defaultValue={sp.status || ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          >
            <option value="">Semua</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Waktu</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Voucher</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Nama</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">No HP</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Sumber</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Total</th>
              <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wide text-slate-400">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{lead.voucherCode || "—"}</td>
                <td className="px-4 py-3 text-slate-900 font-medium">{lead.name || "—"}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs">{lead.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{lead.utmSource || "—"}</td>
                <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-xs">
                  {lead.totalValue ? formatCurrency(Number(lead.totalValue)) : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect leadId={lead.id} status={lead.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/leads/${lead.id}`} className="text-brand-700 hover:text-brand-800 hover:underline text-xs font-medium">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <UsersThree size={28} className="text-slate-300" />
                    <span>Belum ada lead.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={pageHref({ page: String(Math.max(1, page - 1)) })}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: page <= 1 ? "opacity-40 pointer-events-none" : "",
            })}
          >
            <CaretLeft size={13} />
            Sebelumnya
          </Link>
          <span className="text-slate-500 font-mono text-xs">
            Halaman {page} / {totalPages}
          </span>
          <Link
            href={pageHref({ page: String(Math.min(totalPages, page + 1)) })}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: page >= totalPages ? "opacity-40 pointer-events-none" : "",
            })}
          >
            Berikutnya
            <CaretRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
