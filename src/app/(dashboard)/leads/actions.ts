"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isUpgrade } from "@/lib/leads";
import type { LeadStatus } from "@prisma/client";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function updateLeadStatusAction(
  leadId: string,
  targetStatus: LeadStatus,
  opts?: { force?: boolean }
): Promise<{ error?: string }> {
  await requireAuth();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "Lead tidak ditemukan." };

  if (!opts?.force && !isUpgrade(lead.status, targetStatus)) {
    return {
      error: `Status hanya boleh naik. ${lead.status} -> ${targetStatus} ditolak (gunakan override jika memang perlu turun).`,
    };
  }

  await prisma.lead.update({ where: { id: leadId }, data: { status: targetStatus } });
  revalidatePath("/leads");
  revalidatePath("/");
  return {};
}

export async function updateLeadFieldsAction(
  leadId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    totalValue?: string;
    branch?: string;
    notes?: string;
  }
): Promise<{ error?: string }> {
  await requireAuth();

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      name: data.name || null,
      phone: data.phone || null,
      email: data.email || null,
      totalValue: data.totalValue ? data.totalValue : null,
      branch: data.branch || null,
      notes: data.notes || null,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/");
  return {};
}
