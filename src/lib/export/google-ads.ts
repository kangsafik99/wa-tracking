import type { ExportDestination, Lead } from "@prisma/client";
import { getAccessToken } from "@/lib/export/google-oauth";

// Google Ads API - ConversionUploadService.uploadClickConversions. Referensi:
// Ebook SINYAL 5.2 (dulu lewat Google Sheet terjadwal, sekarang langsung API).
// Endpoint/header/field diverifikasi ke proto resmi googleapis/googleapis
// (conversion_upload_service.proto) & docs REST Google Ads API, bukan tebakan.
const GOOGLE_ADS_API_VERSION = "v25";

function formatConversionDateTime(date: Date): string {
  // Format wajib Google: "yyyy-MM-dd HH:mm:ss+HH:mm" (selalu WIB/+07:00 di sini).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}+07:00`;
}

export type GoogleBatchItem = { lead: Lead; conversionActionResourceName: string };

// Batch upload (bukan satu-satu seperti Meta/TikTok) - Google Ads API memang
// didesain untuk menerima banyak conversion sekaligus dalam satu request.
export async function sendBatchToGoogleAds(
  items: GoogleBatchItem[],
  destination: ExportDestination
): Promise<{ ok: boolean; status: number; body: string }> {
  const tokenResult = await getAccessToken(destination);
  if (!tokenResult.ok) {
    return { ok: false, status: 0, body: tokenResult.error };
  }
  if (!destination.googleCustomerId || !destination.googleDeveloperToken) {
    return { ok: false, status: 0, body: "Customer ID atau Developer Token belum diisi" };
  }

  const conversions = items.map(({ lead, conversionActionResourceName }) => ({
    gclid: lead.gclid,
    conversionAction: conversionActionResourceName,
    conversionDateTime: formatConversionDateTime(lead.eventTime || lead.createdAt),
    conversionValue: lead.totalValue ? Number(lead.totalValue) : 0,
    currencyCode: "IDR",
    orderId: lead.voucherCode || lead.id, // bantu dedup/telusur di sisi Google
  }));

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${destination.googleCustomerId}:uploadClickConversions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokenResult.value}`,
    "developer-token": destination.googleDeveloperToken,
  };
  if (destination.googleLoginCustomerId) headers["login-customer-id"] = destination.googleLoginCustomerId;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ conversions, partialFailure: true }),
  });
  const body = await res.text();

  // partialFailure: true berarti HTTP-nya tetap 200 walau sebagian/semua
  // conversion di batch gagal - baru dianggap sukses kalau tidak ada
  // partialFailureError sama sekali. Kalau ada, seluruh batch ditandai error
  // dan diulang di run berikutnya (aman - upload gclid+conversionAction+waktu
  // yang sama dua kali tidak menghitung ganda, Ebook 5.4).
  let ok = res.ok;
  if (ok) {
    try {
      const json = JSON.parse(body) as { partialFailureError?: unknown };
      if (json.partialFailureError) ok = false;
    } catch {
      // respons bukan JSON valid -> anggap gagal, biar kelihatan di log
      ok = false;
    }
  }

  return { ok, status: res.status, body: body.slice(0, 3000) };
}
