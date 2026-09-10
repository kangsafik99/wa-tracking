import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildGoogleAuthUrl } from "@/lib/export/google-oauth";
import { resolveBaseUrl } from "@/lib/base-url";

// Dilindungi middleware default (bukan bagian dari PUBLIC_API_PREFIXES) - cuma
// bisa dipicu dari sesi dashboard yang sudah login, lewat tombol
// "Connect Google Ads" di menu Export.
export async function GET(req: NextRequest) {
  const destinationId = req.nextUrl.searchParams.get("destinationId");
  const baseUrl = resolveBaseUrl((name) => req.headers.get(name));

  if (!destinationId) {
    return NextResponse.redirect(`${baseUrl}/export?google_error=${encodeURIComponent("destinationId wajib")}`);
  }

  const destination = await prisma.exportDestination.findUnique({ where: { id: destinationId } });
  if (!destination || destination.platform !== "GOOGLE") {
    return NextResponse.redirect(
      `${baseUrl}/export?google_error=${encodeURIComponent("Destination Google tidak ditemukan")}`
    );
  }
  if (!destination.googleClientId) {
    return NextResponse.redirect(
      `${baseUrl}/export?google_error=${encodeURIComponent("Isi & simpan Client ID dulu sebelum connect")}`
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/google/callback`;
  const url = buildGoogleAuthUrl({ clientId: destination.googleClientId, redirectUri, state: destinationId });

  return NextResponse.redirect(url);
}
