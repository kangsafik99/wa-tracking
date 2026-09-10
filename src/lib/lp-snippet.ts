// Generator snippet capture landing page (LPWA) - setara file bonus
// "05-Snippet-LP.html" yang disebut di Ebook SINYAL (Bagian 3), ditulis
// ulang jadi vanilla JS supaya bisa ditempel di landing page manapun
// (WordPress/WPCode, Google Tag Manager, HTML statis, dll) tanpa dependency.
//
// Tugasnya (lihat Ebook 3.1-3.3):
// 1. Tangkap click ID dari URL (gclid/fbclid/ttclid) + UTM + cookie Meta (_fbc/_fbp)
// 2. Buat/simpan satu voucher per pengunjung di localStorage (bukan per pageview)
// 3. Kirim "pending lead" ke POST /api/leads (idempoten - hanya sekali per voucher)
// 4. Sisipkan kode voucher ke pesan pembuka di semua tombol WhatsApp di halaman,
//    tanpa mengubah nomor tujuan tiap tombol (dukung multi-cabang)
export function buildLpSnippet(opts: { apiUrl: string; voucherPrefix: string }): string {
  const { apiUrl, voucherPrefix } = opts;

  return `<script>
(function () {
  var API_ENDPOINT = ${JSON.stringify(apiUrl)};
  var VOUCHER_PREFIX = ${JSON.stringify(voucherPrefix)};
  var VOUCHER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // buang I,O,0,1 (ambigu)
  var STORAGE_KEY = "wat_voucher_" + VOUCHER_PREFIX;
  var EXTID_KEY = "wat_external_id";

  function generateVoucher() {
    var r = "";
    for (var i = 0; i < 8; i++) r += VOUCHER_CHARS.charAt(Math.floor(Math.random() * VOUCHER_CHARS.length));
    return VOUCHER_PREFIX + r;
  }

  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\\+/g, " ")) : null;
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) {}
  }

  function getOrCreateVoucher() {
    var v = safeGet(STORAGE_KEY);
    if (!v) { v = generateVoucher(); safeSet(STORAGE_KEY, v); }
    return v;
  }

  function getOrCreateExternalId() {
    var id = safeGet(EXTID_KEY);
    if (!id) { id = "ext_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10); safeSet(EXTID_KEY, id); }
    return id;
  }

  function sendPendingLead(voucher) {
    var sentKey = "wat_sent_" + voucher;
    if (safeGet(sentKey) === "1") return;
    var payload = {
      voucher_code: voucher,
      gclid: getParam("gclid") || undefined,
      fbclid: getParam("fbclid") || undefined,
      ttclid: getParam("ttclid") || undefined,
      utm_source: getParam("utm_source") || undefined,
      utm_medium: getParam("utm_medium") || undefined,
      utm_campaign: getParam("utm_campaign") || undefined,
      external_id: getOrCreateExternalId(),
      fbc: getCookie("_fbc") || undefined,
      fbp: getCookie("_fbp") || undefined
    };
    try {
      fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).then(function () { safeSet(sentKey, "1"); }).catch(function () {});
    } catch (e) {}
  }

  function buildMessage(voucher, existingText) {
    var cleaned = (existingText || "").replace(/^\\*VOUCHER DISKON [A-Za-z0-9-]+\\*\\s*-\\s*/, "");
    var voucherLine = "*VOUCHER DISKON " + voucher + "*";
    if (cleaned) return voucherLine + " - " + cleaned;
    return "Halo Kak, saya mau klaim " + voucherLine + ". Boleh tanya-tanya dulu ya?";
  }

  function rewriteWhatsAppButtons(voucher) {
    var links = document.querySelectorAll(
      'a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com/send"]'
    );
    links.forEach(function (link) {
      if (link.getAttribute("data-wat-done") === voucher) return;
      try {
        var url = new URL(link.href, window.location.href);
        var existing = url.searchParams.get("text") || "";
        url.searchParams.set("text", buildMessage(voucher, existing));
        link.href = url.toString();
        link.setAttribute("data-wat-done", voucher);
      } catch (e) {}
    });
  }

  function init() {
    var voucher = getOrCreateVoucher();
    sendPendingLead(voucher);
    rewriteWhatsAppButtons(voucher);
    // Amati tombol WA yang baru dimuat belakangan (lazy load, builder halaman, dsb)
    try {
      var observer = new MutationObserver(function () { rewriteWhatsAppButtons(voucher); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
</script>`;
}
