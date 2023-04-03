import {
  Field,
  PrimaryKey,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";
import { Customer } from "./customer.model";
import { Item } from "./item.model";

export type InvoiceStatus =
  | "Unpaid"
  | "Partial Paid"
  | "Fully Paid"
  | "Archived";

// TODO: Potential solution -> https://github.com/pelotom/runtypes
export const InvoiceStatuses = [
  "Unpaid",
  "Partial Paid",
  "Fully Paid",
  "Archived",
];

export type WorkStatus =
  | "Pending"
  | "In Progress"
  | "Complete"

export const WorkStatuses = [
  "Pending",
  "In Progress",
  "Complete",
];

@TigrisCollection("invoices")
export class Invoice {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  id?: string;

  @Field()
  userId?: string;

  @Field()
  invoiceNumber?: string;

  @Field()
  customer!: Customer;

  @Field({ elements: Item })
  items!: Array<Item>;

  @Field({ default: "Pending" })
  workStatus?: WorkStatus;

  @Field({ default: "Unpaid" })
  status?: InvoiceStatus;

  @Field(TigrisDataTypes.INT32)
  totalAmount!: number;

  @Field(TigrisDataTypes.INT32)
  amountDue?: number;

  @Field(TigrisDataTypes.DATE_TIME, { timestamp: "createdAt" })
  createdAt?: Date;

  @Field(TigrisDataTypes.DATE_TIME, { timestamp: "updatedAt" })
  updatedAt?: Date;
}
