import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Endpoint publik dipanggil dari snippet landing page (setara handleLeadCreate_ Bonus 01).
// Sengaja tanpa auth — sama seperti Apps Script Web App "Access: Anyone" sebelumnya,
// karena dipanggil dari JS browser pengunjung (tak ada tempat aman menyimpan secret di sana).

const LeadCreateSchema = z.object({
  voucher_code: z.string().min(1),
  gclid: z.string().optional(),
  ttclid: z.string().optional(),
  fbclid: z.string().optional(),
  ctwa_clid: z.string().optional(),
  external_id: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  branch: z.string().optional(),
});

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || null;
}

function corsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ status: "error", error: "invalid JSON" }, { status: 400, headers });
  }

  const parsed = LeadCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "error", error: parsed.error.flatten() },
      { status: 400, headers }
    );
  }
  const p = parsed.data;
  const voucherCode = p.voucher_code.toUpperCase();

  const existing = await prisma.lead.findUnique({ where: { voucherCode } });
  if (existing) {
    return NextResponse.json({ status: "success", message: "duplicate" }, { headers });
  }

  try {
    await prisma.lead.create({
      data: {
        voucherCode,
        status: "NEW_LEAD",
        source: "LPWA",
        gclid: p.gclid || null,
        ttclid: p.ttclid || null,
        fbclid: p.fbclid || null,
        ctwaClid: p.ctwa_clid || null,
        externalId: p.external_id || null,
        utmSource: p.utm_source || "Direct",
        utmMedium: p.utm_medium || "None",
        utmCampaign: p.utm_campaign || null,
        fbc: p.fbc || null,
        fbp: p.fbp || null,
        branch: p.branch || null,
        ipAddress: getClientIp(req),
        eventTime: new Date(),
      },
    });
  } catch (err: unknown) {
    // Race condition: dua klik hampir bersamaan membuat voucher yang sama.
    const isUniqueViolation =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json({ status: "success", message: "duplicate" }, { headers });
    }
    throw err;
  }

  return NextResponse.json(
    { status: "success", message: `Pending Lead created: ${voucherCode}` },
    { headers }
  );
}
