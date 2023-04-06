import {
  Field,
  PrimaryKey,
  SearchField,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

@TigrisCollection("customers")
export class Customer {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  customerId?: string;

  @SearchField()
  @Field()
  customerName!: string;

  @SearchField()
  @Field()
  customerPhone?: string;
}
