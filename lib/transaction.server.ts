import { InvoiceStatus } from "db/models/invoice.model";
import { Transaction } from "db/models";
import tigrisDB from "./db.server";
import { invoicesCollection } from "./invoice.server";

export const transactionsCollection =
  tigrisDB.getCollection<Transaction>("transactions");

export async function createNewTransaction(transaction: Transaction) {
  const invoice = await invoicesCollection.findOne({
    filter: { id: transaction.invoiceId },
  });
  if (!invoice) {
    throw "Failed to create Transaction: Invoice ID is invalid or not specified";
  }

  if (transaction.transactionAmount <= 0) {
    throw "Failed to create Transaction: Amount cannot be zero or less";
  }

  // CASE: Payment
  if (transaction.transactionStatus === "Payment") {
    if (transaction.transactionAmount > invoice.amountDue!) {
      throw "Failed to create Transaction: Payment amount cannot be greater than amount due";
    }
    const amountDue = invoice.amountDue! - transaction.transactionAmount;
    const invoiceStatus: InvoiceStatus =
      amountDue === 0 ? "Fully Paid" : "Partial Paid";
    const tx = await tigrisDB.beginTransaction();
    const createdTransaction = await transactionsCollection.insertOne(
      transaction,
      tx
    );
    await invoicesCollection.updateOne({
      filter: { id: invoice.id },
      fields: { status: invoiceStatus, amountDue: amountDue },
    });
    await tx.commit();
    return createdTransaction;
  }
  // CASE: Refund
  else if (transaction.transactionStatus === "Refund") {
    const amountPaid = invoice.totalAmount - invoice.amountDue!;
    if (transaction.transactionAmount > amountPaid) {
      throw "Failed to create Transaction: Refund amount cannot be greater than amount paid";
    }
    const amountDue = invoice.amountDue! + transaction.transactionAmount;
    const invoiceStatus: InvoiceStatus =
      amountDue === invoice.totalAmount ? "Unpaid" : "Partial Paid";
    const tx = await tigrisDB.beginTransaction();
    const createdTransaction = await transactionsCollection.insertOne(
      transaction,
      tx
    );
    await invoicesCollection.updateOne({
      filter: { id: invoice.id },
      fields: { status: invoiceStatus, amountDue: amountDue },
    });
    await tx.commit();
    return createdTransaction;
  }
  // CASE: Unknown
  else {
    throw "Failed to create Transaction: Invalid transaction status";
  }
}
