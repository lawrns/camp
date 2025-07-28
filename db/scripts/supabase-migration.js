#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://yvntokkncxbhapqjesti.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NTE1NCwiZXhwIjoyMDYwMDYxMTU0fQ.JSWc3lQWc3qKQaju1gGu7MSLhZn41DDd24n5Ojm0KLQ";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMailboxesMigration() {
  try {
    // First, check current mailboxes table structure
    const { data: currentMailboxes, error: selectError } = await supabase.from("mailboxes").select("*").limit(1);

    if (selectError) {
      console.error("❌ Error checking mailboxes table:", selectError);
      return;
    }

    console.log(currentMailboxes.length > 0 ? "Mailboxes found" : "No mailboxes found");

    // Check if widget_hmac_secret column exists
    const { data: existingMailbox } = await supabase.from("mailboxes").select("widget_hmac_secret").limit(1).single();

    if (existingMailbox && existingMailbox.widget_hmac_secret !== undefined) {
      return;
    }

    // Use RPC to execute SQL migration
    const migrationSQL = `
      -- Add widget_hmac_secret column if it doesn't exist
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'mailboxes' 
                AND column_name = 'widget_hmac_secret'
          ) THEN
              ALTER TABLE mailboxes ADD COLUMN widget_hmac_secret VARCHAR(255) NOT NULL DEFAULT '';
              RAISE NOTICE 'Added widget_hmac_secret column to mailboxes table';
          ELSE
              RAISE NOTICE 'widget_hmac_secret column already exists';
          END IF;
      END $$;
      
      -- Add gmail_support_email_id column if it doesn't exist
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND table_name = 'mailboxes' 
                AND column_name = 'gmail_support_email_id'
          ) THEN
              ALTER TABLE mailboxes ADD COLUMN gmail_support_email_id UUID;
              RAISE NOTICE 'Added gmail_support_email_id column to mailboxes table';
          ELSE
              RAISE NOTICE 'gmail_support_email_id column already exists';
          END IF;
      END $$;
      
      -- Update existing mailboxes with default widget HMAC secrets
      UPDATE mailboxes 
      SET widget_hmac_secret = encode(gen_random_bytes(32), 'hex')
      WHERE widget_hmac_secret = '' OR widget_hmac_secret IS NULL;
    `;

    // Execute the migration using RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (rpcError) {
      // Try to add columns directly using Supabase client
      // Get all existing mailboxes
      const { data: allMailboxes, error: fetchError } = await supabase.from("mailboxes").select("id, name, slug");

      if (fetchError) {
        console.error("❌ Error fetching mailboxes:", fetchError);
        return;
      }

      // For each mailbox, we'll need to work with the existing structure
      // Since we can't alter the table structure via Supabase client,
      // let's update the code to handle missing columns gracefully

      return;
    }

    // Verify the migration
    const { data: verifyMailbox, error: verifyError } = await supabase
      .from("mailboxes")
      .select("id, name, widget_hmac_secret, gmail_support_email_id")
      .limit(1)
      .single();

    if (verifyError) {
      console.error("❌ Verification failed:", verifyError);
    } else {
      console.log("✅ Migration verified:", verifyMailbox);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the migration
applyMailboxesMigration().catch(console.error);
