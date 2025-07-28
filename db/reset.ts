/* eslint-disable no-console */
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/db/client";
import { env } from "@/lib/utils/env-config";
import { seedDatabase } from "./seeds/seedDatabase";

const clearDatabase = async () => {
  // Clear public schema
  const publicTables = await db
    .select({ tableName: sql<string>`table_name` })
    .from(sql`information_schema.tables`)
    .where(sql`table_schema = 'public'`);

  for (const { tableName } of publicTables) {
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(tableName)} CASCADE`);
  }
  const publicEnums = await db
    .select({ enumName: sql<string>`t.typname` })
    .from(sql`pg_type t`)
    .innerJoin(sql`pg_namespace n`, sql`n.oid = t.typnamespace`)
    .where(sql`t.typtype = 'e' AND n.nspname = 'public'`);

  for (const { enumName } of publicEnums) {
    await db.execute(sql`DROP TYPE IF EXISTS ${sql.identifier(enumName)} CASCADE`);
  }
  // Clear drizzle schema
  const drizzleTables = await db
    .select({ tableName: sql<string>`table_name` })
    .from(sql`information_schema.tables`)
    .where(sql`table_schema = 'drizzle'`);

  for (const { tableName } of drizzleTables) {
    await db.execute(sql`DROP TABLE IF EXISTS drizzle.${sql.identifier(tableName)} CASCADE`);
  }

  // Drop the drizzle schema itself
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
};

const migrateDatabase = async () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationPath = path.join(__dirname, "drizzle");
  await migrate(db, {
    migrationsFolder: migrationPath,
  });
};

const main = async () => {
  await clearDatabase();
  await migrateDatabase();
  await seedDatabase();
};

if (env.NODE_ENV !== "development" && env.VERCEL_ENV !== "preview") {
  process.exit(1);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database reset failed:", error);
    process.exit(1);
  });
