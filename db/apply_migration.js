import { supabaseService } from "@/lib/infrastructure/supabase";

// Migration script to apply database changes to Supabase
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Supabase credentials
const SUPABASE_URL = "https://yogeksiymimbazitvdyy.supabase.co";
const SUPABASE_SERVICE_KEY = "Hennie@@12Hennie@@12"; // Service Role key

// Initialize the Supabase client
const supabase = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyCombinedMigration() {
  try {
    // Read the migration file
    const migrationFilePath = path.join(__dirname, "combined_migration.sql");
    const migrationSQL = fs.readFileSync(migrationFilePath, "utf8");

    // Execute the migration SQL directly
    const { data, error } = await supabase.rpc("pg_query", { query: migrationSQL });

    if (error) {
      console.error("Error applying migration:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error:", err);
    return false;
  }
}

// Execute the migration
applyCombinedMigration().then((success) => {
  if (success) {
    process.exit(0);
  } else {
    console.error("Database migration failed.");
    process.exit(1);
  }
});
