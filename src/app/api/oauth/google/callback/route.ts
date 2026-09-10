import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForRefreshToken } from "@/lib/export/google-oauth";
import { resolveBaseUrl } from "@/lib/base-url";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");
  const baseUrl = resolveBaseUrl((name) => req.headers.get(name));

  if (oauthError) {
    return NextResponse.redirect(`${baseUrl}/export?google_error=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/export?google_error=${encodeURIComponent("Callback tidak lengkap")}`);
  }

  const destination = await prisma.exportDestination.findUnique({ where: { id: state } });
  if (!destination || destination.platform !== "GOOGLE" || !destination.googleClientId || !destination.googleClientSecret) {
    return NextResponse.redirect(
      `${baseUrl}/export?google_error=${encodeURIComponent("Destination Google tidak ditemukan")}`
    );
  }

  const redirectUri = `${baseUrl}/api/oauth/google/callback`;
  const result = await exchangeCodeForRefreshToken({
    clientId: destination.googleClientId,
    clientSecret: destination.googleClientSecret,
    code,
    redirectUri,
  });

  if (!result.ok) {
    return NextResponse.redirect(`${baseUrl}/export?google_error=${encodeURIComponent(result.error)}`);
  }

  await prisma.exportDestination.update({
    where: { id: destination.id },
    data: { googleRefreshToken: result.value },
  });

  return NextResponse.redirect(`${baseUrl}/export?google_connected=${encodeURIComponent(destination.name)}`);
}
