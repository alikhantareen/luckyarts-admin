/**
 * Gets the display number for an invoice, falling back to id if display_number is not set
 * @param invoice - The invoice object
 * @returns The display number to show
 */
export function getDisplayNumber(invoice: { id: number; displayNumber?: number | null }): number {
  return invoice.displayNumber ?? invoice.id;
} 