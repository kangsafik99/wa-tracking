"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/gowa-send";
import { sendMetaEventNow } from "@/lib/export/run";
import { updateLeadStatusAction } from "@/app/(dashboard)/leads/actions";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
}

export async function sendReplyAction(leadId: string, text: string): Promise<{ error?: string }> {
  await requireAuth();
  const body = text.trim();
  if (!body) return { error: "Pesan tidak boleh kosong." };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) return { error: "Lead ini belum punya nomor WA." };

  const result = await sendWhatsAppMessage(lead.phone, body);
  if (!result.ok) return { error: result.error || "Gagal mengirim pesan." };

  await prisma.message.create({
    data: { leadId, direction: "out", body, waMessageId: result.messageId || null },
  });
  revalidatePath("/inbox");
  return {};
}

export async function markQualifiedAction(leadId: string): Promise<{ error?: string }> {
  await requireAuth();
  const res = await updateLeadStatusAction(leadId, "QUALIFIED_LEAD");
  revalidatePath("/inbox");
  return res;
}

export async function markLostAction(leadId: string): Promise<{ error?: string }> {
  await requireAuth();
  const res = await updateLeadStatusAction(leadId, "CLOSED_LOST");
  revalidatePath("/inbox");
  return res;
}

export async function sendPurchaseNowAction(leadId: string): Promise<{ error?: string; message?: string }> {
  await requireAuth();
  const statusRes = await updateLeadStatusAction(leadId, "PURCHASE", { force: true });
  if (statusRes.error) return statusRes;

  const sendRes = await sendMetaEventNow(leadId);
  revalidatePath("/inbox");
  return sendRes.ok ? { message: sendRes.message } : { error: sendRes.message };
}

export async function sendCustomEventNowAction(leadId: string): Promise<{ error?: string; message?: string }> {
  await requireAuth();
  const sendRes = await sendMetaEventNow(leadId);
  revalidatePath("/inbox");
  return sendRes.ok ? { message: sendRes.message } : { error: sendRes.message };
}
