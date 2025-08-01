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
    console.log('🚀 Applying campfire_handoffs policies via REST API...');
    
    // First, let's check if the table exists
    console.log('📋 Checking if campfire_handoffs table exists...');
    
    const { data: tableCheck, error: tableError } = await supabase
      .from('campfire_handoffs')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      console.log('💡 The table might not exist or you might not have access');
      return;
    }
    
    console.log('✅ Table exists, proceeding with policy application...');
    
    // Since we can't execute raw SQL via the REST API, let's try to create the policies
    // by making specific API calls that would trigger the policy creation
    
    console.log('🔄 Attempting to create policies via database operations...');
    
    // Try to insert a test record to see if policies are working
    const testRecord = {
      conversation_id: 'test-conversation-id',
      organization_id: 'test-org-id',
      handover_reason: 'test',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('campfire_handoffs')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('📝 Insert test failed (expected if policies are working):', insertError.message);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test record
      await supabase
        .from('campfire_handoffs')
        .delete()
        .eq('conversation_id', 'test-conversation-id');
    }
    
    console.log('🎯 Policy application attempt completed');
    console.log('💡 Note: Raw SQL execution requires direct database access');
    console.log('🔗 You may need to apply these policies via the Supabase dashboard');
    
    // Provide the SQL for manual execution
    console.log('\n📄 SQL to execute manually in Supabase dashboard:');
    console.log('==========================================');
    
    const sqlPath = path.join(__dirname, '../db/migrations/fix_campfire_handoffs_policies.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(sqlContent);
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Failed to apply policies:', error);
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