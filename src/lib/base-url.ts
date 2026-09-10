// URL publik aplikasi ini - dipakai di Settings (tampilkan webhook URL) dan
// alur OAuth Google (redirect_uri harus persis sama di setiap request).
export function resolveBaseUrl(getHeader: (name: string) => string | null): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = getHeader("host");
  const proto = getHeader("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
