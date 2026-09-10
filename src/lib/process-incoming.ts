import { prisma } from "@/lib/prisma";
import { findVoucherInText, normalizePhone, isValidPhone } from "@/lib/leads";
import { getVoucherPrefixes } from "@/lib/settings";
import type { IncomingMessage } from "@/lib/gowa";

async function logMessage(leadId: string, direction: "in" | "out", body: string, waMessageId: string | null) {
  await prisma.message.create({ data: { leadId, direction, body, waMessageId } });
}

// Port dari processIncoming_ + createOrphanLead_ (Bonus 01 Apps Script), ditambah
// penangkapan CTWA (referral.ctwa_clid), dan sekarang juga mencatat setiap pesan
// ke riwayat percakapan (Message) supaya bisa ditampilkan di halaman Inbox.
export async function processIncomingMessage(m: IncomingMessage): Promise<string> {
  const phone = normalizePhone(m.phone);

  if (m.isFromMe) {
    // Balasan keluar (dari HP atau nanti dari Inbox dashboard) - tidak memicu
    // matching voucher apapun, tapi tetap dicatat ke thread kalau leadnya ada.
    if (!phone) return "ignored: outgoing message (tanpa nomor)";
    const lead = await prisma.lead.findFirst({ where: { phone } });
    if (!lead) return "ignored: outgoing message (lead tidak ditemukan)";
    await logMessage(lead.id, "out", m.text, m.waMessageId);
    return "outgoing message dicatat ke thread";
  }

  const prefixes = await getVoucherPrefixes();
  const voucher = findVoucherInText(m.text, prefixes);

  if (voucher) {
    const lead = await prisma.lead.findUnique({ where: { voucherCode: voucher } });
    if (lead) {
      await logMessage(lead.id, "in", m.text, m.waMessageId);
      if (lead.status !== "NEW_LEAD") {
        return `already processed: ${voucher}`;
      }
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: m.name,
          phone,
          status: "CONTACT",
          ctwaClid: lead.ctwaClid || m.ctwaClid || undefined,
          waDeviceId: m.waDeviceId || undefined,
        },
      });
      return `linked to Contact: ${voucher}`;
    }
    // voucher ditemukan di teks tapi tidak match baris manapun -> lanjut ke penangkapan di bawah
  }

  const captureNoVoucher = process.env.CAPTURE_NO_VOUCHER !== "false";
  if (!phone || !isValidPhone(phone)) return "no capture";

  const existing = await prisma.lead.findFirst({ where: { phone } });
  if (existing) {
    await logMessage(existing.id, "in", m.text, m.waMessageId);
    return `phone already captured: ${phone}`;
  }

  if (m.ctwaClid) {
    const lead = await prisma.lead.create({
      data: {
        name: m.name,
        phone,
        status: "CONTACT",
        source: "CTWA",
        ctwaClid: m.ctwaClid,
        waDeviceId: m.waDeviceId,
        utmSource: "Meta",
        utmMedium: "CTWA",
        eventTime: new Date(),
      },
    });
    await logMessage(lead.id, "in", m.text, m.waMessageId);
    return `CTWA lead captured: ${phone}`;
  }

  if (!captureNoVoucher) return "no capture";

  const lead = await prisma.lead.create({
    data: {
      name: m.name,
      phone,
      status: "CONTACT",
      source: "ORGANIC",
      waDeviceId: m.waDeviceId,
      utmSource: "WhatsApp",
      utmMedium: "Organic",
      eventTime: new Date(),
    },
  });
  await logMessage(lead.id, "in", m.text, m.waMessageId);
  return `orphan captured: ${phone}`;
}
