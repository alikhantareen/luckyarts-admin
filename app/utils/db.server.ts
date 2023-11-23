import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "db/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

export const db = drizzle(new Database("sqlite.db"), { schema });

migrate(db, { migrationsFolder: "db/migrations" });

async function seedUser() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  if (count === 0) {
    console.log("Seeding a user into db...");
    const email = "admin@luckyarts.pk";
    const password = bcrypt.hashSync("admin123");
    await db.insert(schema.users).values({ email, password });
  }
}
seedUser();
