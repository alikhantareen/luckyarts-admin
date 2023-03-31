import {
  Field,
  PrimaryKey,
  TigrisCollection,
  TigrisDataTypes,
} from "@tigrisdata/core";

export type UserRole = "Admin" | "Staff";

@TigrisCollection("users")
export class User {
  @PrimaryKey(TigrisDataTypes.UUID, { order: 1, autoGenerate: true })
  userId?: string;

  @Field()
  userName?: string;

  @Field()
  passwordHash?: string;

  @Field()
  userRole?: UserRole;

  @Field()
  fullName?: string;

  @Field(TigrisDataTypes.DATE_TIME, { timestamp: "createdAt" })
  createdAt?: Date;

  @Field(TigrisDataTypes.DATE_TIME, { timestamp: "updatedAt" })
  updatedAt?: Date;
}
