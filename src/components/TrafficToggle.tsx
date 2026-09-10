import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TrafficFilter } from "@/lib/traffic";

const OPTIONS: { value: TrafficFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "paid", label: "Iklan" },
  { value: "organic", label: "Organik" },
];

export function TrafficToggle({
  current,
  buildHref,
}: {
  current: TrafficFilter;
  buildHref: (value: TrafficFilter) => string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={buildHref(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition",
            current === opt.value
              ? "bg-white text-slate-900 shadow-card"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
