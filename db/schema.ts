import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  customerId: integer("customer_id")
    .references(() => customers.id)
    .notNull(),
  status: text("status", { enum: ["Unpaid", "PartialPaid", "FullyPaid", "Archived"] })
    .notNull()
    .default("Unpaid"),
  workStatus: text("work_status", { enum: ["Pending", "InProgress", "Completed"] })
    .notNull()
    .default("Pending"),
  totalAmount: integer("total_amount").notNull(),
  amountDue: integer("amount_due").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(STRFTIME('%s', 'now'))`),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
}));

export const items = sqliteTable("items", {
  id: integer("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  discount: integer("discount"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  kind: text("kind", { enum: ["Payment", "Refund"] })
    .notNull()
    .default("Payment"),
  amount: integer("amount").notNull(),
  method: text("method"),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(STRFTIME('%s', 'now'))`),
});

export type InvoiceStatus = typeof invoices.$inferSelect.status;
export type InvoiceWorkStatus = typeof invoices.$inferSelect.workStatus;
export type Invoice = typeof invoices.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
