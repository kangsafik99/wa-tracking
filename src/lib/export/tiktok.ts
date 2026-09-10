import type { ExportDestination, Lead } from "@prisma/client";
import { sha256Hash } from "@/lib/hash";

// TikTok Events API 2.0 (URL path masih v1.3) - server-side. Referensi:
// Ebook SINYAL 5.3. Skema field di bawah sudah diverifikasi langsung ke
// dokumentasi resmi TikTok Business API ("Report App, Web, Offline, or CRM
// Events" & "Events API supported events"), bukan tebakan:
// - Endpoint: POST https://business-api.tiktok.com/open_api/v1.3/event/track/
// - Auth lewat header "Access-Token" (bukan Authorization/Bearer)
// - Hash No HP ada di user.phone (BUKAN user.phone_number)
// - ttclid ada di dalam objek "user", bukan di "ad"/"context"
// - Nama standard event saat ini: Contact, Lead (dulu "SubmitForm"),
//   Purchase (dulu "CompletePayment") - lihat event-maps.ts
export async function sendLeadToTikTok(
  lead: Lead,
  eventName: string,
  destination: ExportDestination
): Promise<{ ok: boolean; status: number; body: string }> {
  const eventId = `${eventName}_${lead.voucherCode || lead.id}`;

  const user: Record<string, unknown> = {};
  if (lead.ttclid) user.ttclid = lead.ttclid;
  const hashedPhone = sha256Hash(lead.phone);
  if (hashedPhone) user.phone = [hashedPhone];
  const hashedExternalId = sha256Hash(lead.externalId);
  if (hashedExternalId) user.external_id = [hashedExternalId];

  const event: Record<string, unknown> = {
    event: eventName,
    event_time: Math.floor((lead.eventTime ? new Date(lead.eventTime).getTime() : Date.now()) / 1000),
    event_id: eventId,
    user,
    properties: {
      currency: "IDR",
      value: lead.totalValue ? Number(lead.totalValue) : 0,
    },
  };

  const payload: Record<string, unknown> = {
    event_source: "web",
    event_source_id: destination.tiktokPixelCode,
    data: [event],
  };
  if (destination.tiktokTestEventCode) payload.test_event_code = destination.tiktokTestEventCode;

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": destination.tiktokAccessToken || "",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 2000) };
}
