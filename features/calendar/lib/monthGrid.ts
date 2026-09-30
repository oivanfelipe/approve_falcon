export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function monthLabel(date: Date): string {
  return date
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    .replace(/^./, (c) => c.toUpperCase());
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Key for a delivery's `scheduledAt`. It's stored as UTC midnight for the
 * calendar date the freelancer picked in a plain <input type="date">, so it
 * must be read back with UTC getters — local getters would roll it back a
 * day in any timezone behind UTC (e.g. Brazil), since UTC midnight is still
 * the previous day locally.
 */
export function scheduledDayKey(scheduledAt: Date): string {
  return `${scheduledAt.getUTCFullYear()}-${scheduledAt.getUTCMonth()}-${scheduledAt.getUTCDate()}`;
}

/** Formats a delivery's `scheduledAt` as a calendar date, ignoring the viewer's timezone. */
export function formatScheduledDate(
  scheduledAt: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return scheduledAt.toLocaleDateString(locale, { ...options, timeZone: "UTC" });
}

/** Returns the ISO "yyyy-mm-dd" string for a date, for <input type="date"> */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}
