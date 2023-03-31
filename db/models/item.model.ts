import {
  Field,
  PrimaryKey,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

@TigrisCollection("items")
export class Item {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  itemId?: string;

  @Field()
  itemName!: string;

  @Field(TigrisDataTypes.INT32)
  itemPrice!: number;

  @Field(TigrisDataTypes.INT32)
  itemQuantity!: number;

  @Field()
  itemDescription?: string;
}
