#!/usr/bin/env node

const { Client } = require("pg");

const client = new Client({
  host: "db.yvntokkncxbhapqjesti.supabase.co",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "Hennie@@12Hennie@@12",
});

async function runComprehensiveSchemaAudit() {
  try {
    await client.connect();
    // 1. Check mailboxes table structure
    const mailboxesColumns = await client.query(`
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

    console.table(mailboxesColumns.rows);

    // 2. Check for specific missing columns
    const criticalColumns = ["widget_hmac_secret", "widgetHMACSecret", "gmail_support_email_id", "gmailSupportEmailId"];

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

    // 3. Check all tables for naming convention mismatches
    const namingAudit = await client.query(`
      SELECT 
        table_name,
        column_name,
        CASE 
          WHEN column_name ~ '[A-Z]' THEN 'camelCase'
          WHEN column_name ~ '_' THEN 'snake_case'
          ELSE 'lowercase'
        END as naming_convention
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name IN ('mailboxes', 'conversations', 'campfire_messages', 'profiles', 'organization_members')
        AND (column_name ~ '[A-Z]' OR column_name LIKE '%gmail%' OR column_name LIKE '%widget%')
      ORDER BY table_name, column_name;
    `);

    console.table(namingAudit.rows);

    // 4. Check for foreign key issues
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('mailboxes', 'conversations', 'campfire_messages')
      ORDER BY tc.table_name;
    `);

    console.table(foreignKeys.rows);

    // 5. Check organization_id consistency
    const orgIdAudit = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND column_name IN ('organization_id', 'organizationId', 'clerk_organization_id')
      ORDER BY table_name, column_name;
    `);

    console.table(orgIdAudit.rows);

    // 6. Generate migration recommendations
    // Check if widget_hmac_secret is missing
    const widgetSecretCheck = await client.query(`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'mailboxes'
              AND column_name = 'widget_hmac_secret'
          ) THEN false
          ELSE true
        END as needs_widget_hmac_secret
    `);

    if (widgetSecretCheck.rows[0].needs_widget_hmac_secret) {
      console.log(`ALTER TABLE mailboxes ADD COLUMN widget_hmac_secret text NOT NULL DEFAULT \'\';`);
    } else {
      console.log(`widget_hmac_secret already exists`);
    }

    // Check gmail support email column
    const gmailCheck = await client.query(`
      SELECT 
        column_name,
        CASE 
          WHEN column_name = 'gmail_support_email_id' THEN 'snake_case_exists'
          WHEN column_name = 'gmailSupportEmailId' THEN 'camelCase_exists'
          ELSE 'unknown'
        END as status
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'mailboxes'
        AND (column_name = 'gmail_support_email_id' OR column_name = 'gmailSupportEmailId')
    `);

    if (gmailCheck.rows.length === 0) {
      console.log(`ALTER TABLE mailboxes ADD COLUMN gmail_support_email_id text;`);
    } else {
      console.log(`Gmail support column exists as: ${gmailCheck.rows[0].column_name}`);
    }
  } catch (error) {
    console.error("❌ Database audit failed:", error.message);
    console.error("Full error:", error);
  } finally {
    await client.end();
  }
}

// Run the audit
runComprehensiveSchemaAudit().catch(console.error);
