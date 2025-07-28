/* eslint-disable no-console */
import { env } from "@/lib/utils/env-config";
import { seedDatabase } from "./seedDatabase";

if (env.NODE_ENV !== "development" && env.VERCEL_ENV !== "preview") {
  process.exit(1);
}

seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed process failed:", error);
    process.exit(1);
  });
