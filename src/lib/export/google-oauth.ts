// Alur OAuth 2.0 untuk menghubungkan dashboard ke akun Google Ads admin,
// dipicu dari tombol "Connect Google Ads" di menu Export (bukan token manual
// tempel-tempel). Endpoint & scope di bawah adalah endpoint standar Google
// OAuth (accounts.google.com/oauth2.googleapis.com), bukan sesuatu yang
// berubah per API - lihat src/app/api/oauth/google/*/route.ts untuk alurnya.
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export function buildGoogleAuthUrl(opts: { clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_SCOPE,
    access_type: "offline", // wajib supaya dapat refresh_token
    prompt: "consent", // paksa consent screen tiap kali, supaya refresh_token selalu diterbitkan ulang
    state: opts.state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

type TokenResult = { ok: true; value: string } | { ok: false; error: string };

export async function exchangeCodeForRefreshToken(opts: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<TokenResult> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      code: opts.code,
      redirect_uri: opts.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.refresh_token) {
    return { ok: false, error: data.error_description || data.error || `HTTP ${res.status}` };
  }
  return { ok: true, value: data.refresh_token };
}

export async function getAccessToken(destination: {
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleRefreshToken: string | null;
}): Promise<TokenResult> {
  if (!destination.googleClientId || !destination.googleClientSecret || !destination.googleRefreshToken) {
    return { ok: false, error: "Google Ads belum terhubung (Client ID/Secret/refresh token belum lengkap)" };
  }
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: destination.googleClientId,
      client_secret: destination.googleClientSecret,
      refresh_token: destination.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    return { ok: false, error: data.error_description || data.error || `HTTP ${res.status}` };
  }
  return { ok: true, value: data.access_token };
}
