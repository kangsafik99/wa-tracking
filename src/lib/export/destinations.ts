import type { ExportDestination, Lead } from "@prisma/client";

// Route lead ke destination yang tepat lewat prefix voucher (Ebook 1.2: click
// ID account-scoped, jadi tiap Ad Account butuh pemisahan sendiri). Fallback
// terakhir: destination yang ditandai isDefault.
export function pickDestinationForLead(
  lead: Pick<Lead, "voucherCode">,
  destinations: ExportDestination[]
): ExportDestination | null {
  const voucher = lead.voucherCode?.toUpperCase();
  if (voucher) {
    const matched = destinations.find(
      (d) => !d.isDefault && d.voucherPrefixes.some((p) => voucher.startsWith(p.toUpperCase()))
    );
    if (matched) return matched;
  }

  return destinations.find((d) => d.isDefault) || destinations[0] || null;
}
