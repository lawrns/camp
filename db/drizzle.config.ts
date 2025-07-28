import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load environment variables from .env.local
config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required for migrations");
}

const parsedUrl = new URL(databaseUrl);
// https://github.com/drizzle-team/drizzle-orm/discussions/881
// `sslmode=require` results in a `Error: self-signed certificate` error when
// attempting to run migrations during a production build.
if (process.env.NODE_ENV === "production") {
  parsedUrl.searchParams.set("sslmode", "no-verify");
}
const updatedUrl = parsedUrl.toString();

export default {
  schema: "db/schema",
  out: "db/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: updatedUrl,
  },
  casing: "snake_case",
} satisfies Config;
