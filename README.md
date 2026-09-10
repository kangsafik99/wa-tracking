# WA TRACKING — Dashboard Offline Conversion Tracking

Pengganti "Google Sheet + Apps Script + WatZap" dari ebook **SINYAL** (Yoppy Pras), dibangun sebagai
satu aplikasi web (Next.js + PostgreSQL) yang di-deploy di EasyPanel dan menerima webhook dari
[Gowa](https://github.com/aldinokemal/go-whatsapp-web-multidevice) sebagai gateway WhatsApp.

Alur closed-loop yang tetap sama seperti di ebook:

```
Klik iklan → Landing Page (voucher code) → POST /api/leads (Pending Lead)
   → Chat WhatsApp berisi voucher → Gowa kirim webhook → POST /api/webhook/gowa
   → Match voucher → status Contact → CS update status manual di dashboard
   → Qualified Lead → Booking → Purchase
```

## Fitur Dashboard

- **Overview** — KPI (Contact/Qualified/Purchase Rate, Total Revenue), grafik distribusi status
  (funnel), breakdown sumber lead, dan **toggle Iklan/Organik** untuk memfilter semuanya.
- **Leads** — tabel lead dikelompokkan per tanggal (WIB: "Hari ini"/"Kemarin"/tanggal lengkap),
  filter by status + pencarian (voucher/nama/no HP/email) + toggle Iklan/Organik, update status
  manual (dengan aturan "status hanya naik"), dan halaman detail/edit per lead.
- **Webhook Log** — viewer payload mentah dari Gowa untuk verifikasi/debug, dengan toggle
  Iklan/Organik (best-effort dari teks hasil proses) dan **auto-cleanup** setelah masa retensi.
- **Settings** — info URL webhook Gowa & endpoint landing page, **generator snippet capture siap
  copy-paste** untuk landing page Anda, konfigurasi prefix voucher, dan health check.
- **Export** — kirim event Contact/Qualified/Booking/Purchase ke **Meta CAPI**, **TikTok Events API**
  (otomatis berkala + tombol kirim manual), dan **Google Ads** (CSV siap upload). Destination
  (Dataset ID/Access Token/dst) dikelola langsung dari dashboard, bukan env var — siap multi-akun
  tanpa redeploy. Lihat [Export Layer](#export-layer-meta-capi--tiktok-events-api--google-ads).
- **`/test-lp`** — halaman publik (tanpa login) untuk simulasi landing page + uji coba alur end-to-end
  tanpa perlu website asli. Lihat [Uji Coba End-to-End](#uji-coba-end-to-end).

**Klasifikasi trafik "Iklan" vs "Organik"** (`src/lib/traffic.ts`): Iklan = lead punya minimal satu
click ID (`gclid`/`ttclid`/`fbclid`/`ctwaClid`); Organik = tidak ada sama sekali (voucher tanpa
atribusi, klik Google Maps, direct, atau orphan capture dari chat) — sesuai prinsip Ebook SINYAL 1.7:
jangan hitung trafik organik sebagai konversi iklan berbayar.

## Stack

- **Next.js 15** (App Router, TypeScript) — dashboard + API dalam satu aplikasi
- **PostgreSQL** via **Prisma ORM**
- **Login sederhana** (1 akun admin, session cookie JWT — lihat `src/lib/auth.ts`)
- Deploy sebagai **Docker container** (`Dockerfile` disediakan) — cocok untuk EasyPanel

## Struktur Data (`prisma/schema.prisma`)

Model `Lead` menggantikan tab "Unified Lite CRM Database" di Google Sheet: kolom voucher, nama, no HP,
email, total biaya, status (`NEW_LEAD → CONTACT → FOLLOW_UP → QUALIFIED_LEAD → BOOKING → PURCHASE`,
plus `CLOSED_LOST`), semua click ID (`gclid`, `ttclid`, `fbclid`, `ctwaClid`), `externalId`,
`utmSource`/`utmMedium`, `fbc`/`fbp`. Model `WebhookLog` menggantikan tab "Webhook Log" (auto-dibersihkan
berkala, lihat `src/lib/webhook-log-cleanup.ts`).

**Aturan Emas yang tetap dipertahankan** (lihat `src/lib/leads.ts`):
status hanya boleh naik (`isUpgrade`), kecuali override manual eksplisit.

## Setup Lokal

```bash
npm install
cp .env.example .env   # isi DATABASE_URL ke Postgres lokal/dev Anda
npx prisma migrate dev --name init
npm run db:seed        # baca ADMIN_EMAIL & ADMIN_PASSWORD dari .env
npm run dev
```

Buka `http://localhost:3000`, login dengan `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Environment Variables

Lihat `.env.example` untuk daftar lengkap + penjelasan. Yang **wajib** diisi:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Postgres EasyPanel Anda yang sudah jalan |
| `SESSION_SECRET` | String acak ≥32 karakter, untuk sign session login |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Dipakai sekali oleh `npm run db:seed` untuk membuat akun admin |
| `GOWA_WEBHOOK_SECRET` | Samakan dengan `WHATSAPP_WEBHOOK_SECRET` di Gowa (verifikasi signature) |

Opsional (sudah punya default yang masuk akal):

| Variable | Default | Keterangan |
|---|---|---|
| `VOUCHER_PREFIXES` | `BT,RB,GM` | Prefix kode voucher yang dikenali; juga jadi pilihan di generator snippet Settings |
| `CAPTURE_NO_VOUCHER` | `true` | Tangkap No HP walau voucher hilang/tak ketemu (orphan capture) |
| `ALLOWED_ORIGIN` | `*` | Origin yang diizinkan panggil `POST /api/leads` dari browser (CORS) |
| `APP_URL` | (auto dari request host) | URL publik aplikasi, dipakai di halaman Settings |
| `WEBHOOK_LOG_RETENTION_DAYS` | `30` | Berapa hari Webhook Log disimpan sebelum otomatis dihapus |
| `EXPORT_INTERVAL_MINUTES` | `15` | Interval pengiriman otomatis ke Meta/TikTok (kredensial diatur di menu Export, bukan di sini) |

## Deploy ke EasyPanel

1. **Push project ini ke Git repo** (GitHub/GitLab) — EasyPanel build dari repo.
2. Di EasyPanel: **Create Service → App**, sumber dari repo tersebut. EasyPanel akan mendeteksi
   `Dockerfile` di root dan build otomatis (build type: Dockerfile).
3. **Environment Variables** — isi semua variabel dari `.env.example` di tab Environment service ini.
   `DATABASE_URL` diarahkan ke service Postgres yang sudah Anda deploy di EasyPanel (biasanya
   `postgresql://user:pass@<nama-service-postgres>:5432/<db>` — pakai *internal hostname* Postgres,
   bukan domain publik, supaya koneksi lewat jaringan internal EasyPanel).
4. **Port**: container listen di `3000` — set di EasyPanel service settings, lalu attach domain/proxy
   sesuai kebutuhan (mis. `crm.domainanda.com`).
5. Deploy. `Dockerfile` otomatis menjalankan `prisma db push` saat container start, jadi tabel
   dibuat/disinkronkan otomatis ke skema `prisma/schema.prisma` di Postgres yang dikonek (repo ini
   belum pakai file migrasi versian — cukup untuk proyek solo; lihat komentar di `Dockerfile`).
6. **Buat akun admin** — jalankan sekali via EasyPanel "Console/Shell" pada service ini:
   ```bash
   npm run db:seed
   ```
   (pastikan `ADMIN_EMAIL`/`ADMIN_PASSWORD` sudah diisi di Environment Variables sebelum menjalankan ini).

## Menghubungkan Gowa (pengganti WatZap)

1. Login ke dashboard → menu **Settings** → salin URL "Arahkan WHATSAPP_WEBHOOK ke" (bentuknya
   `https://domain-dashboard-anda/api/webhook/gowa`).
2. Di service **Gowa** di EasyPanel, set environment variable:
   - `WHATSAPP_WEBHOOK` = URL di atas
   - `WHATSAPP_WEBHOOK_SECRET` = string rahasia, **samakan** dengan `GOWA_WEBHOOK_SECRET` di service dashboard ini
3. Restart service Gowa. Kirim pesan test dari WhatsApp lain ke nomor yang terhubung Gowa — cek
   dashboard → **Webhook Log**, payload mentah harus muncul di sana (untuk verifikasi format sebelum
   full live, sama seperti fungsi `logRaw_` di Apps Script lama).
4. Dukungan **CTWA** (Click-to-WhatsApp Meta) otomatis aktif: kalau pesan pertama membawa
   `referral.ctwa_clid` dari Gowa, sistem langsung membuat lead status "Contact" dengan `ctwaClid`
   tersimpan — tanpa perlu voucher (lihat `src/lib/process-incoming.ts`).
5. **Webhook Log otomatis dibersihkan** setelah `WEBHOOK_LOG_RETENTION_DAYS` hari (default 30) —
   tabel ini cuma untuk debug jangka pendek, bukan sumber laporan (lihat
   `src/lib/webhook-log-cleanup.ts`). Tidak perlu cron job terpisah; pembersihan menempel oportunistik
   di setiap request webhook masuk.

## Menghubungkan Landing Page

Cara termudah: login ke dashboard → menu **Settings** → card **"Snippet Capture Landing Page"** →
copy kode `<script>` yang sudah otomatis terisi URL endpoint & prefix voucher Anda, lalu tempel di
landing page (WordPress lewat plugin **WPCode** di lokasi *Site Wide Footer*, atau langsung sebelum
`</body>` di HTML statis). Snippet ini (`src/lib/lp-snippet.ts`) menggantikan file bonus
`05-Snippet-LP.html` dari ebook — otomatis menangkap click ID (`gclid`/`fbclid`/`ttclid`) + UTM +
cookie Meta (`_fbc`/`_fbp`), membuat satu voucher per pengunjung di localStorage, mengirimnya ke
`POST /api/leads`, dan menyisipkan kode voucher ke semua tombol WhatsApp di halaman tanpa mengubah
nomor tujuan tiap tombol (aman untuk multi-cabang).

Kalau landing page Anda pakai integrasi custom sendiri (bukan snippet di atas), cukup POST ke endpoint
yang sama dengan body:

```
POST https://domain-dashboard-anda/api/leads
Content-Type: application/json

{
  "voucher_code": "BT-9K2M7XQP",
  "gclid": "...", "ttclid": "...", "fbclid": "...",
  "external_id": "...", "utm_source": "...", "utm_medium": "...",
  "fbc": "...", "fbp": "..."
}
```

Endpoint ini publik (tanpa auth) — sama seperti Apps Script Web App `Access: Anyone` sebelumnya, karena
dipanggil dari JavaScript browser pengunjung. Atur `ALLOWED_ORIGIN` ke domain landing page Anda untuk
membatasi CORS (atau `"*"` bila multi-domain).

## Uji Coba End-to-End

Cara tercepat verifikasi seluruh alur (LP → voucher → chat WA → webhook → status Contact) tanpa perlu
landing page asli:

1. Buka `https://domain-dashboard-anda/test-lp` (tidak perlu login).
2. Klik salah satu skenario sumber klik (Direct/Google Ads/Meta Ads/TikTok Ads) — voucher otomatis
   dibuat dan dikirim ke `/api/leads` (status POST-nya ditampilkan di halaman).
3. Isi nomor WhatsApp yang sudah tersambung ke Gowa, lalu klik **"Chat via WhatsApp"** dan kirim
   pesannya (bisa pakai HP/WA lain).
4. Cek dashboard → **Leads**: voucher yang sama harus sudah naik ke status **Contact** dengan No HP
   terisi. Cek juga **Webhook Log** untuk payload mentahnya.

Atau verifikasi cepat lewat curl:

```bash
# Health check + koneksi DB
curl https://domain-dashboard-anda/api/health

# Simulasi pending lead dari LP
curl -X POST https://domain-dashboard-anda/api/leads \
  -H "Content-Type: application/json" \
  -d '{"voucher_code":"BT-TEST0001","utm_source":"google","utm_medium":"cpc"}'
```

Lalu cek di dashboard → Leads, harus muncul baris baru status "New Lead".

## Export Layer: Meta CAPI / TikTok Events API / Google Ads

Menu **Export** di dashboard mengirim status Contact/Qualified Lead/Booking/Purchase sebagai event
konversi server-side ke platform iklan (Ebook Bagian 5) — inilah yang menutup loop "SINYAL": algoritma
iklan belajar dari pelanggan sungguhan, bukan cuma klik.

**Konsep "Destination"**: karena click ID bersifat *account-scoped* (Ebook 1.2 — gclid/fbclid/ttclid
dari satu Ad Account tidak dikenali akun lain), tiap Ad Account/brand butuh kredensial ekspor sendiri.
Destination dikelola dari dashboard (bukan env var) supaya bisa tambah/edit akun kapan saja tanpa
redeploy. Dua cara sebuah lead di-route ke destination yang tepat:

- **Prefix voucher** (mis. `BT-` → Akun A, `RB-` → Akun B) — jalur normal LPWA/TikTok/Google, karena
  semuanya selalu lewat landing page dan selalu punya voucher.
- **Nomor WhatsApp penerima chat** (`waNumbers`) — khusus untuk lead **CTWA**, yang klik langsung ke
  WhatsApp tanpa lewat landing page sama sekali, jadi **tidak pernah punya voucher/prefix**. Satu-satunya
  sinyal untuk membedakan brand/akun di sini adalah nomor WA mana yang menerima chat-nya (iklan CTWA
  brand A pasti diarahkan ke nomor WA brand A). Nomor ini otomatis tertangkap dari `device_id` payload
  webhook Gowa (`src/lib/gowa.ts`, kolom `Lead.waDeviceId`).

Satu destination bisa ditandai **default** sebagai fallback terakhir kalau tidak ada prefix voucher
maupun nomor WA yang cocok.

| Platform | Cara kerja | Kredensial yang dibutuhkan |
|---|---|---|
| **Meta CAPI** | Push otomatis (server-side POST), `src/lib/export/meta.ts` | Dataset ID + Access Token dari Events Manager |
| **TikTok Events API** | Push otomatis, `src/lib/export/tiktok.ts` | Pixel Code + Access Token dari TikTok Ads Manager |
| **Google Ads** | **CSV export manual/terjadwal**, bukan push API — lihat catatan di bawah | Tidak perlu kredensial API |

Langkah pakai:

1. Login ke dashboard → menu **Export** → **Tambah Destination** → pilih platform, isi kredensial,
   isi prefix voucher (atau tandai sebagai default).
2. Meta & TikTok terkirim **otomatis tiap `EXPORT_INTERVAL_MINUTES` menit** di background
   (`src/instrumentation.ts` — proses interval di dalam container, tidak perlu cron job EasyPanel).
   Tombol **"Kirim Sekarang"** di halaman Export untuk memicu manual/testing.
3. Setiap event dikirim sekali per (destination, lead, nama event) — dedup lewat tabel `ExportLog`,
   jadi aman dijalankan berkali-kali tanpa dobel kirim.
4. No HP & `external_id` di-hash SHA-256 sebelum dikirim (`src/lib/hash.ts`), sesuai Aturan Emas privasi
   Ebook 1.6. Click ID (`ctwa_clid`, `fbc`, `fbp`, `ttclid`) dikirim apa adanya.

**Kenapa Google beda (CSV, bukan API)**: mengirim konversi otomatis ke Google Ads butuh Google Ads API,
yang mensyaratkan OAuth (Client ID/Secret) + **Developer Token** yang harus diajukan & disetujui Google
— prosesnya bisa berhari-hari dan cukup teknis. Untuk v1, destination Google cukup men-generate file
CSV (kolom Google Click ID/Conversion Name/Time/Value/Currency, format persis seperti yang diminta
Google Ads Uploads — Ebook 5.2) yang Anda unggah manual/terjadwal sendiri di Google Ads UI
(**Tools & Settings → Conversions → Uploads**). Kalau nanti berhasil dapat Developer Token, integrasi
API penuh bisa dibangun menyusul di atas struktur Destination yang sama.

## Yang BELUM termasuk di v1 ini

- **Sinkronisasi Order/POS otomatis** (Bonus 02) — untuk sekarang, update status ke Booking/Purchase +
  nilai transaksi dilakukan manual lewat halaman **Leads → Detail** di dashboard.
- **Google Ads API penuh** (lihat catatan di atas) — CSV export manual sudah tersedia sebagai gantinya.

Kabari saja kalau mau dibangun.
