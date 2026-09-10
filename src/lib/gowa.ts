import crypto from "crypto";
import { normalizePhone } from "@/lib/leads";

// Bentuk payload webhook Gowa (go-whatsapp-web-multidevice), lihat docs/webhook-payload.md:
// { event: "message", device_id, session_id?, payload: { id, chat_id, from, from_name,
//   sender_display_name, timestamp, is_from_me, body, referral?: { ctwa_clid, ... } } }
export type GowaWebhookBody = {
  event?: string;
  device_id?: string;
  session_id?: string;
  payload?: {
    id?: string;
    chat_id?: string;
    from?: string;
    from_lid?: string;
    from_name?: string;
    sender_display_name?: string;
    timestamp?: string;
    is_from_me?: boolean;
    body?: string;
    referral?: {
      ctwa_clid?: string;
      source_url?: string;
      source_id?: string;
      ref?: string;
      source_app?: string;
      media_type?: string;
      ad_title?: string;
      ad_body?: string;
    };
  };
};

export type IncomingMessage = {
  text: string;
  phone: string;
  name: string;
  ctwaClid: string | null;
  isFromMe: boolean;
  // Nomor WA (device Gowa) yang MENERIMA chat ini, bukan nomor pengirim -
  // satu-satunya cara membedakan akun/brand untuk lead CTWA yang tidak
  // pernah punya voucher (lihat src/lib/export/destinations.ts).
  waDeviceId: string | null;
};

export function parseGowaMessage(body: GowaWebhookBody): IncomingMessage | null {
  if (body.event !== "message" || !body.payload) return null;
  const p = body.payload;

  const phoneRaw = p.from || p.chat_id || "";
  const name = p.sender_display_name || p.from_name || "Pelanggan WA";
  const waDeviceId = body.device_id ? normalizePhone(body.device_id) : null;

  return {
    text: p.body || "",
    phone: phoneRaw,
    name,
    ctwaClid: p.referral?.ctwa_clid || null,
    isFromMe: p.is_from_me === true,
    waDeviceId: waDeviceId || null,
  };
}

// Verifikasi header X-Hub-Signature-256 ("sha256=<hex>") pakai WHATSAPP_WEBHOOK_SECRET.
// rawBody HARUS string mentah dari request, sebelum di-JSON.parse.
export function verifyGowaSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.GOWA_WEBHOOK_SECRET;
  if (!secret) return true; // secret belum diset -> lewati verifikasi (dev/awal setup)
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const received = signatureHeader.replace(/^sha256=/, "").trim();

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex")
  );
}
