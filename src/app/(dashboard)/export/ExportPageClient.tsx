"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  PaperPlaneTilt,
  DownloadSimple,
} from "@phosphor-icons/react/ssr";
import type { SafeExportDestination } from "@/lib/export/types";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DestinationForm } from "./DestinationForm";
import {
  deleteDestinationAction,
  runExportNowAction,
  toggleDestinationActiveAction,
} from "./actions";

const PLATFORM_LABEL: Record<string, string> = {
  META: "Meta CAPI",
  TIKTOK: "TikTok Events API",
  GOOGLE_CSV: "Google (CSV)",
};

const PLATFORM_TONE: Record<string, "blue" | "purple" | "indigo"> = {
  META: "blue",
  TIKTOK: "purple",
  GOOGLE_CSV: "indigo",
};

export function ExportPageClient({ destinations }: { destinations: SafeExportDestination[] }) {
  const [formState, setFormState] = useState<{ open: boolean; editing: SafeExportDestination | null }>({
    open: false,
    editing: null,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [runResult, setRunResult] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [csvRange, setCsvRange] = useState<{ from: string; to: string }>(() => {
    const to = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  });

  function handleToggle(id: string, active: boolean) {
    setPendingId(id);
    startTransition(async () => {
      await toggleDestinationActiveAction(id, active);
      setPendingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus destination ini? Log pengiriman terkait juga ikut terhapus.")) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteDestinationAction(id);
      setPendingId(null);
    });
  }

  function handleRunNow(platform: "META" | "TIKTOK") {
    setRunning(platform);
    startTransition(async () => {
      const res = await runExportNowAction(platform);
      setRunning(null);
      setRunResult((r) => ({
        ...r,
        [platform]: res.error
          ? `Error: ${res.error}`
          : `Terkirim ${res.sent}, dilewati ${res.skipped}, gagal ${res.errors}`,
      }));
    });
  }

  const metaDestinations = destinations.filter((d) => d.platform === "META" && d.active);
  const tiktokDestinations = destinations.filter((d) => d.platform === "TIKTOK" && d.active);
  const googleDestinations = destinations.filter((d) => d.platform === "GOOGLE_CSV");

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Destinations</CardTitle>
          {!formState.open && (
            <Button size="sm" onClick={() => setFormState({ open: true, editing: null })}>
              <Plus size={15} />
              Tambah Destination
            </Button>
          )}
        </div>

        {formState.open && (
          <div className="mb-4">
            <DestinationForm
              initial={formState.editing}
              onDone={() => setFormState({ open: false, editing: null })}
            />
          </div>
        )}

        <div className="space-y-2">
          {destinations.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Badge tone={PLATFORM_TONE[d.platform]}>{PLATFORM_LABEL[d.platform]}</Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {d.isDefault ? "default (fallback)" : d.voucherPrefixes.join(", ") || "-"}
                  </p>
                </div>
                {!d.active && <Badge tone="slate">Nonaktif</Badge>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleToggle(d.id, !d.active)}
                  disabled={pendingId === d.id}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 transition"
                >
                  {d.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => setFormState({ open: true, editing: d })}
                  className="text-slate-400 hover:text-slate-700 p-1.5 transition"
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={pendingId === d.id}
                  className="text-slate-400 hover:text-red-600 p-1.5 transition"
                >
                  {pendingId === d.id ? <CircleNotch size={15} className="animate-spin" /> : <Trash size={15} />}
                </button>
              </div>
            </div>
          ))}
          {destinations.length === 0 && !formState.open && (
            <p className="text-sm text-slate-400 py-6 text-center">
              Belum ada destination. Tambah minimal satu supaya event bisa terkirim.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-4">Kirim Sekarang</CardTitle>
        <p className="text-xs text-slate-500 mb-4">
          Normalnya berjalan otomatis tiap beberapa menit di background. Tombol ini untuk memicu manual
          (mis. buat testing).
        </p>
        <div className="flex flex-wrap gap-3">
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={running === "META" || metaDestinations.length === 0}
              onClick={() => handleRunNow("META")}
            >
              {running === "META" ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
              Kirim ke Meta
            </Button>
            {runResult.META && <p className="text-xs text-slate-500 mt-1.5">{runResult.META}</p>}
            {metaDestinations.length === 0 && (
              <p className="text-xs text-slate-400 mt-1.5">Belum ada destination Meta yang aktif.</p>
            )}
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={running === "TIKTOK" || tiktokDestinations.length === 0}
              onClick={() => handleRunNow("TIKTOK")}
            >
              {running === "TIKTOK" ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={14} />
              )}
              Kirim ke TikTok
            </Button>
            {runResult.TIKTOK && <p className="text-xs text-slate-500 mt-1.5">{runResult.TIKTOK}</p>}
            {tiktokDestinations.length === 0 && (
              <p className="text-xs text-slate-400 mt-1.5">Belum ada destination TikTok yang aktif.</p>
            )}
          </div>
        </div>
      </Card>

      {googleDestinations.length > 0 && (
        <Card>
          <CardTitle className="mb-4">Export CSV Google Ads</CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Dari tanggal</label>
              <input
                type="date"
                value={csvRange.from}
                onChange={(e) => setCsvRange((r) => ({ ...r, from: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Sampai tanggal</label>
              <input
                type="date"
                value={csvRange.to}
                onChange={(e) => setCsvRange((r) => ({ ...r, to: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {googleDestinations.map((d) => (
              <a
                key={d.id}
                href={`/api/export/google-csv?destinationId=${d.id}&from=${csvRange.from}&to=${csvRange.to}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 transition"
              >
                <DownloadSimple size={15} />
                Download ({d.name})
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Unggah file CSV ini manual di Google Ads &rarr; Tools &amp; Settings &rarr; Conversions &rarr;
            Uploads.
          </p>
        </Card>
      )}
    </div>
  );
}
