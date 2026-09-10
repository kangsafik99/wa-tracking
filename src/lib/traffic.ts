import type { Prisma } from "@prisma/client";

// Klasifikasi trafik: "iklan" = punya minimal satu click ID (bukti klik dari
// platform iklan berbayar), "organik" = tidak ada sama sekali (lihat Ebook
// SINYAL 1.7: klik Google Maps / pencarian organik / direct BUKAN konversi
// iklan berbayar, meski tetap tertangkap sebagai lead).
export type TrafficFilter = "all" | "paid" | "organic";

export function parseTrafficFilter(value: string | undefined): TrafficFilter {
  return value === "paid" || value === "organic" ? value : "all";
}

const CLICK_ID_FIELDS = ["gclid", "ttclid", "fbclid", "ctwaClid"] as const;

export function leadTrafficWhere(filter: TrafficFilter): Prisma.LeadWhereInput {
  if (filter === "paid") {
    return { OR: CLICK_ID_FIELDS.map((f) => ({ [f]: { not: null } })) };
  }
  if (filter === "organic") {
    return { AND: CLICK_ID_FIELDS.map((f) => ({ [f]: null })) };
  }
  return {};
}

// Webhook log tidak menyimpan lead secara langsung, cuma payload mentah +
// ringkasan hasil (result). Klasifikasi di sini best-effort dari teks result
// yang ditulis processIncomingMessage(): "CTWA"/"linked to Contact"/"already
// processed" datang dari jalur voucher/CTWA (iklan), "orphan" murni chat
// tanpa atribusi apapun (organik).
export function webhookTrafficWhere(filter: TrafficFilter): Prisma.WebhookLogWhereInput {
  if (filter === "paid") {
    return {
      OR: [
        { result: { contains: "CTWA" } },
        { result: { contains: "linked to Contact" } },
        { result: { contains: "already processed" } },
      ],
    };
  }
  if (filter === "organic") {
    return { result: { contains: "orphan" } };
  }
  return {};
}
