/**
 * Gets the display number for an invoice, falling back to id if display_number is not set
 * @param invoice - The invoice object
 * @returns The display number to show
 */
export function getDisplayNumber(invoice: { id: number; displayNumber?: number | null }): number {
  return invoice.displayNumber ?? invoice.id;
} 

// Delivery date is stored exactly as the datetime-local input sends it ("YYYY-MM-DDTHH:MM"),
// in the shop's local time, so no timezone conversion can shift it.
const DELIVERY_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Reads the optional delivery date from a form value. Returns null when empty or malformed. */
export function parseDeliveryDate(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 16);
  return DELIVERY_DATE_PATTERN.test(trimmed) ? trimmed : null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats a stored delivery date as { date: "Fri, 20 Nov 2026", time: "3:45 PM" }. */
export function formatDeliveryDate(value: string | null | undefined): { date: string; time: string } | null {
  const match = value ? DELIVERY_DATE_PATTERN.exec(value) : null;
  if (!match) return null;
  const [, year, month, day, hh, minutes] = match;
  // Weekday computed in UTC so the server's timezone can't shift the day.
  const weekday = WEEKDAYS[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()];
  const hours = Number(hh);
  const period = hours >= 12 ? "PM" : "AM";
  return {
    date: `${weekday}, ${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`,
    time: `${hours % 12 || 12}:${minutes} ${period}`,
  };
}
