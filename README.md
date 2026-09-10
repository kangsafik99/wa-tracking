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

## Stack

- **Next.js 15** (App Router, TypeScript) — dashboard + API dalam satu aplikasi
- **PostgreSQL** via **Prisma ORM**
- **Login sederhana** (1 akun admin, session cookie JWT — lihat `src/lib/auth.ts`)
- Deploy sebagai **Docker container** (`Dockerfile` disediakan) — cocok untuk EasyPanel

## Struktur Data (`prisma/schema.prisma`)

Model `Lead` menggantikan tab "Unified Lite CRM Database" di Google Sheet: kolom voucher, nama, no HP,
email, total biaya, status (`NEW_LEAD → CONTACT → FOLLOW_UP → QUALIFIED_LEAD → BOOKING → PURCHASE`,
plus `CLOSED_LOST`), semua click ID (`gclid`, `ttclid`, `fbclid`, `ctwaClid`), `externalId`,
`utmSource`/`utmMedium`, `fbc`/`fbp`. Model `WebhookLog` menggantikan tab "Webhook Log".

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

## Menghubungkan Landing Page

Snippet capture di landing page Anda (yang lama mengirim ke URL `/exec` Apps Script) sekarang cukup
diarahkan ke:

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

## Yang BELUM termasuk di v1 ini (lingkup disepakati: Core dulu)

Sesuai lingkup yang dipilih, hal-hal berikut dari ebook **belum** diimplementasikan dan bisa
ditambahkan menyusul:

- **Sinkronisasi Order/POS otomatis** (Bonus 02) — untuk sekarang, update status ke Booking/Purchase +
  nilai transaksi dilakukan manual lewat halaman **Leads → Detail** di dashboard.
- **Export ke Meta CAPI / Google OCI / TikTok Events API** (Bonus 04 & Bagian 5) — belum ada cron job
  pengiriman konversi server-side ke platform iklan.

Kabari saja kalau salah satu mau dibangun — strukturnya (model `Lead` dengan semua click ID sudah
tersimpan) sudah siap dipakai untuk fase itu tanpa perlu migrasi skema besar.

## Testing cepat setelah deploy

```bash
# Health check + koneksi DB
curl https://domain-dashboard-anda/api/health

# Simulasi pending lead dari LP
curl -X POST https://domain-dashboard-anda/api/leads \
  -H "Content-Type: application/json" \
  -d '{"voucher_code":"BT-TEST0001","utm_source":"google","utm_medium":"cpc"}'
```

Lalu cek di dashboard → Leads, harus muncul baris baru status "New Lead".
