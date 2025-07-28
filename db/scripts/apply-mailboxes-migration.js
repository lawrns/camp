#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  host: "db.yvntokkncxbhapqjesti.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Hennie@@12Hennie@@12",
  ssl: {
    rejectUnauthorized: false,
  },
});

async function applyMailboxesMigration() {
  try {
    await client.connect();
    // Read the migration file
    const migrationPath = path.join(__dirname, "../migrations/fix-mailboxes-schema-mismatches.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute the migration
    const result = await client.query(migrationSQL);

    // Verify the changes
    const verification = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'mailboxes'
      ORDER BY ordinal_position;
    `);

    console.table(verification.rows);

    // Check critical columns
    const criticalColumns = ["widget_hmac_secret", "gmail_support_email_id"];

    for (const columnName of criticalColumns) {
      const columnCheck = await client.query(
        `
        SELECT 
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'mailboxes'
                AND column_name = $1
            ) THEN 'EXISTS'
            ELSE 'MISSING'
          END as status
      `,
        [columnName]
      );
    }

    // Count existing mailboxes and update them with HMAC secrets
    const mailboxCount = await client.query("SELECT COUNT(*) as count FROM mailboxes");
    if (mailboxCount.rows[0].count > 0) {
      const updateResult = await client.query(`
        UPDATE mailboxes 
        SET widget_hmac_secret = encode(gen_random_bytes(32), 'hex')
        WHERE widget_hmac_secret = '' OR widget_hmac_secret IS NULL
        RETURNING id, name, widget_hmac_secret;
      `);

      if (updateResult.rows.length > 0) {
        console.table(updateResult.rows);
      } else {
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
applyMailboxesMigration().catch(console.error);
