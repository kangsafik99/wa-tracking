import type { ExportDestination, Lead } from "@prisma/client";
import { GOOGLE_DEFAULT_CONVERSION_NAMES } from "@/lib/export/event-maps";

// Format kolom persis seperti yang diminta Google Ads "Uploads" (Ebook 5.2):
// Google Click ID, Conversion Name, Conversion Time, Conversion Value,
// Conversion Currency. Ini file untuk diunggah manual/terjadwal di Google Ads
// UI (Uploads > Schedules > Google Sheets/CSV) - tidak butuh OAuth/Developer
// Token seperti integrasi API langsung.
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// Format waktu wajib "yyyy-MM-dd HH:mm:ss +0700" (Ebook 5.2 langkah 3).
function formatConversionTime(date: Date): string {
  const wib = new Intl.DateTimeFormat("en-CA", {
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
  return `${wib.year}-${wib.month}-${wib.day} ${wib.hour}:${wib.minute}:${wib.second} +0700`;
}

export function buildGoogleConversionCsv(
  leads: Pick<Lead, "gclid" | "status" | "totalValue" | "eventTime" | "createdAt">[],
  destination: Pick<ExportDestination, "googleConversionNames">
): string {
  const names = {
    ...GOOGLE_DEFAULT_CONVERSION_NAMES,
    ...((destination.googleConversionNames as Record<string, string>) || {}),
  };

  const header = ["Google Click ID", "Conversion Name", "Conversion Time", "Conversion Value", "Conversion Currency"];
  const rows = leads
    .filter((l) => l.gclid && names[l.status])
    .map((l) => {
      const time = formatConversionTime(l.eventTime ? new Date(l.eventTime) : new Date(l.createdAt));
      const value = l.totalValue ? Number(l.totalValue) : 0;
      return [l.gclid as string, names[l.status] as string, time, String(value), "IDR"];
    });

  const lines = [header, ...rows].map((cols) => cols.map(csvEscape).join(","));
  return lines.join("\r\n");
}
