import {
  Field,
  PrimaryKey,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

@TigrisCollection("counters")
export class Counter {
  @PrimaryKey({ order: 1 })
  id!: string;

  @Field(TigrisDataTypes.INT64)
  seq!: number;
}
