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

/** Formats a stored delivery date as { date: "dd/mm/yyyy", time: "h:mm AM" }. */
export function formatDeliveryDate(value: string | null | undefined): { date: string; time: string } | null {
  const match = value ? DELIVERY_DATE_PATTERN.exec(value) : null;
  if (!match) return null;
  const [, year, month, day, hh, minutes] = match;
  const hours = Number(hh);
  const period = hours >= 12 ? "PM" : "AM";
  return { date: `${day}/${month}/${year}`, time: `${hours % 12 || 12}:${minutes} ${period}` };
}
