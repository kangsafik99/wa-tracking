import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, STATUS_RANK } from "@/lib/leads";
import { formatCurrency, formatPercent } from "@/lib/format";
import { FunnelChart } from "@/components/FunnelChart";
import type { LeadStatus } from "@prisma/client";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const [statusGroups, purchaseAgg, sourceGroups, totalLeads] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.aggregate({
      where: { status: "PURCHASE" },
      _sum: { totalValue: true },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["utmSource"],
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 8,
    }),
    prisma.lead.count(),
  ]);

  const countByStatus = new Map<LeadStatus, number>();
  for (const g of statusGroups) countByStatus.set(g.status, g._count._all);

  const countAtLeast = (rank: number) =>
    Array.from(countByStatus.entries())
      .filter(([status, _]) => STATUS_RANK[status] >= rank)
      .reduce((sum, [, c]) => sum + c, 0);

  const contactRate = totalLeads ? countAtLeast(2) / totalLeads : 0;
  const qualifiedRate = totalLeads ? countAtLeast(4) / totalLeads : 0;
  const purchaseCount = countByStatus.get("PURCHASE") || 0;
  const purchaseRate = totalLeads ? purchaseCount / totalLeads : 0;
  const revenue = Number(purchaseAgg._sum.totalValue || 0);

  const funnelData = (
    ["NEW_LEAD", "CONTACT", "FOLLOW_UP", "QUALIFIED_LEAD", "BOOKING", "PURCHASE", "CLOSED_LOST"] as LeadStatus[]
  ).map((s) => ({ label: STATUS_LABEL[s], value: countByStatus.get(s) || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <p className="text-sm text-slate-500">Ringkasan funnel lead WhatsApp Anda.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads.toLocaleString("id-ID")} />
        <StatCard label="Contact Rate" value={formatPercent(contactRate)} sub="Klik yang lanjut chat" />
        <StatCard label="Qualified Rate" value={formatPercent(qualifiedRate)} />
        <StatCard
          label="Purchase"
          value={`${purchaseCount.toLocaleString("id-ID")} (${formatPercent(purchaseRate)})`}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-1">Total Revenue (Purchase)</p>
        <p className="text-3xl font-semibold text-brand-700">{formatCurrency(revenue)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Distribusi Status Lead</p>
        <FunnelChart data={funnelData} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Sumber Lead (UTM Source)</p>
        <div className="space-y-2">
          {sourceGroups.map((g) => (
            <div key={g.utmSource ?? "—"} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{g.utmSource || "—"}</span>
              <span className="font-medium text-slate-900">{g._count._all}</span>
            </div>
          ))}
          {sourceGroups.length === 0 && <p className="text-sm text-slate-400">Belum ada data.</p>}
        </div>
      </div>
    </div>
  );
}
