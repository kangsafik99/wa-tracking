import crypto from "crypto";

// Aturan Emas Ebook SINYAL 1.6: PII (No HP, email, external_id) WAJIB di-hash
// SHA-256 sebelum dikirim ke platform iklan. Normalisasi dulu (trim+lowercase)
// sesuai spek Meta/TikTok supaya hash-nya konsisten dengan data di sisi platform.
export function sha256Hash(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
}
