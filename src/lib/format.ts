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
  return `${Math.round(value * 100)}%`;
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

// Kunci hari (YYYY-MM-DD) berbasis WIB, dipakai untuk mengelompokkan baris
// per tanggal terlepas dari timezone server (container biasanya UTC).
export function dateGroupKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatDateGroupLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const key = dateGroupKey(d);
  const today = dateGroupKey(new Date());
  const yesterday = dateGroupKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (key === today) return "Hari ini";
  if (key === yesterday) return "Kemarin";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTimeWIB(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)} WIB`;
}
