import { LogicalOperator, Order, SelectorFilterOperator } from "@tigrisdata/core";
import type { Invoice, InvoiceStatus, WorkStatus } from "db/models/invoice.model";
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

export async function findInvoices(
  page: number,
  statusFilters: string[],
  searchQuery: string,
  workStatus: string[]
) {
  let filter = buildFilter(statusFilters, workStatus);
  


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
  
  const invoices = searchPaginatedData.hits.map((h) => h.document);
  const total = searchPaginatedData.meta?.found || 0;
  return { invoices, total };
}

function buildFilter(
  statusFilters: string[],
  workStatus: string[]) {

    let statusFilter = undefined;
    if (statusFilters.length > 0 && statusFilters.length === 1) {
      statusFilter = { status: statusFilters[0] as InvoiceStatus };
    } else if (statusFilters.length > 1) {
      statusFilter = {
        op: LogicalOperator.OR,
        selectorFilters: statusFilters.map((s) => ({
          status: s as InvoiceStatus,
        })),
      };
    }

    let workFilter = undefined;
    if (workStatus.length > 0 && workStatus.length === 1) {
      workFilter = { workStatus: workStatus[0] as WorkStatus };
    } else if (workStatus.length > 1) {
      workFilter = {
        op: LogicalOperator.OR,
        selectorFilters: workStatus.map((s) => ({
          workStatus: s as WorkStatus,
        })),
      };
    }

    if (statusFilter && workFilter) {
      return {
        op: LogicalOperator.AND,
        selectorFilters: [
          statusFilter,
          workFilter,
        ],
      };
    } else if (statusFilter && !workFilter) {
      return statusFilter;
    
  } else if (!statusFilter && workFilter) {
return workFilter;
  } else {
    return undefined;
  }

    
  }