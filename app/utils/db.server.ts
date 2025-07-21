import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "db/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

export const db = drizzle(new Database("sqlite.db"), { schema });

async function seedUser() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
  if (count === 0) {
    console.log("Seeding a user into db...");
    const email = "admin@luckyarts.co";
    const password = bcrypt.hashSync("lucky_arts72");
    await db.insert(schema.users).values({ email, password });
  }
}
seedUser();
