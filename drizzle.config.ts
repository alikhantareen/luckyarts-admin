import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: 'sqlite.db',
  },
  out: "./db/migrations",
} satisfies Config;
