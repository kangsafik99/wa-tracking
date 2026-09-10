import type { ExportDestination, Lead } from "@prisma/client";
import { sha256Hash } from "@/lib/hash";

// Port dari buildPayload_/sendMeta_ di Bonus 04 Apps Script. event_id
// deterministik (eventName_voucherOrId) untuk dedup otomatis di sisi Meta
// (Ebook 5.1/5.4), terutama kalau nanti masih ada pixel browser juga terpasang.
export async function sendLeadToMeta(
  lead: Lead,
  eventName: string,
  destination: ExportDestination
): Promise<{ ok: boolean; status: number; body: string }> {
  const eventId = `${eventName}_${lead.voucherCode || lead.id}`;
  const isCtwa = Boolean(lead.ctwaClid);

  const userData: Record<string, unknown> = {};
  if (lead.ctwaClid) userData.ctwa_clid = lead.ctwaClid;
  if (lead.fbc) userData.fbc = lead.fbc;
  if (lead.fbp) userData.fbp = lead.fbp;
  const hashedExternalId = sha256Hash(lead.externalId);
  if (hashedExternalId) userData.external_id = [hashedExternalId];
  const hashedPhone = sha256Hash(lead.phone);
  if (hashedPhone) userData.ph = [hashedPhone];

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor((lead.eventTime ? new Date(lead.eventTime).getTime() : Date.now()) / 1000),
    event_id: eventId,
    action_source: isCtwa ? "business_messaging" : "website",
    user_data: userData,
    custom_data: {
      currency: "IDR",
      value: lead.totalValue ? Number(lead.totalValue) : 0,
    },
  };
  if (isCtwa) event.messaging_channel = "whatsapp";

  const payload: Record<string, unknown> = { data: [event] };
  if (destination.metaTestEventCode) payload.test_event_code = destination.metaTestEventCode;

  const url = `https://graph.facebook.com/v21.0/${destination.metaDatasetId}/events?access_token=${destination.metaAccessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 2000) };
}
