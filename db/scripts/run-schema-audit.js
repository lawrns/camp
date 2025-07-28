#!/usr/bin/env node

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const client = new Client({
  host: "db.yvntokkncxbhapqjesti.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Hennie@#12Hennie@#12",
});

async function runSchemaAudit() {
  try {
    await client.connect();
    // Read the audit SQL file
    const auditSQL = fs.readFileSync(path.join(__dirname, "schema-audit.sql"), "utf8");

    // Split the SQL into individual queries and run them
    const queries = auditSQL.split(";").filter((q) => q.trim().length > 0);

    for (const query of queries) {
      if (query.trim().startsWith("--") || query.trim().length === 0) continue;

      try {
        const result = await client.query(query.trim());

        if (result.rows && result.rows.length > 0) {
          // Group results by audit_type if it exists
          const auditType = result.rows[0].audit_type || "query_result";
          console.log(`${auditType}:`);
          console.table(result.rows);
        }
      } catch (queryError) {
        console.error(`❌ Query failed: ${queryError.message}`);
        console.log(`Query: ${query.substring(0, 100)}...`);
      }
    }

    // Additional specific checks for the gmail_support_email_id issue
    // Check mailboxes table structure
    const mailboxesCheck = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('mailboxes', 'mailboxes_mailbox')
        AND column_name LIKE '%gmail%'
      ORDER BY table_name, column_name;
    `);

    console.table(mailboxesCheck.rows);

    // Check if the column exists with different naming
    const columnVariations = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        CASE 
          WHEN column_name = 'gmail_support_email_id' THEN 'snake_case (expected by DB)'
          WHEN column_name = 'gmailSupportEmailId' THEN 'camelCase (Drizzle schema)'
          ELSE 'other'
        END as naming_style
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name IN ('mailboxes', 'mailboxes_mailbox')
        AND (column_name = 'gmail_support_email_id' OR column_name = 'gmailSupportEmailId')
      ORDER BY table_name, column_name;
    `);

    console.table(columnVariations.rows);

    // Check gmail support emails table
    const gmailTablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%gmail%' OR table_name LIKE '%supportemail%')
      ORDER BY table_name;
    `);

    console.table(gmailTablesCheck.rows);
  } catch (error) {
    console.error("❌ Database audit failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await client.end();
  }
}

// Run the audit
runSchemaAudit().catch(console.error);
