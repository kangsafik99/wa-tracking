import { cn } from "@/lib/cn";

export type BadgeTone = "slate" | "blue" | "amber" | "indigo" | "purple" | "brand" | "red";

const tones: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  indigo: "bg-indigo-50 text-indigo-700",
  purple: "bg-purple-50 text-purple-700",
  brand: "bg-brand-100 text-brand-800",
  red: "bg-red-50 text-red-700",
};

export function Badge({
  tone = "slate",
  children,
  className,
  icon,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
