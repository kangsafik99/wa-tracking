"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle,
  X,
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
  GOOGLE: "Google Ads API",
};

const PLATFORM_TONE: Record<string, "blue" | "purple" | "indigo"> = {
  META: "blue",
  TIKTOK: "purple",
  GOOGLE: "indigo",
};

function OAuthBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const connected = searchParams.get("google_connected");
  const error = searchParams.get("google_error");

  if (!connected && !error) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
        connected ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-700"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {connected ? <CheckCircle size={16} weight="fill" /> : <WarningCircle size={16} weight="fill" />}
        {connected ? `Berhasil terhubung ke Google Ads (${connected}).` : `Gagal connect Google Ads: ${error}`}
      </span>
      <button onClick={() => router.replace("/export")} className="text-current opacity-60 hover:opacity-100">
        <X size={15} />
      </button>
    </div>
  );
}

export function ExportPageClient({ destinations }: { destinations: SafeExportDestination[] }) {
  const [formState, setFormState] = useState<{ open: boolean; editing: SafeExportDestination | null }>({
    open: false,
    editing: null,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [runResult, setRunResult] = useState<Record<string, string>>({});
  const [running, setRunning] = useState<string | null>(null);

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

  function handleRunNow(platform: "META" | "TIKTOK" | "GOOGLE") {
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
  const googleDestinations = destinations.filter((d) => d.platform === "GOOGLE" && d.active);

  return (
    <div className="space-y-6">
      <OAuthBanner />

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
                {d.platform === "GOOGLE" && (
                  <Badge tone={d.googleConnected ? "brand" : "amber"}>
                    {d.googleConnected ? "Terhubung" : "Belum terhubung"}
                  </Badge>
                )}
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
        <div className="flex flex-wrap gap-4">
          {(
            [
              { platform: "META" as const, label: "Kirim ke Meta", available: metaDestinations.length > 0 },
              { platform: "TIKTOK" as const, label: "Kirim ke TikTok", available: tiktokDestinations.length > 0 },
              { platform: "GOOGLE" as const, label: "Kirim ke Google", available: googleDestinations.length > 0 },
            ]
          ).map((row) => (
            <div key={row.platform}>
              <Button
                variant="secondary"
                size="sm"
                disabled={running === row.platform || !row.available}
                onClick={() => handleRunNow(row.platform)}
              >
                {running === row.platform ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={14} />
                )}
                {row.label}
              </Button>
              {runResult[row.platform] && (
                <p className="text-xs text-slate-500 mt-1.5">{runResult[row.platform]}</p>
              )}
              {!row.available && (
                <p className="text-xs text-slate-400 mt-1.5">Belum ada destination aktif.</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
