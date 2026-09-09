import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 30;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [logs, total] = await Promise.all([
    prisma.webhookLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.webhookLog.count(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Webhook Log</h2>
        <p className="text-sm text-slate-500">
          Payload mentah dari Gowa untuk verifikasi/debug. {total.toLocaleString("id-ID")} entri.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <details key={log.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm flex items-center justify-between gap-4">
              <span className="text-slate-500">{formatDate(log.createdAt)}</span>
              <span className="text-slate-700 font-medium">{log.event || "—"}</span>
              <span className="text-slate-500 truncate max-w-[280px]">{log.result || ""}</span>
            </summary>
            <pre className="mt-3 text-xs bg-slate-50 rounded-lg p-3 overflow-x-auto text-slate-700">
              {JSON.stringify(log.raw, null, 2)}
            </pre>
          </details>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-slate-400 py-10 text-center">
            Belum ada webhook masuk. Pastikan Gowa sudah diarahkan ke endpoint webhook (lihat Settings).
          </p>
        )}
      </div>
    </div>
  );
}
