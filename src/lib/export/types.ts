import type { ExportDestination } from "@prisma/client";

// Versi ExportDestination TANPA secret (access token) - ini yang boleh
// dikirim dari Server Component ke Client Component. Token asli tidak pernah
// diteruskan ke browser sama sekali; form edit selalu mulai dari kosong dan
// hanya menimpa nilai di database kalau diisi ulang (lihat actions.ts).
export type SafeExportDestination = Omit<ExportDestination, "metaAccessToken" | "tiktokAccessToken">;

export function toSafeDestination(d: ExportDestination): SafeExportDestination {
  const { metaAccessToken: _metaAccessToken, tiktokAccessToken: _tiktokAccessToken, ...safe } = d;
  return safe;
}
