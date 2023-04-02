import { LogicalOperator, Order } from "@tigrisdata/core";
import type { Invoice, InvoiceStatus } from "db/models/invoice.model";
import { getNextSequence } from "./counter.server";
import tigrisDB from "./db.server";

// Update relavant const on client page: app/routes/_app/invoices/_index/index.tsx
const PAGE_SIZE = 5;

export const invoicesCollection = tigrisDB.getCollection<Invoice>("invoices");

export async function createNewInvoice(invoice: Invoice) {
  const nextSeq = await getNextSequence("invoices");
  invoice.invoiceNumber = `#${nextSeq}`;
  return invoicesCollection.insertOne(invoice);
}

export async function updateWorkStatus(invoice:Invoice) {
  
}

export async function findInvoices(
  page: number,
  statusFilters: string[],
  searchQuery: string
) {
  let filter = undefined;
  if (statusFilters.length > 0 && statusFilters.length === 1) {
    filter = { status: statusFilters[0] as InvoiceStatus };
  } else if (statusFilters.length > 1) {
    filter = {
      op: LogicalOperator.OR,
      selectorFilters: statusFilters.map((s) => ({
        status: s as InvoiceStatus,
      })),
    };
  }

  // TODO: Fix following code when this is resolved -> https://github.com/tigrisdata/tigris-client-ts/issues/279
  const searchPaginatedData = await invoicesCollection.search(
    {
      q: searchQuery,
      searchFields: [
        "invoiceNumber",
        "customer.customerName",
        "customer.customerPhone",
      ],
      filter: filter,
      hitsPerPage: PAGE_SIZE,
      sort: { field: "createdAt", order: Order.DESC },
    },
    page
  );
  // console.log("Hits count", searchPaginatedData.hits.length);
  // console.log(searchPaginatedData.meta);
  const invoices = searchPaginatedData.hits.map((h) => h.document);
  const total = searchPaginatedData.meta?.found || 0;
  return { invoices, total };
}
