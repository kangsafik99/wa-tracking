import { headers } from "next/headers";

async function getBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

function InfoRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-sm text-slate-900 break-all mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export default async function SettingsPage() {
  const baseUrl = await getBaseUrl();
  const prefixes = process.env.VOUCHER_PREFIXES || "BT,RB,GM";
  const secretSet = Boolean(process.env.GOWA_WEBHOOK_SECRET);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Info koneksi untuk Gowa & landing page.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Webhook Gowa</p>
        <InfoRow label="Arahkan WHATSAPP_WEBHOOK ke" value={`${baseUrl}/api/webhook/gowa`} />
        <InfoRow
          label="WHATSAPP_WEBHOOK_SECRET"
          value={secretSet ? "sudah diset (samakan dengan GOWA_WEBHOOK_SECRET di sini)" : "belum diset — verifikasi signature dilewati"}
          mono={false}
        />
        <p className="text-xs text-slate-400 mt-3">
          Set env <code className="font-mono">WHATSAPP_WEBHOOK</code> &amp;{" "}
          <code className="font-mono">WHATSAPP_WEBHOOK_SECRET</code> di container Gowa, samakan secretnya dengan{" "}
          <code className="font-mono">GOWA_WEBHOOK_SECRET</code> di aplikasi ini.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Landing Page Capture</p>
        <InfoRow label="POST endpoint pending lead" value={`${baseUrl}/api/leads`} />
        <p className="text-xs text-slate-400 mt-3">
          Ganti URL <code className="font-mono">/exec</code> Apps Script di snippet landing page Anda dengan URL di
          atas. Body JSON tetap sama: <code className="font-mono">voucher_code, gclid, fbclid, ttclid, ctwa_clid,
          external_id, utm_source, utm_medium, fbc, fbp</code>.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Konfigurasi Voucher</p>
        <InfoRow label="Prefix aktif" value={prefixes} />
        <p className="text-xs text-slate-400 mt-3">
          Ubah lewat env <code className="font-mono">VOUCHER_PREFIXES</code> (pisahkan koma, mis.{" "}
          <code className="font-mono">BT,RB,GM</code>).
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-700 mb-3">Health Check</p>
        <InfoRow label="Endpoint" value={`${baseUrl}/api/health`} />
      </div>
    </div>
  );
}
