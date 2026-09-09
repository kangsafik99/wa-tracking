/**
 * SINYAL — Bonus 04 · Apps Script: Meta Conversions API (server-side)
 * ------------------------------------------------------------------
 * Kirim event (Contact/Purchase) dari CRM ke Meta CAPI, ter-dedup via event_id.
 * Otomatis pilih action_source: CTWA (business_messaging) vs website (fbc/fbp).
 *
 * PRASYARAT:
 * 1. Dataset ID (Events Manager).
 * 2. Access Token -> simpan di Project Settings -> Script Properties (key: META_TOKEN).
 * 3. Custom Conversion di Events Manager (agar muncul di Ads Manager).
 *
 * CARA PAKAI: pasang trigger waktu untuk exportToMetaCAPI (tiap 15-30 mnt),
 * atau panggil dari processIncoming_ (Bonus 01) untuk real-time.
 */

const META_DATASET_ID = "GANTI_DATASET_ID";
const META_EVENT_MAP  = { "Contact":"Contact", "Qualified Lead":"Lead", "Booking":"InitiateCheckout", "Purchase":"Purchase" };

function exportToMetaCAPI() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // dari Bonus 01
    const crm = ss.getSheetByName(CRM_SHEET_NAME);
    const last = crm.getLastRow();
    if (last < DATA_START_ROW) return;
    const n = last - DATA_START_ROW + 1;
    const data = crm.getRange(DATA_START_ROW, 2, n, 18).getValues(); // B..S
    const sent = sentSet_(ss);
    const token = PropertiesService.getScriptProperties().getProperty("META_TOKEN");

    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      const status = String(r[7]);            // I
      const evName = META_EVENT_MAP[status];
      if (!evName) continue;
      const fbclid = r[10], ctwa = r[11], fbc = r[16], fbp = r[17];
      if (!(fbclid || ctwa || fbc || fbp)) continue; // bukan lead Meta
      const voucher = String(r[2]);
      const eventId = evName + "_" + voucher;
      if (sent[eventId]) continue;

      const resp = sendMeta_(buildPayload_(evName, {
        eventTime: r[15], ctwa_clid: ctwa, external_id: r[12], phone: r[4], fbc: fbc, fbp: fbp, value: r[6]
      }, eventId), token);
      logSync_(ss, eventId, resp);
      sent[eventId] = true;
      Utilities.sleep(300);
    }
  } finally { lock.releaseLock(); }
}

function buildPayload_(evName, d, eventId) {
  const ud = {};
  if (d.ctwa_clid) ud.ctwa_clid = String(d.ctwa_clid);
  if (d.fbc) ud.fbc = String(d.fbc);
  if (d.fbp) ud.fbp = String(d.fbp);
  if (d.external_id) ud.external_id = [sha256_(d.external_id)];
  if (d.phone) ud.ph = [sha256_(normalizePhone_(d.phone))]; // normalizePhone_ dari Bonus 01
  const isCtwa = !!d.ctwa_clid;
  const ev = {
    event_name: evName, event_time: toUnix_(d.eventTime), event_id: eventId,
    action_source: isCtwa ? "business_messaging" : "website",
    user_data: ud,
    custom_data: { currency: "IDR", value: Number(d.value) > 0 ? Number(d.value) : 0 }
  };
  if (isCtwa) ev.messaging_channel = "whatsapp";
  return { data: [ev] };
}

function sendMeta_(payload, token) {
  const url = "https://graph.facebook.com/v21.0/" + META_DATASET_ID + "/events?access_token=" + token;
  const res = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json",
    payload: JSON.stringify(payload), muteHttpExceptions: true });
  return res.getResponseCode() + ": " + res.getContentText().slice(0, 300);
}

function sha256_(s) {
  if (!s) return "";
  s = String(s).trim().toLowerCase();
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ("0" + (b & 0xFF).toString(16)).slice(-2); }).join("");
}
function toUnix_(str) {
  if (!str) return Math.floor(Date.now() / 1000);
  const t = new Date(String(str).trim().replace(" ", "T") + "+07:00").getTime();
  return isNaN(t) ? Math.floor(Date.now() / 1000) : Math.floor(t / 1000);
}
function sentSet_(ss) {
  const sh = ss.getSheetByName("Meta Sync Log") || ss.insertSheet("Meta Sync Log");
  const set = {}, last = sh.getLastRow();
  if (last >= 1) sh.getRange(1, 2, last, 1).getValues().forEach(function (x) { if (x[0]) set[x[0]] = true; });
  return set;
}
function logSync_(ss, id, resp) {
  const sh = ss.getSheetByName("Meta Sync Log") || ss.insertSheet("Meta Sync Log");
  sh.appendRow([new Date(), id, resp]);
}
