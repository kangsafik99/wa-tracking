import { headers } from "next/headers";
import { WebhooksLogo, LinkSimple, Ticket, Heartbeat } from "@phosphor-icons/react/ssr";
import { Card, CardTitle } from "@/components/ui/Card";

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

function SectionIcon({ icon: Icon }: { icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" }> }) {
  return (
    <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700 shrink-0">
      <Icon size={16} weight="fill" />
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

      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <SectionIcon icon={WebhooksLogo} />
          <CardTitle>Webhook Gowa</CardTitle>
        </div>
        <InfoRow label="Arahkan WHATSAPP_WEBHOOK ke" value={`${baseUrl}/api/webhook/gowa`} />
        <InfoRow
          label="WHATSAPP_WEBHOOK_SECRET"
          value={secretSet ? "sudah diset (samakan dengan GOWA_WEBHOOK_SECRET di sini)" : "belum diset, verifikasi signature dilewati"}
          mono={false}
        />
        <p className="text-xs text-slate-400 mt-3">
          Set env <code className="font-mono">WHATSAPP_WEBHOOK</code> &amp;{" "}
          <code className="font-mono">WHATSAPP_WEBHOOK_SECRET</code> di container Gowa, samakan secretnya dengan{" "}
          <code className="font-mono">GOWA_WEBHOOK_SECRET</code> di aplikasi ini.
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <SectionIcon icon={LinkSimple} />
          <CardTitle>Landing Page Capture</CardTitle>
        </div>
        <InfoRow label="POST endpoint pending lead" value={`${baseUrl}/api/leads`} />
        <p className="text-xs text-slate-400 mt-3">
          Ganti URL <code className="font-mono">/exec</code> Apps Script di snippet landing page Anda dengan URL di
          atas. Body JSON tetap sama: <code className="font-mono">voucher_code, gclid, fbclid, ttclid, ctwa_clid,
          external_id, utm_source, utm_medium, fbc, fbp</code>.
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <SectionIcon icon={Ticket} />
          <CardTitle>Konfigurasi Voucher</CardTitle>
        </div>
        <InfoRow label="Prefix aktif" value={prefixes} />
        <p className="text-xs text-slate-400 mt-3">
          Ubah lewat env <code className="font-mono">VOUCHER_PREFIXES</code> (pisahkan koma, mis.{" "}
          <code className="font-mono">BT,RB,GM</code>).
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2.5 mb-3">
          <SectionIcon icon={Heartbeat} />
          <CardTitle>Health Check</CardTitle>
        </div>
        <InfoRow label="Endpoint" value={`${baseUrl}/api/health`} />
      </Card>
    </div>
  );
}
