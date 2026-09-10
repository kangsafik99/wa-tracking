import { prisma } from "@/lib/prisma";
import { findVoucherInText, normalizePhone, isValidPhone } from "@/lib/leads";
import { getVoucherPrefixes } from "@/lib/settings";
import type { IncomingMessage } from "@/lib/gowa";

// Port dari processIncoming_ + createOrphanLead_ (Bonus 01 Apps Script), ditambah
// penangkapan CTWA (referral.ctwa_clid) yang tersedia di webhook Gowa.
export async function processIncomingMessage(m: IncomingMessage): Promise<string> {
  if (m.isFromMe) return "ignored: outgoing message";

  const phone = normalizePhone(m.phone);
  const prefixes = await getVoucherPrefixes();
  const voucher = findVoucherInText(m.text, prefixes);

  if (voucher) {
    const lead = await prisma.lead.findUnique({ where: { voucherCode: voucher } });
    if (lead) {
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
        },
      });
      return `linked to Contact: ${voucher}`;
    }
    // voucher ditemukan di teks tapi tidak match baris manapun -> lanjut ke penangkapan di bawah
  }

  const captureNoVoucher = process.env.CAPTURE_NO_VOUCHER !== "false";
  if (!phone || !isValidPhone(phone)) return "no capture";

  const existing = await prisma.lead.findFirst({ where: { phone } });
  if (existing) return `phone already captured: ${phone}`;

  if (m.ctwaClid) {
    await prisma.lead.create({
      data: {
        name: m.name,
        phone,
        status: "CONTACT",
        source: "CTWA",
        ctwaClid: m.ctwaClid,
        utmSource: "Meta",
        utmMedium: "CTWA",
        eventTime: new Date(),
      },
    });
    return `CTWA lead captured: ${phone}`;
  }

  if (!captureNoVoucher) return "no capture";

  await prisma.lead.create({
    data: {
      name: m.name,
      phone,
      status: "CONTACT",
      source: "ORGANIC",
      utmSource: "WhatsApp",
      utmMedium: "Organic",
      eventTime: new Date(),
    },
  });
  return `orphan captured: ${phone}`;
}
