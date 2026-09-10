import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// clsx buat filter falsy/gabung conditional classes, twMerge buat nyelesein
// konflik utility Tailwind yang tabrakan (mis. Button variant="secondary"
// yang di-override className bg-* dari caller) - sebelumnya override kayak
// gini kadang gak jalan tergantung urutan class di output, sekarang deterministik.
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
