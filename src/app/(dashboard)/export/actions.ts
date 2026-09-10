"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { runExportForPlatform, runGoogleExport, type ExportRunResult } from "@/lib/export/run";
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
  googleClientId?: string;
  googleClientSecret?: string; // kosong saat edit = jangan ubah
  googleDeveloperToken?: string; // kosong saat edit = jangan ubah
  googleCustomerId?: string;
  googleLoginCustomerId?: string;
  googleConversionActions?: Record<string, string>;
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
    googleClientId: input.platform === "GOOGLE" ? input.googleClientId?.trim() || null : null,
    googleCustomerId: input.platform === "GOOGLE" ? input.googleCustomerId?.replace(/\D/g, "") || null : null,
    googleLoginCustomerId:
      input.platform === "GOOGLE" ? input.googleLoginCustomerId?.replace(/\D/g, "") || null : null,
    googleConversionActions: input.platform === "GOOGLE" ? input.googleConversionActions || {} : undefined,
  };

  if (input.id) {
    const existing = await prisma.exportDestination.findUnique({ where: { id: input.id } });
    if (!existing) return { error: "Destination tidak ditemukan." };

    await prisma.exportDestination.update({
      where: { id: input.id },
      data: {
        ...baseData,
        metaAccessToken:
          input.platform === "META" ? input.metaAccessToken?.trim() || existing.metaAccessToken : null,
        tiktokAccessToken:
          input.platform === "TIKTOK" ? input.tiktokAccessToken?.trim() || existing.tiktokAccessToken : null,
        googleClientSecret:
          input.platform === "GOOGLE" ? input.googleClientSecret?.trim() || existing.googleClientSecret : null,
        googleDeveloperToken:
          input.platform === "GOOGLE" ? input.googleDeveloperToken?.trim() || existing.googleDeveloperToken : null,
        // refresh token CUMA diisi lewat alur OAuth callback, tidak pernah dari form ini.
        // Kalau ganti Client ID/Secret, token lama kemungkinan tidak valid lagi -
        // admin perlu klik "Connect Google Ads" ulang.
        googleRefreshToken: input.platform === "GOOGLE" ? existing.googleRefreshToken : null,
      },
    });
  } else {
    await prisma.exportDestination.create({
      data: {
        ...baseData,
        metaAccessToken: input.platform === "META" ? input.metaAccessToken?.trim() || null : null,
        tiktokAccessToken: input.platform === "TIKTOK" ? input.tiktokAccessToken?.trim() || null : null,
        googleClientSecret: input.platform === "GOOGLE" ? input.googleClientSecret?.trim() || null : null,
        googleDeveloperToken: input.platform === "GOOGLE" ? input.googleDeveloperToken?.trim() || null : null,
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
  platform: "META" | "TIKTOK" | "GOOGLE"
): Promise<ExportRunResult & { error?: string }> {
  await requireAuth();
  try {
    const result = platform === "GOOGLE" ? await runGoogleExport() : await runExportForPlatform(platform);
    revalidatePath("/export");
    return result;
  } catch (err) {
    return { sent: 0, skipped: 0, errors: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
