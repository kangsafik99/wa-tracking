"use client";

import { useMemo, useState } from "react";
import { CopySimple, CheckCircle } from "@phosphor-icons/react/ssr";
import { buildLpSnippet } from "@/lib/lp-snippet";
import { Card, CardTitle } from "@/components/ui/Card";

export function LpSnippetCard({ apiUrl, prefixes }: { apiUrl: string; prefixes: string[] }) {
  const [prefix, setPrefix] = useState(prefixes[0] || "BT");
  const [copied, setCopied] = useState(false);

  const snippet = useMemo(() => buildLpSnippet({ apiUrl, voucherPrefix: prefix }), [apiUrl, prefix]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API tidak tersedia (mis. non-HTTPS) - biarkan user select manual dari textarea
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <CardTitle>Snippet Capture Landing Page</CardTitle>
        {prefixes.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Prefix voucher</label>
            <select
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {prefixes.map((p) => (
                <option key={p} value={p}>
                  {p}-
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Tempel kode ini di landing page Anda (mis. WordPress lewat plugin{" "}
        <a
          href="https://wordpress.org/plugins/insert-headers-and-footers/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 hover:underline"
        >
          WPCode
        </a>{" "}
        di lokasi Site Wide Footer, atau langsung sebelum <code className="font-mono">{"</body>"}</code> di
        HTML statis). Sekali pasang, otomatis menangkap click ID + UTM, membuat kode voucher per
        pengunjung, dan menyisipkannya ke semua tombol WhatsApp di halaman.
      </p>

      <div className="relative">
        <textarea
          readOnly
          value={snippet}
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed p-3.5 overflow-x-auto resize-y focus:outline-none"
        />
        <button
          onClick={copy}
          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 transition"
        >
          {copied ? (
            <>
              <CheckCircle size={13} weight="fill" className="text-brand-400" />
              Tersalin
            </>
          ) : (
            <>
              <CopySimple size={13} />
              Copy
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Multi-domain/multi-brand? Pasang snippet dengan prefix berbeda di tiap domain (atur lewat{" "}
        <code className="font-mono">VOUCHER_PREFIXES</code>), supaya lead dari tiap sumber bisa dipisahkan
        (lihat Ebook SINYAL 1.2 & 3.5).
      </p>
    </Card>
  );
}
