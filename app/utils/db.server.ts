import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "db/schema";
import { SQLiteColumn, SQLiteSelect } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

export const db = drizzle(new Database("sqlite.db"), { schema });

export function withID<T extends SQLiteSelect>(qb: T, column: SQLiteColumn, id: number) {
  return qb.where(eq(column, id));
}

// migrate(db, { migrationsFolder: "db/migrations" });
