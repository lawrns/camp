#!/usr/bin/env node

/**
 * Test Data Cleanup Script
 * Cleans up test data for test isolation between E2E runs
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_ORGANIZATION_ID = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

async function cleanupTestData() {
  console.log('🧹 Cleaning up E2E test data...');
  console.log('================================');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase client initialized');

  try {
    // Clean up in reverse dependency order to avoid foreign key constraints

    // 1. Clean up typing indicators
    console.log('\n⌨️  Cleaning typing indicators...');
    const { error: typingError } = await supabase
      .from('typing_indicators')
      .delete()
      .eq('organization_id', TEST_ORGANIZATION_ID);

    if (typingError) {
      console.log(`   ⚠️  Typing indicators cleanup warning: ${typingError.message}`);
    } else {
      console.log('   ✅ Typing indicators cleaned');
    }

    // 2. Clean up user presence
    console.log('\n👤 Cleaning user presence...');
    const { error: presenceError } = await supabase
      .from('user_presence')
      .delete()
      .eq('organization_id', TEST_ORGANIZATION_ID);

    if (presenceError) {
      console.log(`   ⚠️  User presence cleanup warning: ${presenceError.message}`);
    } else {
      console.log('   ✅ User presence cleaned');
    }

    // 3. Clean up messages
    console.log('\n📝 Cleaning messages...');
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('organization_id', TEST_ORGANIZATION_ID);

    if (messagesError) {
      console.log(`   ⚠️  Messages cleanup warning: ${messagesError.message}`);
    } else {
      console.log('   ✅ Messages cleaned');
    }

    // 4. Clean up conversations
    console.log('\n💬 Cleaning conversations...');
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .eq('organization_id', TEST_ORGANIZATION_ID);

    if (conversationsError) {
      console.log(`   ⚠️  Conversations cleanup warning: ${conversationsError.message}`);
    } else {
      console.log('   ✅ Conversations cleaned');
    }

    // 5. Reset user presence to offline (don't delete profiles/users as they're needed for auth)
    console.log('\n🔄 Resetting user states...');
    
    // Get test users
    const testEmails = ['jam@jam.com', 'admin@test.com', 'customer@test.com'];
    
    for (const email of testEmails) {
      try {
        // Get user ID from auth
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const authUser = authUsers.users?.find(u => u.email === email);
        
        if (authUser) {
          // Reset presence to offline
          const { error: resetPresenceError } = await supabase
            .from('user_presence')
            .upsert({
              user_id: authUser.id,
              organization_id: TEST_ORGANIZATION_ID,
              status: 'offline',
              last_seen_at: new Date().toISOString(),
              metadata: {
                user_name: authUser.user_metadata?.name || email,
                user_email: email,
                reset_by: 'cleanup_script'
              }
            });

          if (resetPresenceError) {
            console.log(`   ⚠️  Presence reset warning for ${email}: ${resetPresenceError.message}`);
          } else {
            console.log(`   ✅ Presence reset for ${email}`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  User reset failed for ${email}: ${error.message}`);
      }
    }

    // 6. Clean up any test files
    console.log('\n📁 Cleaning test files...');
    try {
      const fs = require('fs');
      const path = require('path');
      
      const testFiles = [
        'e2e/auth-state.json',
        'e2e/test-results',
        'e2e/test-metadata.json'
      ];

      for (const file of testFiles) {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          if (fs.lstatSync(fullPath).isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`   ✅ Removed directory: ${file}`);
          } else {
            fs.unlinkSync(fullPath);
            console.log(`   ✅ Removed file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️  File cleanup warning: ${error.message}`);
    }

    console.log('\n✅ Test data cleanup complete!');
    console.log('📋 Cleanup Summary:');
    console.log('   - Typing indicators: Cleared');
    console.log('   - User presence: Reset to offline');
    console.log('   - Messages: Cleared');
    console.log('   - Conversations: Cleared');
    console.log('   - Test files: Cleared');
    console.log('   - Users/Profiles: Preserved for reuse');
    console.log('   - Organization: Preserved for reuse');

  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    throw error;
  }
}

// Selective cleanup function for specific data types
async function cleanupSpecific(dataTypes = []) {
  console.log(`🎯 Selective cleanup: ${dataTypes.join(', ')}`);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  for (const dataType of dataTypes) {
    try {
      switch (dataType) {
        case 'messages':
          await supabase.from('messages').delete().eq('organization_id', TEST_ORGANIZATION_ID);
          console.log('   ✅ Messages cleaned');
          break;
        case 'conversations':
          await supabase.from('conversations').delete().eq('organization_id', TEST_ORGANIZATION_ID);
          console.log('   ✅ Conversations cleaned');
          break;
        case 'presence':
          await supabase.from('user_presence').delete().eq('organization_id', TEST_ORGANIZATION_ID);
          console.log('   ✅ Presence cleaned');
          break;
        case 'typing':
          await supabase.from('typing_indicators').delete().eq('organization_id', TEST_ORGANIZATION_ID);
          console.log('   ✅ Typing indicators cleaned');
          break;
        default:
          console.log(`   ⚠️  Unknown data type: ${dataType}`);
      }
    } catch (error) {
      console.log(`   ❌ Failed to clean ${dataType}: ${error.message}`);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--selective') {
    const dataTypes = args.slice(1);
    cleanupSpecific(dataTypes).catch(console.error);
  } else {
    cleanupTestData().catch(console.error);
  }
}

module.exports = { cleanupTestData, cleanupSpecific };
