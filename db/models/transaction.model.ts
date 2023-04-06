import {
  Field,
  PrimaryKey,
  SearchField,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

export type TransactionStatus = "Payment" | "Refund";

@TigrisCollection("transactions")
export class Transaction {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  transactionId?: string;

  @Field()
  invoiceId!: string;

  @Field()
  userId?: string;

  @Field(TigrisDataTypes.INT32)
  transactionAmount!: number;

  @SearchField({ sort: true })
  @Field()
  transactionDate!: Date;

  @Field()
  transactionStatus!: TransactionStatus;

  @Field()
  transactionMethod?: string;

  @Field()
  transactionNote?: string;
}
