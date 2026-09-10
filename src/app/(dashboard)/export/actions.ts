"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { runExportForPlatform, type ExportRunResult } from "@/lib/export/run";
import type { ExportPlatform } from "@prisma/client";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export type DestinationInput = {
  id?: string;
  name: string;
  platform: ExportPlatform;
  active: boolean;
  isDefault: boolean;
  voucherPrefixes: string; // comma-separated dari form, di-parse jadi array
  metaDatasetId?: string;
  metaAccessToken?: string; // kosong saat edit = jangan ubah
  metaTestEventCode?: string;
  tiktokPixelCode?: string;
  tiktokAccessToken?: string; // kosong saat edit = jangan ubah
  tiktokTestEventCode?: string;
  googleConversionNames?: Record<string, string>;
};

function parsePrefixes(raw: string): string[] {
  return raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
}

export async function saveDestinationAction(input: DestinationInput): Promise<{ error?: string }> {
  await requireAuth();

  const voucherPrefixes = parsePrefixes(input.voucherPrefixes);
  if (!input.isDefault && voucherPrefixes.length === 0) {
    return { error: "Isi minimal satu prefix voucher, atau tandai sebagai default." };
  }

  const baseData = {
    name: input.name.trim(),
    platform: input.platform,
    active: input.active,
    isDefault: input.isDefault,
    voucherPrefixes,
    metaDatasetId: input.platform === "META" ? input.metaDatasetId?.trim() || null : null,
    metaTestEventCode: input.platform === "META" ? input.metaTestEventCode?.trim() || null : null,
    tiktokPixelCode: input.platform === "TIKTOK" ? input.tiktokPixelCode?.trim() || null : null,
    tiktokTestEventCode: input.platform === "TIKTOK" ? input.tiktokTestEventCode?.trim() || null : null,
    googleConversionNames: input.platform === "GOOGLE_CSV" ? input.googleConversionNames || {} : undefined,
  };

  if (input.id) {
    const existing = await prisma.exportDestination.findUnique({ where: { id: input.id } });
    if (!existing) return { error: "Destination tidak ditemukan." };

    await prisma.exportDestination.update({
      where: { id: input.id },
      data: {
        ...baseData,
        metaAccessToken:
          input.platform === "META"
            ? input.metaAccessToken?.trim() || existing.metaAccessToken
            : null,
        tiktokAccessToken:
          input.platform === "TIKTOK"
            ? input.tiktokAccessToken?.trim() || existing.tiktokAccessToken
            : null,
      },
    });
  } else {
    await prisma.exportDestination.create({
      data: {
        ...baseData,
        metaAccessToken: input.platform === "META" ? input.metaAccessToken?.trim() || null : null,
        tiktokAccessToken: input.platform === "TIKTOK" ? input.tiktokAccessToken?.trim() || null : null,
      },
    });
  }

  revalidatePath("/export");
  return {};
}

export async function deleteDestinationAction(id: string): Promise<{ error?: string }> {
  await requireAuth();
  await prisma.exportDestination.delete({ where: { id } });
  revalidatePath("/export");
  return {};
}

export async function toggleDestinationActiveAction(id: string, active: boolean): Promise<{ error?: string }> {
  await requireAuth();
  await prisma.exportDestination.update({ where: { id }, data: { active } });
  revalidatePath("/export");
  return {};
}

export async function runExportNowAction(
  platform: "META" | "TIKTOK"
): Promise<ExportRunResult & { error?: string }> {
  await requireAuth();
  try {
    const result = await runExportForPlatform(platform);
    revalidatePath("/export");
    return result;
  } catch (err) {
    return { sent: 0, skipped: 0, errors: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
