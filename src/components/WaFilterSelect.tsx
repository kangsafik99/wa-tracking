"use client";

import { useRouter } from "next/navigation";

// Href per opsi dihitung di Server Component pemanggil (bukan fungsi yang
// dioper ke sini) - Client Component tidak boleh menerima fungsi sebagai prop
// dari Server Component, cuma data biasa yang bisa diserialisasi.
export function WaFilterSelect({
  current,
  allHref,
  options,
}: {
  current: string;
  allHref: string;
  options: { value: string; label: string; count: number; href: string }[];
}) {
  const router = useRouter();

  function handleChange(value: string) {
    const target = options.find((o) => o.value === value)?.href ?? allHref;
    router.push(target);
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
    >
      <option value="">Semua Nomor WA</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label} ({o.count})
        </option>
      ))}
    </select>
  );
}
