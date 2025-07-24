import { db } from "./db.server";
import { invoices } from "db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Generates the next display number for invoices or quotations
 * @param shopId - The shop ID
 * @param type - The type ("Invoice" or "Quotation")
 * @returns The next display number (1 if no previous records exist)
 */
export async function getNextDisplayNumber(shopId: number, type: "Invoice" | "Quotation"): Promise<number> {
  // Find the highest display_number for this shop and type
  const result = await db
    .select({ maxDisplayNumber: invoices.displayNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.shopId, shopId),
        eq(invoices.type, type),
        sql`${invoices.displayNumber} IS NOT NULL`
      )
    )
    .orderBy(desc(invoices.displayNumber))
    .limit(1);

  // If no records exist or all display_number values are NULL, start with 1
  if (result.length === 0 || result[0].maxDisplayNumber === null) {
    return 1;
  }

  // Return the next number
  return result[0].maxDisplayNumber + 1;
}


