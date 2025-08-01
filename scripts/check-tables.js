const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://yvntokkncxbhapqjesti.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NTE1NCwiZXhwIjoyMDYwMDYxMTU0fQ.JSWc3lQWc3qKQaju1gGu7MSLhZn41DDd24n5Ojm0KLQ';

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  try {
    console.log('🔍 Checking available tables...');
    
    // Try to access common tables
    const tables = [
      'organizations',
      'profiles', 
      'organization_members',
      'conversations',
      'messages',
      'campfire_handoffs',
      'ai_handover_logs',
      'knowledge_documents',
      'knowledge_chunks',
      'widget_settings',
      'user_preferences'
    ];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error);
  }
}

// Run the script
checkTables().then(() => {
  console.log('🏁 Table check completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 