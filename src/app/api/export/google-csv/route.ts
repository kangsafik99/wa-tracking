import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXPORTABLE_STATUSES } from "@/lib/export/event-maps";
import { buildGoogleConversionCsv } from "@/lib/export/google-csv";

// Dilindungi middleware default (bukan bagian dari PUBLIC_API_PREFIXES), jadi
// cuma bisa diakses dari sesi dashboard yang sudah login.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const destinationId = searchParams.get("destinationId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!destinationId || !from || !to) {
    return NextResponse.json({ error: "destinationId, from, dan to wajib diisi" }, { status: 400 });
  }

  const destination = await prisma.exportDestination.findUnique({ where: { id: destinationId } });
  if (!destination || destination.platform !== "GOOGLE_CSV") {
    return NextResponse.json({ error: "Destination Google tidak ditemukan" }, { status: 404 });
  }

  const start = new Date(`${from}T00:00:00+07:00`);
  const end = new Date(`${to}T23:59:59+07:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      status: { in: EXPORTABLE_STATUSES },
      gclid: { not: null },
      OR: [
        { eventTime: { gte: start, lte: end } },
        { AND: [{ eventTime: null }, { createdAt: { gte: start, lte: end } }] },
      ],
    },
    select: { gclid: true, status: true, totalValue: true, eventTime: true, createdAt: true },
  });

  const csv = buildGoogleConversionCsv(leads, destination);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="google-conversions-${from}_${to}.csv"`,
    },
  });
}
