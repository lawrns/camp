const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NTE1NCwiZXhwIjoyMDYwMDYxMTU0fQ.JSWc3lQWc3qKQaju1gGu7MSLhZn41DDd24n5Ojm0KLQ';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyHandoffsPolicies() {
  try {
    console.log('🚀 Applying campfire_handoffs policies...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../db/migrations/fix_campfire_handoffs_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content loaded, executing...');
    
    // Execute the SQL using Supabase's rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Fallback: Try executing individual statements
      console.log('🔄 Trying alternative approach...');
      
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', {
              sql_query: statement + ';'
            });
            
            if (stmtError) {
              console.error(`❌ Error in statement: ${stmtError.message}`);
            } else {
              console.log('✅ Statement executed successfully');
            }
          } catch (err) {
            console.error(`❌ Failed to execute statement: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Policies applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply policies:', error);
    
    // Try direct SQL execution
    console.log('🔄 Trying direct SQL execution...');
    
    const sqlContent = `
      -- Drop existing policies if they exist (to avoid conflicts)
      DROP POLICY IF EXISTS "handoffs_organization_access" ON campfire_handoffs;
      DROP POLICY IF EXISTS "handoffs_service_role_access" ON campfire_handoffs;

      -- Recreate policies with proper permissions
      CREATE POLICY "handoffs_organization_access" ON campfire_handoffs
          FOR ALL
          USING (
              auth.role() = 'authenticated' AND organization_id IN (
                  SELECT organization_id FROM organization_members
                  WHERE user_id = auth.uid() AND status = 'active'
              )
          )
          WITH CHECK (
              auth.role() = 'authenticated' AND organization_id IN (
                  SELECT organization_id FROM organization_members
                  WHERE user_id = auth.uid() AND status = 'active'
              )
          );

      -- Policy for service role (for API operations)
      CREATE POLICY "handoffs_service_role_access" ON campfire_handoffs
          FOR ALL
          USING (auth.role() = 'service_role')
          WITH CHECK (auth.role() = 'service_role');

      -- Ensure RLS is enabled
      ALTER TABLE campfire_handoffs ENABLE ROW LEVEL SECURITY;
    `;
    
    try {
      const { error: directError } = await supabase.rpc('exec_sql', {
        sql_query: sqlContent
      });
      
      if (directError) {
        console.error('❌ Direct SQL execution failed:', directError);
      } else {
        console.log('✅ Direct SQL execution successful!');
      }
    } catch (directErr) {
      console.error('❌ Direct execution failed:', directErr);
    }
  }
}

// Run the script
applyHandoffsPolicies().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 