"use client";

import { useState, useTransition } from "react";
import { CircleNotch } from "@phosphor-icons/react/ssr";
import { saveDestinationAction, type DestinationInput } from "./actions";
import { Button } from "@/components/ui/Button";
import { GOOGLE_DEFAULT_CONVERSION_NAMES } from "@/lib/export/event-maps";
import type { SafeExportDestination } from "@/lib/export/types";
import type { ExportPlatform } from "@prisma/client";

const STATUS_LABELS_FOR_GOOGLE: { key: string; label: string }[] = [
  { key: "CONTACT", label: "Contact" },
  { key: "QUALIFIED_LEAD", label: "Qualified Lead" },
  { key: "BOOKING", label: "Booking" },
  { key: "PURCHASE", label: "Purchase" },
];

export function DestinationForm({
  initial,
  onDone,
}: {
  initial: SafeExportDestination | null;
  onDone: () => void;
}) {
  const [platform, setPlatform] = useState<ExportPlatform>(initial?.platform || "META");
  const [name, setName] = useState(initial?.name || "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [voucherPrefixes, setVoucherPrefixes] = useState((initial?.voucherPrefixes || []).join(", "));
  const [metaDatasetId, setMetaDatasetId] = useState(initial?.metaDatasetId || "");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaTestEventCode, setMetaTestEventCode] = useState(initial?.metaTestEventCode || "");
  const [tiktokPixelCode, setTiktokPixelCode] = useState(initial?.tiktokPixelCode || "");
  const [tiktokAccessToken, setTiktokAccessToken] = useState("");
  const [tiktokTestEventCode, setTiktokTestEventCode] = useState(initial?.tiktokTestEventCode || "");
  const [googleNames, setGoogleNames] = useState<Record<string, string>>({
    ...GOOGLE_DEFAULT_CONVERSION_NAMES,
    ...((initial?.googleConversionNames as Record<string, string>) || {}),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: DestinationInput = {
      id: initial?.id,
      name,
      platform,
      active,
      isDefault,
      voucherPrefixes,
      metaDatasetId,
      metaAccessToken,
      metaTestEventCode,
      tiktokPixelCode,
      tiktokAccessToken,
      tiktokTestEventCode,
      googleConversionNames: googleNames,
    };
    startTransition(async () => {
      const res = await saveDestinationAction(input);
      if (res.error) {
        setError(res.error);
        return;
      }
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="mis. Meta - Brand A"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ExportPlatform)}
            disabled={Boolean(initial)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
          >
            <option value="META">Meta CAPI</option>
            <option value="TIKTOK">TikTok Events API</option>
            <option value="GOOGLE_CSV">Google (CSV export)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">
          Prefix voucher (pisahkan koma, mis. <span className="font-mono">BT, RB</span>)
        </label>
        <input
          value={voucherPrefixes}
          onChange={(e) => setVoucherPrefixes(e.target.value)}
          disabled={isDefault}
          placeholder="BT, RB"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100"
        />
      </div>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Jadikan default (fallback untuk lead tanpa prefix cocok, mis. CTWA)
        </label>
      </div>

      {platform === "META" && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Dataset ID</label>
            <input
              value={metaDatasetId}
              onChange={(e) => setMetaDatasetId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Access Token {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
            </label>
            <input
              type="password"
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={initial ? "••••••••" : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Test Event Code <span className="text-slate-400">(opsional, buat testing di Events Manager)</span>
            </label>
            <input
              value={metaTestEventCode}
              onChange={(e) => setMetaTestEventCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      )}

      {platform === "TIKTOK" && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Pixel Code</label>
            <input
              value={tiktokPixelCode}
              onChange={(e) => setTiktokPixelCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Access Token {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
            </label>
            <input
              type="password"
              value={tiktokAccessToken}
              onChange={(e) => setTiktokAccessToken(e.target.value)}
              placeholder={initial ? "••••••••" : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Test Event Code <span className="text-slate-400">(opsional, buat testing di Events Manager)</span>
            </label>
            <input
              value={tiktokTestEventCode}
              onChange={(e) => setTiktokTestEventCode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      )}

      {platform === "GOOGLE_CSV" && (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">
            Nama Conversion Action harus persis sama dengan yang dibuat di Google Ads UI.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_LABELS_FOR_GOOGLE.map((s) => (
              <div key={s.key}>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">{s.label}</label>
                <input
                  value={googleNames[s.key] || ""}
                  onChange={(e) => setGoogleNames((g) => ({ ...g, [s.key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch size={16} className="animate-spin" />}
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Batal
        </Button>
      </div>
    </form>
  );
}
