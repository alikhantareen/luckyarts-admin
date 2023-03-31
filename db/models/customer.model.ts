import {
  Field,
  PrimaryKey,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

@TigrisCollection("customers")
export class Customer {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  customerId?: string;

  @Field()
  customerName!: string;

  @Field()
  customerPhone?: string;
}
