import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import { toSafeDestination } from "@/lib/export/types";
import { ExportPageClient } from "./ExportPageClient";

export default async function ExportPage() {
  const [rawDestinations, recentLogs] = await Promise.all([
    prisma.exportDestination.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.exportLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { destination: { select: { name: true, platform: true } } },
    }),
  ]);

  const destinations = rawDestinations.map(toSafeDestination);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Export</h2>
        <p className="text-sm text-slate-500">
          Kirim event Contact/Qualified/Booking/Purchase ke Meta CAPI, TikTok Events API, dan Google Ads.
        </p>
      </div>

      <ExportPageClient destinations={destinations} />

      <Card>
        <CardTitle className="mb-3">Riwayat Pengiriman Terbaru</CardTitle>
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-0 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Badge tone={log.status === "success" ? "brand" : "red"}>{log.status}</Badge>
                <span className="text-slate-700 truncate">
                  {log.destination.name} &middot; {log.eventName}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-xs whitespace-nowrap">
                {formatDate(log.createdAt)}
              </span>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <p className="text-sm text-slate-400 py-6 text-center">Belum ada pengiriman.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
