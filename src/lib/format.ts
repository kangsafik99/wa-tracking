export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!n || Number.isNaN(n)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
  return `${formatted} WIB`;
}
