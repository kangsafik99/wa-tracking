import type { ExportDestination, Lead } from "@prisma/client";

// Route lead ke destination yang tepat (Ebook 1.2: click ID account-scoped,
// jadi tiap Ad Account butuh pemisahan sendiri). Dua cara mencocokkan, karena
// tidak semua lead punya voucher:
// 1. Prefix voucher - jalur normal LPWA/TikTok/Google (selalu lewat landing
//    page, selalu ada voucher).
// 2. Nomor WA penerima chat (waDeviceId) - satu-satunya sinyal untuk CTWA
//    (klik langsung ke WhatsApp, TIDAK PERNAH lewat landing page/voucher).
//    Iklan CTWA brand A pasti diarahkan ke nomor WA brand A, jadi nomor inilah
//    yang membedakan akun untuk lead semacam ini.
// Fallback terakhir: destination yang ditandai isDefault.
export function pickDestinationForLead(
  lead: Pick<Lead, "voucherCode" | "waDeviceId">,
  destinations: ExportDestination[]
): ExportDestination | null {
  const voucher = lead.voucherCode?.toUpperCase();
  if (voucher) {
    const matched = destinations.find(
      (d) => !d.isDefault && d.voucherPrefixes.some((p) => voucher.startsWith(p.toUpperCase()))
    );
    if (matched) return matched;
  }

  if (lead.waDeviceId) {
    const matched = destinations.find((d) => !d.isDefault && d.waNumbers.includes(lead.waDeviceId!));
    if (matched) return matched;
  }

  return destinations.find((d) => d.isDefault) || destinations[0] || null;
}

// Label ramah-baca untuk nomor WA di dashboard (Overview/Leads) - pakai nama
// Destination yang sudah diisi admin (mis. "Meta - Brand A") kalau nomornya
// terdaftar di sana, fallback ke nomor mentah kalau belum.
export function buildWaLabelMap(
  destinations: Pick<ExportDestination, "name" | "waNumbers">[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of destinations) {
    for (const num of d.waNumbers) {
      if (!map.has(num)) map.set(num, d.name);
    }
  }
  return map;
}

export function resolveWaLabel(waDeviceId: string | null | undefined, labelMap: Map<string, string>): string {
  if (!waDeviceId) return "-";
  return labelMap.get(waDeviceId) || waDeviceId;
}
