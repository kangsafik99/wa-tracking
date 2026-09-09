/**
 * SINYAL — Bonus 01 · Apps Script: WhatsApp → Sheets Integration
 * ------------------------------------------------------------------
 * Pintu masuk semua data: (A) Pending Lead dari landing page,
 * (B) Webhook chat WhatsApp masuk (match voucher / orphan capture).
 *
 * CARA PAKAI:
 * 1. Buka spreadsheet CRM Anda -> Extensions -> Apps Script.
 * 2. Tempel file ini. Isi bagian KONFIGURASI di bawah.
 * 3. Deploy -> New deployment -> Web app (Execute as: Me, Access: Anyone).
 * 4. Salin URL /exec ke snippet LP (Bonus 05) & pendaftaran webhook (Bonus 03).
 * 5. Update kode berikutnya SELALU via Manage deployments -> Edit -> New version.
 *
 * LAYOUT KOLOM CRM (sesuaikan bila berbeda; jangan sisip kolom di tengah):
 * B No | C Timestamp | D Lead ID | E Nama | F No HP | G Email | H Total Biaya |
 * I Lead Status | J GCLID | K TTCLID | L FBCLID | M CTWA_CLID | N External ID |
 * O UTM Source | P UTM Medium | Q Event Time | R _FBC | S _FBP | (T,U rumus tag)
 */

// ====================== KONFIGURASI ======================
const SPREADSHEET_ID   = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
const CRM_SHEET_NAME   = "Unified Lite CRM Database"; // nama tab CRM
const DATA_START_ROW   = 5;      // baris pertama data (header di atasnya)
const SCRIPT_VERSION   = "v1";   // naikkan tiap deploy untuk cek versi live
const CAPTURE_NO_VOUCHER = true; // tangkap No HP walau voucher hilang (orphan)
const VOUCHER_REGEX    = /(?:BT|RB|GM)-[A-Z0-9]{6,10}/i; // tambah prefix di sini
// =========================================================

function doGet(e) {
  if (e && e.parameter && e.parameter["hub.challenge"]) {
    return ContentService.createTextOutput(e.parameter["hub.challenge"]);
  }
  return ContentService.createTextOutput("OK - endpoint aktif - " + SCRIPT_VERSION + " - " + new Date());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  try {
    const raw = (e && e.postData) ? e.postData.contents : "";
    let p;
    try { p = JSON.parse(raw); }
    catch (err) { logRaw_(ss, "UNPARSEABLE: " + raw); return jsonOut_({ status: "error", error: "invalid JSON" }); }

    const crm = ss.getSheetByName(CRM_SHEET_NAME);
    if (!crm) return jsonOut_({ status: "error", error: "sheet not found: " + CRM_SHEET_NAME });

    if (p.action === "create_lead_on_click") return handleLeadCreate_(crm, p);

    logRaw_(ss, raw); // rekam payload webhook untuk verifikasi field
    return handleWebhook_(crm, p);
  } catch (err) {
    logRaw_(ss, "ERROR: " + err.message);
    return jsonOut_({ status: "error", error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// ---------- A: PENDING LEAD DARI LANDING PAGE ----------
function handleLeadCreate_(crm, p) {
  if (findRowByVoucher_(crm, p.voucher_code)) {
    return jsonOut_({ status: "success", message: "duplicate" });
  }
  const last = lastDataRow_(crm);
  const nextNo = nextNo_(crm, last);
  const eventTime = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

  const row = Array(18).fill(""); // tulis B..S (T/U rumus, jangan disentuh)
  row[0]  = nextNo;                    // B No
  row[1]  = eventTime;                 // C Timestamp
  row[2]  = p.voucher_code;            // D Lead ID
  row[7]  = "New Lead";                // I Lead Status
  row[8]  = p.gclid || "";             // J GCLID
  row[9]  = p.ttclid || "";            // K TTCLID
  row[10] = p.fbclid || "";            // L FBCLID
  row[11] = p.ctwa_clid || "";         // M CTWA_CLID
  row[12] = p.external_id || "";       // N External ID
  row[13] = p.utm_source || "Direct";  // O UTM Source
  row[14] = p.utm_medium || "None";    // P UTM Medium
  row[15] = eventTime;                 // Q Event Time
  row[16] = p.fbc || "";               // R _FBC
  row[17] = p.fbp || "";               // S _FBP

  const writeRow = last + 1;
  crm.getRange(writeRow, 2, 1, 18).setValues([row]);
  return jsonOut_({ status: "success", message: "Pending Lead row " + writeRow });
}

// ---------- B: WEBHOOK CHAT MASUK ----------
function handleWebhook_(crm, postData) {
  const msgs = extractMessages_(postData);
  if (!msgs.length) return jsonOut_({ status: "ignored", message: "no incoming message" });
  return jsonOut_({ status: "done", results: msgs.map(function (m) { return processIncoming_(crm, m); }) });
}

// Normalisasi payload -> {text, phone, name}. Sesuaikan field setelah cek log webhook.
function extractMessages_(postData) {
  const out = [];
  const d = postData.data || postData;
  if (d.from_me === true || postData.from_me === true || d.fromMe === true) return out; // abaikan pesan keluar
  const text  = d.message_text || d.message_body || (d.message_raw && d.message_raw.text && d.message_raw.text.body) || d.message || d.body || d.text || "";
  const phone = d.phone || d.phone_number || d.from || (d.chat_id ? String(d.chat_id).split("@")[0] : "") || "";
  let name = d.push_name || "";
  if (!name && d.root_value && d.root_value.contacts && d.root_value.contacts[0] && d.root_value.contacts[0].profile)
    name = d.root_value.contacts[0].profile.name || "";
  if (!name) name = d.pushname || d.name || d.sender_name || "Pelanggan WA";
  if (text || phone) out.push({ text: String(text), phone: phone, name: name });
  return out;
}

function processIncoming_(crm, m) {
  const phone = normalizePhone_(m.phone);
  const vm = String(m.text).match(VOUCHER_REGEX);
  if (vm) {
    const voucher = vm[0].toUpperCase();
    const row = findRowByVoucher_(crm, voucher);
    if (row) {
      const cur = crm.getRange(row, 9).getValue(); // I Lead Status
      if (cur !== "New Lead") return "already processed: " + voucher;
      crm.getRange(row, 5).setValue(m.name);   // E Nama
      crm.getRange(row, 6).setValue(phone);    // F No HP
      crm.getRange(row, 9).setValue("Contact");// I Status
      return "linked to Contact: " + voucher;
    }
  }
  // Tanpa voucher / tak ketemu -> tetap tangkap No HP (orphan) agar sync purchase jalan
  if (!CAPTURE_NO_VOUCHER || !phone || phone.length < 9) return "no capture";
  if (findRowByPhone_(crm, phone)) return "phone already captured: " + phone;
  createOrphanLead_(crm, m.name, phone);
  return "orphan captured: " + phone;
}

function createOrphanLead_(crm, name, phone) {
  const last = lastDataRow_(crm);
  const eventTime = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  const row = Array(18).fill("");
  row[0] = nextNo_(crm, last);           // B No
  row[1] = eventTime;                    // C Timestamp
  row[2] = "WA-" + eventTime.replace(/\D/g, "").slice(-8) + Math.floor(Math.random()*100); // D Lead ID
  row[3] = name;                         // E Nama
  row[4] = phone;                        // F No HP
  row[7] = "Contact";                    // I Status
  row[13] = "WhatsApp"; row[14] = "Organic"; row[15] = eventTime;
  crm.getRange(last + 1, 2, 1, 18).setValues([row]);
}

// ---------- HELPERS ----------
function lastDataRow_(sheet) {
  const B = sheet.getRange("B:B").getValues(), D = sheet.getRange("D:D").getValues();
  let last = DATA_START_ROW - 1;
  for (let i = B.length - 1; i >= DATA_START_ROW - 1; i--) {
    if ((B[i] && B[i][0] !== "") || (D[i] && D[i][0] !== "")) { last = i + 1; break; }
  }
  return last;
}
function nextNo_(sheet, last) {
  let n = 1;
  if (last >= DATA_START_ROW) { const v = sheet.getRange(last, 2).getValue(); if (!isNaN(v) && v !== "") n = Number(v) + 1; }
  return n;
}
function findRowByVoucher_(sheet, v) {
  if (!v) return null;
  const f = sheet.getRange("D:D").createTextFinder(String(v)).matchEntireCell(true).findNext();
  return (f && f.getRow() >= DATA_START_ROW) ? f.getRow() : null;
}
function findRowByPhone_(sheet, p) {
  if (!p) return null;
  const f = sheet.getRange("F:F").createTextFinder(String(p)).matchEntireCell(true).findNext();
  return (f && f.getRow() >= DATA_START_ROW) ? f.getRow() : null;
}
function normalizePhone_(p) {
  p = String(p).replace(/@.*$/, "").replace(/\D/g, "");
  if (p.indexOf("0") === 0) p = "62" + p.slice(1);
  return p;
}
function logRaw_(ss, obj) {
  const sh = ss.getSheetByName("Webhook Log") || ss.insertSheet("Webhook Log");
  sh.appendRow([new Date(), (typeof obj === "string" ? obj : JSON.stringify(obj)).slice(0, 45000)]);
}
function jsonOut_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
