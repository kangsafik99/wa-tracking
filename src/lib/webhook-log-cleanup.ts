import { prisma } from "@/lib/prisma";

// ~1 dari 20 request webhook memicu sekali sapuan pembersihan.
const CLEANUP_PROBABILITY = 0.05;

function getRetentionDays(): number {
  const raw = process.env.WEBHOOK_LOG_RETENTION_DAYS;
  const n = raw ? Number(raw) : 30;
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// Webhook Log cuma untuk verifikasi/debug jangka pendek (bukan sumber
// laporan - itu tugas tabel Lead), jadi tidak perlu disimpan selamanya.
// Daripada butuh cron job terpisah di EasyPanel, tiap request webhook
// punya peluang kecil untuk sekalian membersihkan baris yang sudah lewat
// masa retensi. Dipanggil fire-and-forget, tidak pernah melempar error
// yang bisa menggagalkan response webhook.
export async function maybeCleanupWebhookLogs(): Promise<void> {
  if (Math.random() >= CLEANUP_PROBABILITY) return;
  const cutoff = new Date(Date.now() - getRetentionDays() * 24 * 60 * 60 * 1000);
  try {
    const { count } = await prisma.webhookLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    if (count > 0) console.log(`webhook log cleanup: removed ${count} entri lebih dari ${getRetentionDays()} hari`);
  } catch (err) {
    console.error("webhook log cleanup failed:", err);
  }
}
