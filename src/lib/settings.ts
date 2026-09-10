import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";
const DEFAULT_PREFIXES = ["BT", "RB", "GM"];

function normalizePrefixes(prefixes: string[]): string[] {
  return prefixes.map((p) => p.trim().toUpperCase()).filter(Boolean);
}

async function getOrCreateSettings() {
  const existing = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;

  // Migrasi sekali dari env VOUCHER_PREFIXES lama (kalau pernah diisi) supaya
  // prefix custom yang sudah dipakai tidak hilang begitu pindah ke pengaturan
  // berbasis dashboard.
  const envPrefixes = process.env.VOUCHER_PREFIXES ? normalizePrefixes(process.env.VOUCHER_PREFIXES.split(",")) : [];

  return prisma.appSettings.create({
    data: { id: SETTINGS_ID, voucherPrefixes: envPrefixes.length ? envPrefixes : DEFAULT_PREFIXES },
  });
}

export async function getVoucherPrefixes(): Promise<string[]> {
  const settings = await getOrCreateSettings();
  return settings.voucherPrefixes.length ? settings.voucherPrefixes : DEFAULT_PREFIXES;
}

export async function setVoucherPrefixes(prefixes: string[]): Promise<string[]> {
  const normalized = normalizePrefixes(prefixes);
  const value = normalized.length ? normalized : DEFAULT_PREFIXES;
  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { voucherPrefixes: value },
    create: { id: SETTINGS_ID, voucherPrefixes: value },
  });
  return value;
}

export async function getShowOrganicTraffic(): Promise<boolean> {
  const settings = await getOrCreateSettings();
  return settings.showOrganicTraffic;
}

export async function setShowOrganicTraffic(value: boolean): Promise<boolean> {
  await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { showOrganicTraffic: value },
    create: { id: SETTINGS_ID, showOrganicTraffic: value },
  });
  return value;
}
