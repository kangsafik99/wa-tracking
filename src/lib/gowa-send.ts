import { normalizePhone } from "@/lib/leads";

// Kirim pesan WhatsApp lewat REST API Gowa sendiri (bukan webhook - ini arah
// sebaliknya, dashboard -> Gowa). Dipakai fitur balas chat di halaman Inbox.
// Skema diverifikasi langsung ke source code go-whatsapp-web-multidevice
// (src/ui/rest/send.go, src/domains/send/text.go, src/cmd/rest.go) - bukan
// tebakan: endpoint POST /send/message, body {phone, message}, Basic Auth
// dari APP_BASIC_AUTH di sisi Gowa, respons sukses {code:"SUCCESS",
// results:{message_id,...}}.
//
// Env dibutuhkan: GOWA_API_URL (base URL Gowa, mis. https://gowa.domain.com),
// GOWA_API_USERNAME/GOWA_API_PASSWORD (samakan dengan APP_BASIC_AUTH di
// container Gowa). GOWA_DEVICE_ID opsional - cuma perlu diisi kalau Gowa
// punya LEBIH DARI SATU device terhubung; untuk satu nomor WA (skenario kita)
// tidak perlu diisi, Gowa otomatis pakai device satu-satunya yang ada.
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const baseUrl = process.env.GOWA_API_URL;
  const username = process.env.GOWA_API_USERNAME;
  const password = process.env.GOWA_API_PASSWORD;

  if (!baseUrl || !username || !password) {
    return { ok: false, error: "GOWA_API_URL/GOWA_API_USERNAME/GOWA_API_PASSWORD belum diset" };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "Nomor tujuan tidak valid" };

  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  };
  if (process.env.GOWA_DEVICE_ID) headers["X-Device-Id"] = process.env.GOWA_DEVICE_ID;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/send/message`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: normalized, message: text }),
    });

    const raw = await res.text();
    let data: { code?: string; message?: string; results?: { message_id?: string } } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      // biarkan data kosong, tangani lewat res.ok di bawah
    }

    if (!res.ok || data.code !== "SUCCESS") {
      return { ok: false, error: data.message || raw.slice(0, 300) || `HTTP ${res.status}` };
    }
    return { ok: true, messageId: data.results?.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
