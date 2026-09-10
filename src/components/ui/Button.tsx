import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Skala shape dashboard ini: kontrol interaktif (button/input/select) = rounded-lg,
// kontainer (card) = rounded-2xl, pill (badge/status/segmented control) = rounded-full.
// Dikunci di sini biar konsisten di semua komponen (bukan diputuskan ulang per file).
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap " +
    "transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700",
        secondary: "bg-slate-900 text-white hover:bg-slate-800",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-300",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-4 py-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
