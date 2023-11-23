import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: 'sqlite.db',
  },
  out: "./db/migrations",
} satisfies Config;
