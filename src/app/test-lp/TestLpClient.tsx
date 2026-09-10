"use client";

import { useEffect, useState } from "react";
import {
  ChatCircleDots,
  ArrowClockwise,
  CheckCircle,
  WhatsappLogo,
  CopySimple,
} from "@phosphor-icons/react/ssr";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const VOUCHER_KEY = "test_lp_voucher";
const WA_NUMBER_KEY = "test_lp_wa_number";

// Sama persis dengan generateVoucherCode() di Ebook SINYAL 1.4 -
// buang huruf ambigu (I, O, 0, 1) supaya tidak salah baca.
function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let r = "";
  for (let i = 0; i < 8; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
  return "BT-" + r;
}

type Captured = {
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  utm_source?: string;
  utm_medium?: string;
};

type ApiResult = { status: string; message?: string; error?: unknown };

const SCENARIOS: { label: string; params: string; hint: string }[] = [
  { label: "Direct / Organik", params: "", hint: "Tanpa click ID sama sekali" },
  { label: "Google Ads", params: "?gclid=test-gclid-123&utm_source=google&utm_medium=cpc", hint: "gclid" },
  { label: "Meta Ads", params: "?fbclid=test-fbclid-456&utm_source=facebook&utm_medium=cpc", hint: "fbclid" },
  { label: "TikTok Ads", params: "?ttclid=test-ttclid-789&utm_source=tiktok&utm_medium=cpc", hint: "ttclid" },
];

export function TestLpClient() {
  const [voucher, setVoucher] = useState<string | null>(null);
  const [captured, setCaptured] = useState<Captured>({});
  const [phone, setPhone] = useState("");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cap: Captured = {
      gclid: params.get("gclid") || undefined,
      fbclid: params.get("fbclid") || undefined,
      ttclid: params.get("ttclid") || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
    };
    setCaptured(cap);

    let v = window.localStorage.getItem(VOUCHER_KEY);
    if (!v) {
      v = generateVoucherCode();
      window.localStorage.setItem(VOUCHER_KEY, v);
    }
    setVoucher(v);

    const savedPhone = window.localStorage.getItem(WA_NUMBER_KEY);
    if (savedPhone) setPhone(savedPhone);

    setSending(true);
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        voucher_code: v,
        gclid: cap.gclid,
        fbclid: cap.fbclid,
        ttclid: cap.ttclid,
        utm_source: cap.utm_source,
        utm_medium: cap.utm_medium,
      }),
      // Wajib: tanpa ini, klik "Chat via WhatsApp" bisa membatalkan request
      // sebelum selesai (browser pindah ke app WhatsApp/unload halaman) -
      // voucher kelihatan di pesan WA tapi tidak pernah tercatat sebagai lead.
      keepalive: true,
    })
      .then((r) => r.json())
      .then((data) => setApiResult(data))
      .catch((err) => setApiResult({ status: "error", error: String(err) }))
      .finally(() => setSending(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetVoucher() {
    window.localStorage.removeItem(VOUCHER_KEY);
    window.location.reload();
  }

  function savePhone(value: string) {
    setPhone(value);
    window.localStorage.setItem(WA_NUMBER_KEY, value);
  }

  function copyVoucher() {
    if (!voucher) return;
    navigator.clipboard.writeText(voucher);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const message = `Halo Kak, saya mau klaim *VOUCHER DISKON ${voucher}* untuk testing. Boleh tanya-tanya dulu ya?`;
  const waHref = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : undefined;

  return (
    <div className="min-h-[100dvh] bg-slate-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <div className="inline-grid place-items-center w-11 h-11 rounded-xl bg-brand-600 text-white mb-3">
            <ChatCircleDots size={22} weight="fill" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Sewa Motor Murah - Test LP</h1>
          <p className="text-sm text-slate-500 mt-1">
            Halaman ini simulasi landing page (LPWA) untuk uji alur WA Tracking.
          </p>
        </div>

        <Card>
          <CardTitle className="mb-3">1. Simulasikan sumber klik</CardTitle>
          <p className="text-xs text-slate-500 mb-3">
            Klik salah satu untuk reload halaman dengan click ID berbeda (voucher tetap sama selama
            localStorage belum direset).
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIOS.map((s) => (
              <a
                key={s.label}
                href={`/test-lp${s.params}`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs hover:border-brand-400 hover:bg-brand-50 transition"
              >
                <p className="font-medium text-slate-800">{s.label}</p>
                <p className="text-slate-400 font-mono">{s.hint}</p>
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-3">2. Data yang tertangkap</CardTitle>
          <dl className="space-y-2 text-sm">
            <Row label="Voucher Code">
              <span className="font-mono font-medium text-slate-900">{voucher || "..."}</span>
              <button onClick={copyVoucher} className="text-slate-400 hover:text-slate-700 transition">
                {copied ? <CheckCircle size={14} weight="fill" className="text-brand-600" /> : <CopySimple size={14} />}
              </button>
            </Row>
            <Row label="GCLID">{captured.gclid || "-"}</Row>
            <Row label="FBCLID">{captured.fbclid || "-"}</Row>
            <Row label="TTCLID">{captured.ttclid || "-"}</Row>
            <Row label="UTM Source / Medium">
              {captured.utm_source || "Direct"} / {captured.utm_medium || "None"}
            </Row>
          </dl>
          <div className="mt-3 flex items-center justify-between">
            {apiResult && (
              <p
                className={`text-xs ${
                  apiResult.status === "success" ? "text-brand-700" : "text-red-600"
                }`}
              >
                POST /api/leads: {apiResult.status}
                {apiResult.message ? ` - ${apiResult.message}` : ""}
              </p>
            )}
            {sending && <p className="text-xs text-slate-400">Mengirim...</p>}
            <button
              onClick={resetVoucher}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition ml-auto"
            >
              <ArrowClockwise size={13} />
              Reset voucher (simulasi pengunjung baru)
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-3">3. Nomor WhatsApp tujuan (yang tersambung ke Gowa)</CardTitle>
          <input
            type="text"
            value={phone}
            onChange={(e) => savePhone(e.target.value)}
            placeholder="62812xxxxxxxx"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          />
          <p className="text-xs text-slate-400 mt-2">
            Disimpan di browser ini saja. Isi nomor WhatsApp yang sudah dikoneksikan ke Gowa untuk
            benar-benar menguji webhook masuk.
          </p>
        </Card>

        {sending ? (
          <Button disabled className="w-full">
            <WhatsappLogo size={18} weight="fill" />
            Menyiapkan pending lead, tunggu sebentar...
          </Button>
        ) : waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium py-3 hover:bg-brand-700 transition"
          >
            <WhatsappLogo size={18} weight="fill" />
            Chat via WhatsApp (bawa kode voucher)
          </a>
        ) : (
          <Button disabled className="w-full">
            <WhatsappLogo size={18} weight="fill" />
            Isi nomor WhatsApp dulu di atas
          </Button>
        )}

        <p className="text-xs text-center text-slate-400">
          Setelah chat masuk ke Gowa, cek dashboard - menu <strong>Leads</strong> (voucher harus naik ke
          status Contact) dan <strong>Webhook Log</strong> untuk lihat payload mentahnya.
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{label}</dt>
      <dd className="flex items-center gap-1.5 font-mono text-xs text-slate-900 text-right break-all">
        {children}
      </dd>
    </div>
  );
}
