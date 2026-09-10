import type { Prisma } from "@prisma/client";

// Klasifikasi trafik: "iklan" = punya minimal satu click ID (bukti klik dari
// platform iklan berbayar), "organik" = tidak ada sama sekali (lihat Ebook
// SINYAL 1.7: klik Google Maps / pencarian organik / direct BUKAN konversi
// iklan berbayar, meski tetap tertangkap sebagai lead). Trafik organik tidak
// bisa dikirim balik jadi sinyal purchase ke platform iklan, jadi
// monitoringnya opsional (toggle di Settings, lihat src/lib/settings.ts) -
// where ini dipakai buat nyembunyiin organik kalau togglenya mati.
const CLICK_ID_FIELDS = ["gclid", "ttclid", "fbclid", "ctwaClid"] as const;

export function paidOnlyLeadWhere(): Prisma.LeadWhereInput {
  return { OR: CLICK_ID_FIELDS.map((f) => ({ [f]: { not: null } })) };
}

// Webhook log tidak menyimpan lead secara langsung, cuma payload mentah +
// ringkasan hasil (result). Klasifikasi di sini best-effort dari teks result
// yang ditulis processIncomingMessage(): "CTWA"/"linked to Contact"/"already
// processed" datang dari jalur voucher/CTWA (iklan), "orphan" murni chat
// tanpa atribusi apapun (organik).
export function paidOnlyWebhookWhere(): Prisma.WebhookLogWhereInput {
  return {
    OR: [
      { result: { contains: "CTWA" } },
      { result: { contains: "linked to Contact" } },
      { result: { contains: "already processed" } },
    ],
  };
}
