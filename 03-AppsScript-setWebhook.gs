/**
 * SINYAL — Bonus 03 · Apps Script: Daftarkan Webhook WhatsApp
 * ------------------------------------------------------------------
 * Utilitas SEKALI-PAKAI. Jalankan manual dari editor (Run) — tidak perlu deploy.
 * Contoh untuk WatZap; sesuaikan endpoint & field bila memakai gateway lain
 * atau Meta Cloud API langsung.
 *
 * CARA PAKAI:
 * 1. Isi API_KEY, WABA_ID, ENDPOINT_URL (URL /exec dari Bonus 01).
 * 2. Pilih fungsi setWebhook di dropdown -> Run -> izinkan authorization.
 * 3. Cek Execution log: harus respons sukses (bukan error 1001/fatal).
 * 4. Verifikasi dengan getWebhook().
 */

const API_KEY      = "GANTI_API_KEY_ANDA";
const WABA_ID      = "GANTI_WABA_ID_ANDA";
const ENDPOINT_URL = "https://script.google.com/macros/s/XXXX/exec"; // URL /exec Anda

function setWebhook() {
  const res = UrlFetchApp.fetch("https://api.watzap.id/v1/set_webhook", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ api_key: API_KEY, waba_id: WABA_ID, endpoint_url: ENDPOINT_URL })
  });
  Logger.log(res.getResponseCode() + ": " + res.getContentText());
}

function getWebhook() {
  const res = UrlFetchApp.fetch("https://api.watzap.id/v1/get_webhook", {
    method: "post", contentType: "application/json", muteHttpExceptions: true,
    payload: JSON.stringify({ api_key: API_KEY, waba_id: WABA_ID })
  });
  Logger.log(res.getResponseCode() + ": " + res.getContentText());
}
