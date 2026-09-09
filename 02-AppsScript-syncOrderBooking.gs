/**
 * SINYAL — Bonus 02 · Apps Script: Sync Order/POS -> CRM
 * ------------------------------------------------------------------
 * Cocokkan data order/kasir dengan CRM (via No HP atau Kode Voucher),
 * salin nilai transaksi, dan naikkan status ke Booking/Purchase.
 * Status hanya NAIK, tidak pernah turun.
 *
 * CARA PAKAI: tempel di project Apps Script yang sama (Bonus 01),
 * lalu pasang trigger waktu: Triggers -> Add -> syncOrderToCRM ->
 * Time-driven -> Every 5 minutes.
 *
 * LAYOUT ORDER (sesuaikan): B No | C Nama | ... | E No HP 1 | F No HP 2 |
 * G Email | ... | T Total Biaya. (Opsional kolom Kode Voucher — lihat catatan.)
 */

const ORDER_SHEET_NAME = "Order Booking"; // nama tab order/POS
const ORDER_START_ROW  = 5;

const RANK = { "New Lead":1, "Contact":2, "Follow Up":3, "Qualified Lead":4, "Booking":5, "Purchase":6 };

function syncOrderToCRM() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID); // dari Bonus 01
    const crm = ss.getSheetByName(CRM_SHEET_NAME);
    const ob  = ss.getSheetByName(ORDER_SHEET_NAME);
    if (!crm || !ob) return;

    const obLast = ob.getLastRow();
    if (obLast < ORDER_START_ROW) return;
    const ob_ = ob.getRange(ORDER_START_ROW, 2, obLast - ORDER_START_ROW + 1, 20).getValues();

    // Peta No HP -> {email, total}. Baris bawah menang (transaksi terbaru).
    const phoneMap = {};
    ob_.forEach(function (r) {
      const email = r[5], total = r[18];          // G Email, T Total
      [r[3], r[4]].forEach(function (raw) {         // E, F No HP
        const p = normalizePhone_(raw);             // helper dari Bonus 01
        if (p && p.length >= 9) phoneMap[p] = { email: email, total: total };
      });
    });

    const crmLast = crm.getLastRow();
    if (crmLast < DATA_START_ROW) return;
    const n = crmLast - DATA_START_ROW + 1;
    const c = crm.getRange(DATA_START_ROW, 2, n, 16).getValues();

    const seen = {};
    for (let i = n - 1; i >= 0; i--) {              // dari bawah: hanya lead terbaru per HP
      const phone = normalizePhone_(c[i][4]);        // F No HP
      if (!phone || !phoneMap[phone] || seen[phone]) continue;
      seen[phone] = true;

      const rowIdx = DATA_START_ROW + i;
      const m = phoneMap[phone];
      const cur = String(c[i][7]);                   // I Status
      if (cur === "Closed Lost") continue;

      if (!c[i][5] && m.email) crm.getRange(rowIdx, 7).setValue(m.email); // G Email jika kosong
      const hasTotal = m.total !== "" && m.total !== null && Number(m.total) > 0;
      if (hasTotal && Number(c[i][6]) !== Number(m.total)) crm.getRange(rowIdx, 8).setValue(m.total); // H Total

      const target = hasTotal ? "Purchase" : "Booking";
      if ((RANK[target] || 0) > (RANK[cur] || 0)) crm.getRange(rowIdx, 9).setValue(target); // I Status
    }
  } finally {
    lock.releaseLock();
  }
}

/*
 * CATATAN — Match by Kode Voucher (lebih kuat):
 * Jika kasir/CS mencatat Kode Voucher di kolom order, tambahkan pemetaan
 * voucher -> {total} lalu cocokkan ke CRM kolom D (Lead ID) via
 * findRowByVoucher_(). Ini menautkan transaksi ke click ID (bisa diekspor
 * sebagai konversi iklan) meski No HP berbeda. Lihat Bab 4.4 & 5.
 */
