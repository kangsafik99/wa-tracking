import type { ExportDestination, ExportPlatform, Lead, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EXPORTABLE_STATUSES, META_EVENT_MAP, TIKTOK_EVENT_MAP } from "@/lib/export/event-maps";
import { pickDestinationForLead } from "@/lib/export/destinations";
import { sendLeadToMeta } from "@/lib/export/meta";
import { sendLeadToTikTok } from "@/lib/export/tiktok";
import { sendBatchToGoogleAds, type GoogleBatchItem } from "@/lib/export/google-ads";

const MAX_LEADS_PER_RUN = 200;

type PushPlatform = "META" | "TIKTOK";

function isEligibleForPlatform(lead: Lead, platform: PushPlatform): boolean {
  if (platform === "META") return Boolean(lead.ctwaClid || lead.fbc || lead.fbp || lead.fbclid);
  if (platform === "TIKTOK") return Boolean(lead.ttclid);
  return false;
}

function getEventName(platform: PushPlatform, status: LeadStatus): string | null {
  if (platform === "META") return META_EVENT_MAP[status] || null;
  return TIKTOK_EVENT_MAP[status] || null;
}

export type ExportRunResult = { sent: number; skipped: number; errors: number };

// Jalankan pengiriman event server-side untuk Meta/TikTok - keduanya API
// per-event sederhana (1 request = 1 conversion). Google beda pola (batch
// upload), lihat runGoogleExport() di bawah.
export async function runExportForPlatform(platform: PushPlatform): Promise<ExportRunResult> {
  const destinations = await prisma.exportDestination.findMany({
    where: { platform: platform as ExportPlatform, active: true },
  });
  if (destinations.length === 0) return { sent: 0, skipped: 0, errors: 0 };

  const candidateLeads = await prisma.lead.findMany({
    where: { status: { in: EXPORTABLE_STATUSES } },
    orderBy: { updatedAt: "desc" },
    take: MAX_LEADS_PER_RUN,
  });

  const destIds = destinations.map((d) => d.id);
  const successLogs = await prisma.exportLog.findMany({
    where: { destinationId: { in: destIds }, status: "success" },
    select: { destinationId: true, leadId: true, eventName: true },
  });
  const alreadySent = new Set(successLogs.map((l) => `${l.destinationId}:${l.leadId}:${l.eventName}`));

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const lead of candidateLeads) {
    if (!isEligibleForPlatform(lead, platform)) {
      skipped++;
      continue;
    }
    const eventName = getEventName(platform, lead.status);
    if (!eventName) {
      skipped++;
      continue;
    }
    const destination = pickDestinationForLead(lead, destinations);
    if (!destination) {
      skipped++;
      continue;
    }
    if (alreadySent.has(`${destination.id}:${lead.id}:${eventName}`)) {
      skipped++;
      continue;
    }

    try {
      const result =
        platform === "META"
          ? await sendLeadToMeta(lead, eventName, destination)
          : await sendLeadToTikTok(lead, eventName, destination);

      await prisma.exportLog.create({
        data: {
          destinationId: destination.id,
          leadId: lead.id,
          eventName,
          status: result.ok ? "success" : "error",
          responseBody: `HTTP ${result.status}: ${result.body}`,
        },
      });
      if (result.ok) sent++;
      else errors++;
    } catch (err) {
      await prisma.exportLog.create({
        data: {
          destinationId: destination.id,
          leadId: lead.id,
          eventName,
          status: "error",
          responseBody: err instanceof Error ? err.message : String(err),
        },
      });
      errors++;
    }
  }

  return { sent, skipped, errors };
}

// Google Ads beda pola dari Meta/TikTok: satu request bisa membawa banyak
// conversion sekaligus (ConversionUploadService memang didesain begitu), dan
// butuh access token dari OAuth per destination - jadi dikelompokkan per
// destination lalu dikirim sebagai batch, bukan satu-satu per lead.
export async function runGoogleExport(): Promise<ExportRunResult> {
  const destinations = await prisma.exportDestination.findMany({
    where: { platform: "GOOGLE", active: true },
  });
  if (destinations.length === 0) return { sent: 0, skipped: 0, errors: 0 };

  const candidateLeads = await prisma.lead.findMany({
    where: { status: { in: EXPORTABLE_STATUSES }, gclid: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: MAX_LEADS_PER_RUN,
  });

  const destIds = destinations.map((d) => d.id);
  const successLogs = await prisma.exportLog.findMany({
    where: { destinationId: { in: destIds }, status: "success" },
    select: { destinationId: true, leadId: true, eventName: true },
  });
  const alreadySent = new Set(successLogs.map((l) => `${l.destinationId}:${l.leadId}:${l.eventName}`));

  let skipped = 0;
  const batches = new Map<string, { destination: ExportDestination; items: (GoogleBatchItem & { eventName: string })[] }>();

  for (const lead of candidateLeads) {
    const eventName = lead.status; // Google pakai resource name per status, bukan nama event generik
    const destination = pickDestinationForLead(lead, destinations);
    if (!destination) {
      skipped++;
      continue;
    }
    const conversionActions = (destination.googleConversionActions as Record<string, string> | null) || {};
    const conversionActionResourceName = conversionActions[eventName];
    if (!conversionActionResourceName) {
      skipped++;
      continue;
    }
    if (alreadySent.has(`${destination.id}:${lead.id}:${eventName}`)) {
      skipped++;
      continue;
    }

    const batch = batches.get(destination.id) || { destination, items: [] };
    batch.items.push({ lead, conversionActionResourceName, eventName });
    batches.set(destination.id, batch);
  }

  let sent = 0;
  let errors = 0;

  for (const { destination, items } of batches.values()) {
    try {
      const result = await sendBatchToGoogleAds(items, destination);
      const status = result.ok ? "success" : "error";
      const responseBody = `HTTP ${result.status}: ${result.body}`;
      await prisma.exportLog.createMany({
        data: items.map((item) => ({
          destinationId: destination.id,
          leadId: item.lead.id,
          eventName: item.eventName,
          status,
          responseBody,
        })),
      });
      if (result.ok) sent += items.length;
      else errors += items.length;
    } catch (err) {
      const responseBody = err instanceof Error ? err.message : String(err);
      await prisma.exportLog.createMany({
        data: items.map((item) => ({
          destinationId: destination.id,
          leadId: item.lead.id,
          eventName: item.eventName,
          status: "error",
          responseBody,
        })),
      });
      errors += items.length;
    }
  }

  return { sent, skipped, errors };
}
