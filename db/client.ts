import { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Pool, PoolConfig } from "pg";
import * as schema from "@/db/schema";
import { env } from "@/env.mjs";

export const createDbClient = (url: string, options: PoolConfig = {}) => {
  if (!url) {
    throw new Error("Database URL is required");
  }
  // https://github.com/brianc/node-postgres/issues/2558
  const urlWithoutVerification = url.replace("?sslmode=require", "?sslmode=no-verify");
  const pool = new Pool({
    connectionString: urlWithoutVerification,
    // Optimize connection pool for development
    max: process.env.NODE_ENV === "development" ? 5 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ...options,
  });
  return drizzle({ client: pool, schema, casing: "snake_case", logger: false });
};

type DrizzleClientType = ReturnType<typeof createDbClient>;

declare global {
  // eslint-disable-next-line no-var
  var drizzleGlobal: DrizzleClientType | undefined;
}

// Lazy database connection - only connect when actually used
let _db: DrizzleClientType | null = null;

export const db = new Proxy({} as DrizzleClientType, {
  get(target, prop: keyof DrizzleClientType) {
    if (!_db) {
      if (global.drizzleGlobal) {
        _db = global.drizzleGlobal;
      } else {
        const dbUrl = env.POSTGRES_URL || env.DATABASE_URL;
        if (!dbUrl) {
          throw new Error("Missing database configuration: POSTGRES_URL or DATABASE_URL is required");
        }
        _db = createDbClient(dbUrl);
        if (env.NODE_ENV !== "production") {
          global.drizzleGlobal = _db;
        }
      }
    }
    return _db[prop];
  },
});

export type Transaction = PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export type TransactionOrDb = Transaction | typeof db;
