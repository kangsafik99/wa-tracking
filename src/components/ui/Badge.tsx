import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", {
  variants: {
    tone: {
      slate: "bg-slate-100 text-slate-700",
      blue: "bg-blue-50 text-blue-700",
      amber: "bg-amber-50 text-amber-700",
      indigo: "bg-indigo-50 text-indigo-700",
      purple: "bg-purple-50 text-purple-700",
      brand: "bg-brand-100 text-brand-800",
      red: "bg-red-50 text-red-700",
    },
  },
  defaultVariants: { tone: "slate" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  tone,
  children,
  className,
  icon,
}: VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <span className={cn(badgeVariants({ tone }), className)}>
      {icon}
      {children}
    </span>
  );
}
