import { Users, ChatCircleDots, CheckCircle, CurrencyCircleDollar } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL, STATUS_RANK } from "@/lib/leads";
import { formatCurrency, formatPercent } from "@/lib/format";
import { parseTrafficFilter, leadTrafficWhere } from "@/lib/traffic";
import { FunnelChart } from "@/components/FunnelChart";
import { Card } from "@/components/ui/Card";
import { TrafficToggle } from "@/components/TrafficToggle";
import type { LeadStatus, Prisma } from "@prisma/client";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill"; className?: string }>;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 mt-1.5 font-mono tabular-nums">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className="grid place-items-center w-9 h-9 rounded-lg bg-brand-50 text-brand-700 shrink-0">
        <Icon size={18} weight="fill" />
      </div>
    </Card>
  );
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ traffic?: string }>;
}) {
  const sp = await searchParams;
  const traffic = parseTrafficFilter(sp.traffic);

  const where: Prisma.LeadWhereInput = { ...leadTrafficWhere(traffic) };

  const [statusGroups, purchaseAgg, sourceGroups, totalLeads] = await Promise.all([
    prisma.lead.groupBy({ where, by: ["status"], _count: { _all: true } }),
    prisma.lead.aggregate({
      where: { ...where, status: "PURCHASE" },
      _sum: { totalValue: true },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      where,
      by: ["utmSource"],
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 8,
    }),
    prisma.lead.count({ where }),
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

  const maxSourceCount = Math.max(1, ...sourceGroups.map((g) => g._count._all));

  function buildHref(overrides: { traffic?: string }) {
    const params = new URLSearchParams();
    const merged = { traffic: sp.traffic, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">Ringkasan funnel lead WhatsApp Anda.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <TrafficToggle current={traffic} buildHref={(v) => buildHref({ traffic: v === "all" ? undefined : v })} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={totalLeads.toLocaleString("id-ID")} icon={Users} />
        <StatCard
          label="Contact Rate"
          value={formatPercent(contactRate)}
          sub="Klik yang lanjut chat"
          icon={ChatCircleDots}
        />
        <StatCard label="Qualified Rate" value={formatPercent(qualifiedRate)} icon={CheckCircle} />
        <StatCard
          label="Purchase"
          value={`${purchaseCount.toLocaleString("id-ID")} (${formatPercent(purchaseRate)})`}
          icon={CurrencyCircleDollar}
        />
      </div>

      <div className="rounded-2xl bg-brand-800 p-5">
        <p className="text-sm font-medium text-brand-200 mb-1">Total Revenue (Purchase)</p>
        <p className="text-3xl font-semibold text-white font-mono tabular-nums">{formatCurrency(revenue)}</p>
      </div>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Distribusi Status Lead</p>
        <FunnelChart data={funnelData} />
      </Card>

      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Sumber Lead (UTM Source)</p>
        <div className="space-y-3">
          {sourceGroups.map((g) => (
            <div key={g.utmSource ?? "—"} className="flex items-center gap-3 text-sm">
              <span className="text-slate-600 w-32 shrink-0 truncate">{g.utmSource || "—"}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(g._count._all / maxSourceCount) * 100}%` }}
                />
              </div>
              <span className="font-mono tabular-nums font-medium text-slate-900 w-8 text-right shrink-0">
                {g._count._all}
              </span>
            </div>
          ))}
          {sourceGroups.length === 0 && <p className="text-sm text-slate-400">Belum ada data.</p>}
        </div>
      </Card>
    </div>
  );
}
