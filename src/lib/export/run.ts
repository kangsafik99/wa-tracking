import type { ExportPlatform, Lead, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EXPORTABLE_STATUSES, META_EVENT_MAP, TIKTOK_EVENT_MAP } from "@/lib/export/event-maps";
import { pickDestinationForLead } from "@/lib/export/destinations";
import { sendLeadToMeta } from "@/lib/export/meta";
import { sendLeadToTikTok } from "@/lib/export/tiktok";

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

// Jalankan pengiriman event server-side untuk satu platform push (Meta/TikTok).
// Google sengaja tidak lewat sini - dia CSV export on-demand, lihat google-csv.ts.
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
