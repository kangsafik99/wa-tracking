"use client";

import { useRouter } from "next/navigation";

export function WaFilterSelect({
  current,
  options,
  buildHref,
}: {
  current: string;
  options: { value: string; label: string; count: number }[];
  buildHref: (value: string) => string;
}) {
  const router = useRouter();

  return (
    <select
      value={current}
      onChange={(e) => router.push(buildHref(e.target.value))}
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
