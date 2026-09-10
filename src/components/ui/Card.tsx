import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-card", padded && "p-5", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-medium text-slate-700", className)}>{children}</p>;
}
