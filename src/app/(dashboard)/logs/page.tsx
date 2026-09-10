import { CaretRight, WebhooksLogo } from "@phosphor-icons/react/ssr";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { parseTrafficFilter, webhookTrafficWhere } from "@/lib/traffic";
import { Badge } from "@/components/ui/Badge";
import { TrafficToggle } from "@/components/TrafficToggle";

const PAGE_SIZE = 30;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; traffic?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const traffic = parseTrafficFilter(sp.traffic);
  const where = webhookTrafficWhere(traffic);

  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.webhookLog.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Webhook Log</h2>
          <p className="text-sm text-slate-500">
            Payload mentah dari Gowa untuk verifikasi/debug. {total.toLocaleString("id-ID")} entri.
          </p>
        </div>
        <TrafficToggle
          current={traffic}
          buildHref={(v) => `/logs${v === "all" ? "" : `?traffic=${v}`}`}
        />
      </div>

      <div className="space-y-2.5">
        {logs.map((log) => (
          <details key={log.id} className="group rounded-xl border border-slate-200 bg-white shadow-card">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 text-sm">
              <CaretRight size={13} className="text-slate-400 transition group-open:rotate-90 shrink-0" />
              <span className="text-slate-400 font-mono text-xs whitespace-nowrap">{formatDate(log.createdAt)}</span>
              <Badge tone="slate">{log.event || "unknown"}</Badge>
              <span className="text-slate-500 truncate flex-1">{log.result || ""}</span>
            </summary>
            <pre className="mx-4 mb-4 text-xs bg-slate-950 text-slate-200 rounded-lg p-3.5 overflow-x-auto font-mono">
              {JSON.stringify(log.raw, null, 2)}
            </pre>
          </details>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
            <WebhooksLogo size={28} className="text-slate-300" />
            <p className="text-sm text-center max-w-sm">
              {traffic === "all"
                ? "Belum ada webhook masuk. Pastikan Gowa sudah diarahkan ke endpoint webhook (lihat Settings)."
                : "Tidak ada log yang cocok dengan filter ini."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
