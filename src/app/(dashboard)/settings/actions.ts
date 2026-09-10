"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { setVoucherPrefixes } from "@/lib/settings";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function updateVoucherPrefixesAction(
  raw: string
): Promise<{ error?: string; prefixes?: string[] }> {
  await requireAuth();

  const parsed = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parsed.length === 0) {
    return { error: "Isi minimal satu prefix." };
  }
  if (parsed.some((p) => !/^[A-Za-z0-9]+$/.test(p))) {
    return { error: "Prefix cuma boleh huruf/angka, tanpa spasi atau simbol." };
  }

  const saved = await setVoucherPrefixes(parsed);
  revalidatePath("/settings");
  return { prefixes: saved };
}
