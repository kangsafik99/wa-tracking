import { Fragment } from "react";
import Link from "next/link";
import { MagnifyingGlass, CaretLeft, CaretRight, UsersThree } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/leads";
import { formatCurrency, formatTimeWIB, dateGroupKey, formatDateGroupLabel } from "@/lib/format";
import { paidOnlyLeadWhere } from "@/lib/traffic";
import { getShowOrganicTraffic } from "@/lib/settings";
import { StatusSelect } from "@/components/StatusSelect";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import type { Lead, LeadStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 25;
const COLUMN_COUNT = 8;

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
  // "ALL" adalah sentinel buat opsi "Semua" - Radix Select tidak izinkan value="".
  const status = sp.status && sp.status !== "ALL" ? (sp.status as LeadStatus) : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const showOrganicTraffic = await getShowOrganicTraffic();

  const where: Prisma.LeadWhereInput = showOrganicTraffic ? {} : paidOnlyLeadWhere();
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

  const groups: { key: string; label: string; items: Lead[] }[] = [];
  for (const lead of leads) {
    const key = dateGroupKey(lead.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.key === key) {
      lastGroup.items.push(lead);
    } else {
      groups.push({ key, label: formatDateGroupLabel(lead.createdAt), items: [lead] });
    }
  }

  function pageHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status: sp.status, q: sp.q, page: sp.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return `/leads?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-500">{total.toLocaleString("id-ID")} lead ditemukan.</p>
        </div>
      </div>

      <form className="flex flex-wrap gap-3 items-end" action="/leads" method="GET">
        <div className="w-full sm:w-64">
          <Label htmlFor="leads-search">Cari</Label>
          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="leads-search"
              type="text"
              name="q"
              defaultValue={sp.q || ""}
              placeholder="Voucher, nama, no HP, email"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[8rem] sm:flex-none sm:w-44">
          <Label>Status</Label>
          <Select name="status" defaultValue={status || "ALL"}>
            <SelectTrigger>
              <SelectValue>{status ? STATUS_LABEL[status] : "Semua"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            <TableHead>Jam</TableHead>
            <TableHead>Voucher</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>No HP</TableHead>
            <TableHead>Sumber</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <Fragment key={group.key}>
              <TableRow className="border-b-0 bg-slate-50 hover:bg-slate-50">
                <TableCell colSpan={COLUMN_COUNT} className="py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</span>
                  <span className="ml-2 text-xs text-slate-400">{group.items.length} lead</span>
                </TableCell>
              </TableRow>
              {group.items.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-slate-500 whitespace-nowrap font-mono text-xs">
                    {formatTimeWIB(lead.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">{lead.voucherCode || "—"}</TableCell>
                  <TableCell className="text-slate-900 font-medium">{lead.name || "—"}</TableCell>
                  <TableCell className="text-slate-700 whitespace-nowrap font-mono text-xs">{lead.phone || "—"}</TableCell>
                  <TableCell className="text-slate-500">{lead.utmSource || "—"}</TableCell>
                  <TableCell className="text-slate-700 whitespace-nowrap font-mono text-xs">
                    {lead.totalValue ? formatCurrency(Number(lead.totalValue)) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusSelect leadId={lead.id} status={lead.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/leads/${lead.id}`} className="text-brand-700 hover:text-brand-800 hover:underline text-xs font-medium">
                      Detail
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
          {leads.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <UsersThree size={28} className="text-slate-300" />
                  <span>Belum ada lead.</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
