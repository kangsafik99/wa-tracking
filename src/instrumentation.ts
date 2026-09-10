// Next.js instrumentation hook - dipanggil sekali saat server start. Dipakai
// untuk menjadwalkan pengiriman export Meta/TikTok berkala (Ebook 5.1: "pasang
// trigger waktu tiap 15-30 menit") tanpa perlu cron job terpisah di EasyPanel -
// container ini adalah proses Node yang hidup terus (bukan serverless), jadi
// setInterval aman dipakai selama proses tidak restart.
//
// Next.js juga mem-build fungsi register() ini untuk edge runtime. Kode di
// dalamnya pakai modul Node "crypto" (lewat rantai import ke lib/export), yang
// tidak ada di edge - makanya harus dibungkus persis pola
// `if (process.env.NEXT_RUNTIME === "nodejs")` di bawah ini (bukan early
// return) supaya Next bisa mengecualikannya dari bundle edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runExportForPlatform } = await import("@/lib/export/run");
    const intervalMinutes = Math.max(1, Number(process.env.EXPORT_INTERVAL_MINUTES) || 15);
    const intervalMs = intervalMinutes * 60 * 1000;

    const tick = async () => {
      for (const platform of ["META", "TIKTOK"] as const) {
        try {
          const result = await runExportForPlatform(platform);
          if (result.sent > 0 || result.errors > 0) {
            console.log(
              `[export] ${platform}: terkirim ${result.sent}, dilewati ${result.skipped}, gagal ${result.errors}`
            );
          }
        } catch (err) {
          console.error(`[export] scheduled run ${platform} gagal:`, err);
        }
      }
    };

    // Jeda 30 detik dulu supaya tidak membebani proses startup container.
    setTimeout(() => {
      tick();
      setInterval(tick, intervalMs);
    }, 30_000);
  }
}
