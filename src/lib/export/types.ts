import type { ExportDestination } from "@prisma/client";

// Versi ExportDestination TANPA secret - ini yang boleh dikirim dari Server
// Component ke Client Component. Token asli tidak pernah diteruskan ke
// browser sama sekali; form edit selalu mulai dari kosong dan hanya menimpa
// nilai di database kalau diisi ulang (lihat actions.ts). googleConnected
// dipakai UI buat tahu status "Connect Google Ads" tanpa expose token itu
// sendiri.
export type SafeExportDestination = Omit<
  ExportDestination,
  "metaAccessToken" | "tiktokAccessToken" | "googleClientSecret" | "googleDeveloperToken" | "googleRefreshToken"
> & {
  googleConnected: boolean;
};

export function toSafeDestination(d: ExportDestination): SafeExportDestination {
  const {
    metaAccessToken: _metaAccessToken,
    tiktokAccessToken: _tiktokAccessToken,
    googleClientSecret: _googleClientSecret,
    googleDeveloperToken: _googleDeveloperToken,
    googleRefreshToken,
    ...safe
  } = d;
  return { ...safe, googleConnected: Boolean(googleRefreshToken) };
}
