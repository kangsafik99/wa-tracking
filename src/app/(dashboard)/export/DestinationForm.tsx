"use client";

import { useState, useTransition } from "react";
import { CircleNotch, CheckCircle, GoogleLogo } from "@phosphor-icons/react/ssr";
import { saveDestinationAction, type DestinationInput } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import type { SafeExportDestination } from "@/lib/export/types";
import type { ExportPlatform } from "@prisma/client";

const STATUS_LABELS_FOR_GOOGLE: { key: string; label: string }[] = [
  { key: "CONTACT", label: "Contact" },
  { key: "QUALIFIED_LEAD", label: "Lead" },
  { key: "BOOKING", label: "InitiateCheckout" },
  { key: "PURCHASE", label: "Purchase" },
];

const PLATFORM_LABEL: Record<ExportPlatform, string> = {
  META: "Meta CAPI",
  TIKTOK: "TikTok Events API",
  GOOGLE: "Google Ads API",
};

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
  const [googleClientId, setGoogleClientId] = useState(initial?.googleClientId || "");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState("");
  const [googleCustomerId, setGoogleCustomerId] = useState(initial?.googleCustomerId || "");
  const [googleLoginCustomerId, setGoogleLoginCustomerId] = useState(initial?.googleLoginCustomerId || "");
  const [googleActions, setGoogleActions] = useState<Record<string, string>>(
    (initial?.googleConversionActions as Record<string, string>) || {}
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const redirectUri =
    typeof window !== "undefined" ? `${window.location.origin}/api/oauth/google/callback` : "";

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
      googleClientId,
      googleClientSecret,
      googleDeveloperToken,
      googleCustomerId,
      googleLoginCustomerId,
      googleConversionActions: googleActions,
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
          <Label>Nama</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="mis. Meta - Brand A" />
        </div>
        <div>
          <Label>Platform</Label>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as ExportPlatform)}
            disabled={Boolean(initial)}
          >
            <SelectTrigger>
              <SelectValue>{PLATFORM_LABEL[platform]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="META">Meta CAPI</SelectItem>
              <SelectItem value="TIKTOK">TikTok Events API</SelectItem>
              <SelectItem value="GOOGLE">Google Ads API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>
          Prefix voucher (pisahkan koma, mis. <span className="font-mono">BT, RB</span>)
        </Label>
        <Input
          value={voucherPrefixes}
          onChange={(e) => setVoucherPrefixes(e.target.value)}
          disabled={isDefault}
          placeholder="BT, RB"
          className="font-mono"
        />
      </div>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-brand-600"
          />
          Aktif
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="accent-brand-600"
          />
          Jadikan default (fallback untuk lead tanpa prefix cocok, mis. CTWA)
        </label>
      </div>

      {platform === "META" && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <Label>Dataset ID</Label>
            <Input value={metaDatasetId} onChange={(e) => setMetaDatasetId(e.target.value)} className="font-mono" />
          </div>
          <div>
            <Label>
              Access Token {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
            </Label>
            <Input
              type="password"
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={initial ? "••••••••" : ""}
              className="font-mono"
            />
          </div>
          <div className="col-span-2">
            <Label>
              Test Event Code <span className="text-slate-400">(opsional, buat testing di Events Manager)</span>
            </Label>
            <Input value={metaTestEventCode} onChange={(e) => setMetaTestEventCode(e.target.value)} className="font-mono" />
          </div>
        </div>
      )}

      {platform === "TIKTOK" && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div>
            <Label>Pixel Code</Label>
            <Input value={tiktokPixelCode} onChange={(e) => setTiktokPixelCode(e.target.value)} className="font-mono" />
          </div>
          <div>
            <Label>
              Access Token {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
            </Label>
            <Input
              type="password"
              value={tiktokAccessToken}
              onChange={(e) => setTiktokAccessToken(e.target.value)}
              placeholder={initial ? "••••••••" : ""}
              className="font-mono"
            />
          </div>
          <div className="col-span-2">
            <Label>
              Test Event Code <span className="text-slate-400">(opsional, buat testing di Events Manager)</span>
            </Label>
            <Input value={tiktokTestEventCode} onChange={(e) => setTiktokTestEventCode(e.target.value)} className="font-mono" />
          </div>
        </div>
      )}

      {platform === "GOOGLE" && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <p className="text-xs text-amber-800">
              Redirect URI yang harus didaftarkan di Google Cloud Console (OAuth Client &rarr; Authorized
              redirect URIs):
            </p>
            <p className="text-xs font-mono text-amber-900 break-all mt-1">{redirectUri || "..."}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client ID</Label>
              <Input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className="font-mono" />
            </div>
            <div>
              <Label>
                Client Secret {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
              </Label>
              <Input
                type="password"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                placeholder={initial ? "••••••••" : ""}
                className="font-mono"
              />
            </div>
            <div>
              <Label>
                Developer Token {initial && <span className="text-slate-400">(kosongkan jika tidak ganti)</span>}
              </Label>
              <Input
                type="password"
                value={googleDeveloperToken}
                onChange={(e) => setGoogleDeveloperToken(e.target.value)}
                placeholder={initial ? "••••••••" : ""}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Customer ID (akun Ads tujuan)</Label>
              <Input
                value={googleCustomerId}
                onChange={(e) => setGoogleCustomerId(e.target.value)}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>
            <div className="col-span-2">
              <Label>
                Login Customer ID (MCC) <span className="text-slate-400">(opsional, kalau dikelola lewat akun manager)</span>
              </Label>
              <Input
                value={googleLoginCustomerId}
                onChange={(e) => setGoogleLoginCustomerId(e.target.value)}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">
              Resource name Conversion Action per status (buat dulu di Google Ads UI, format{" "}
              <span className="font-mono">customers/123.../conversionActions/456...</span>).
            </p>
            <div className="grid grid-cols-2 gap-3">
              {STATUS_LABELS_FOR_GOOGLE.map((s) => (
                <div key={s.key}>
                  <Label>{s.label}</Label>
                  <Input
                    value={googleActions[s.key] || ""}
                    onChange={(e) => setGoogleActions((g) => ({ ...g, [s.key]: e.target.value }))}
                    placeholder="customers/.../conversionActions/..."
                    className="text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 px-3 py-2.5 flex items-center justify-between gap-3">
            {initial ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm ${
                    initial.googleConnected ? "text-brand-700" : "text-slate-500"
                  }`}
                >
                  {initial.googleConnected && <CheckCircle size={15} weight="fill" />}
                  {initial.googleConnected ? "Terhubung ke Google Ads" : "Belum terhubung"}
                </span>
                <a
                  href={`/api/oauth/google/start?destinationId=${initial.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium px-3 py-2 hover:bg-slate-800 transition"
                >
                  <GoogleLogo size={14} weight="bold" />
                  {initial.googleConnected ? "Sambungkan ulang" : "Connect Google Ads"}
                </a>
              </>
            ) : (
              <span className="text-xs text-slate-400">
                Simpan destination ini dulu, lalu tombol &quot;Connect Google Ads&quot; akan muncul di sini.
              </span>
            )}
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
