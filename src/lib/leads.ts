import type { LeadStatus } from "@prisma/client";

// Peringkat status — status hanya boleh NAIK (lihat Ebook SINYAL 4.4 & Bonus 02).
// Mempertahankan konversi yang sudah terkirim & keputusan manual CS.
export const STATUS_RANK: Record<LeadStatus, number> = {
  NEW_LEAD: 1,
  CONTACT: 2,
  FOLLOW_UP: 3,
  QUALIFIED_LEAD: 4,
  BOOKING: 5,
  PURCHASE: 6,
  CLOSED_LOST: 0, // status akhir terpisah, tidak ikut tangga naik
};

// Untuk status yang diekspor ke Meta (lihat META_EVENT_MAP di
// lib/export/event-maps.ts), label dibikin PERSIS sama dengan nama event
// standar Meta - biar seragam dan gampang dicocokkan lewat Events
// Manager/Ads Manager. Status yang tidak diekspor (Signal/Follow Up/
// Closed Lost) tidak punya padanan Meta, jadi tetap pakai istilah CRM.
// NEW_LEAD dilabeli "Signal" (bukan "New Lead") supaya tidak ambigu
// dengan QUALIFIED_LEAD yang labelnya "Lead".
export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW_LEAD: "Signal",
  CONTACT: "Contact",
  FOLLOW_UP: "Follow Up",
  QUALIFIED_LEAD: "Lead",
  BOOKING: "InitiateCheckout",
  PURCHASE: "Purchase",
  CLOSED_LOST: "Closed Lost",
};

export const FUNNEL_ORDER: LeadStatus[] = [
  "NEW_LEAD",
  "CONTACT",
  "QUALIFIED_LEAD",
  "BOOKING",
  "PURCHASE",
];

// true jika transisi cur -> target dianggap "naik" (atau override manual eksplisit)
export function isUpgrade(current: LeadStatus, target: LeadStatus): boolean {
  if (target === "CLOSED_LOST") return current !== "PURCHASE"; // jangan tutup lead yang sudah closing
  return STATUS_RANK[target] > STATUS_RANK[current];
}

// Prefix voucher dikelola dari Settings (database, lihat src/lib/settings.ts) -
// fungsi di sini murni/sync, cuma menyusun regex dari prefix yang dioper.
export function buildVoucherRegex(prefixes: string[]): RegExp {
  return new RegExp(`(?:${prefixes.join("|")})-[A-Z0-9]{6,10}`, "i");
}

export function findVoucherInText(text: string, prefixes: string[]): string | null {
  const match = text.match(buildVoucherRegex(prefixes));
  return match ? match[0].toUpperCase() : null;
}

// Samakan format nomor HP ke 62xxxxxxxxxx (tanpa +, spasi, atau suffix @s.whatsapp.net)
export function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let p = String(raw).replace(/@.*$/, "").replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

export function isValidPhone(phone: string): boolean {
  return phone.length >= 9;
}
