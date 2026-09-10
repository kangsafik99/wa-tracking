import type { LeadStatus } from "@prisma/client";

// Status CRM yang dianggap "event konversi" untuk dikirim ke platform iklan
// (Ebook SINYAL 1.5). New Lead/Follow Up/Closed Lost sengaja tidak dikirim -
// belum ada sinyal kualifikasi apapun, atau bukan status yang perlu dilaporkan.
export const EXPORTABLE_STATUSES: LeadStatus[] = ["CONTACT", "QUALIFIED_LEAD", "BOOKING", "PURCHASE"];

// Setara META_EVENT_MAP di Bonus 04 Apps Script.
export const META_EVENT_MAP: Partial<Record<LeadStatus, string>> = {
  CONTACT: "Contact",
  QUALIFIED_LEAD: "Lead",
  BOOKING: "InitiateCheckout",
  PURCHASE: "Purchase",
};

// Standard event TikTok yang paling dekat maknanya (Ebook 5.3). Nama event
// diverifikasi ke daftar "Events API supported events" resmi TikTok - bukan
// "SubmitForm"/"CompletePayment" (nama lama yang sudah digantikan "Lead" dan
// "Purchase" di taksonomi standard event saat ini).
export const TIKTOK_EVENT_MAP: Partial<Record<LeadStatus, string>> = {
  CONTACT: "Contact",
  QUALIFIED_LEAD: "Lead",
  BOOKING: "InitiateCheckout",
  PURCHASE: "Purchase",
};

// Default nama Conversion Action Google - admin bisa timpa per destination
// lewat googleConversionNames (harus persis sama dengan yang dibuat di Google
// Ads UI, Ebook 5.2).
export const GOOGLE_DEFAULT_CONVERSION_NAMES: Partial<Record<LeadStatus, string>> = {
  CONTACT: "Contact",
  QUALIFIED_LEAD: "Qualified Lead",
  BOOKING: "Booking",
  PURCHASE: "Purchase",
};
