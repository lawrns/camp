#!/usr/bin/env node

/**
 * Test script to verify React key duplication fix
 * Checks that virtualized components don't have duplicate keys
 */

const fs = require('fs');
const path = require('path');

function testReactKeyDuplicationFix() {
  console.log('🧪 REACT KEY DUPLICATION FIX VERIFICATION\n');

  const results = {
    messageListFixed: false,
    conversationListFixed: false,
    duplicatePreventionEnhanced: false,
    errors: []
  };

  // Test 1: Check MessageList virtualization fix
  console.log('📋 Test 1: MessageList Virtualization Key Fix');
  
  try {
    const messageListPath = 'components/InboxDashboard/sub-components/MessageList.tsx';
    const messageListContent = fs.readFileSync(messageListPath, 'utf8');
    
    // Check that Row renderer doesn't have explicit key prop
    const rowRendererMatch = messageListContent.match(/const Row = \({ index, style }\)[^}]+<MessageRow[^>]*>/s);
    
    if (rowRendererMatch) {
      const rowContent = rowRendererMatch[0];
      
      if (rowContent.includes('key={message.id}')) {
        console.log('   ❌ MessageList still has explicit key in Row renderer');
        results.errors.push('MessageList Row renderer still has explicit key prop');
      } else {
        console.log('   ✅ MessageList Row renderer correctly omits key prop');
        results.messageListFixed = true;
      }
    } else {
      console.log('   ⚠️  Could not find Row renderer in MessageList');
      results.errors.push('MessageList Row renderer not found');
    }

    // Check that non-virtualized rendering still has keys
    const nonVirtualizedMatch = messageListContent.match(/messages\.map\(\(message\)[^}]+<MessageRow[^>]*>/s);
    
    if (nonVirtualizedMatch) {
      const nonVirtualizedContent = nonVirtualizedMatch[0];
      
      if (nonVirtualizedContent.includes('key={message.id}')) {
        console.log('   ✅ Non-virtualized MessageList correctly keeps key prop');
      } else {
        console.log('   ❌ Non-virtualized MessageList missing key prop');
        results.errors.push('Non-virtualized MessageList missing key prop');
      }
    }

  } catch (error) {
    console.log('   ❌ Error reading MessageList:', error.message);
    results.errors.push(`MessageList read error: ${error.message}`);
  }

  // Test 2: Check ConversationList virtualization fix
  console.log('\n📋 Test 2: ConversationList Virtualization Key Fix');
  
  try {
    const conversationListPath = 'components/InboxDashboard/sub-components/ConversationList.tsx';
    const conversationListContent = fs.readFileSync(conversationListPath, 'utf8');
    
    // Check that Row renderer doesn't have explicit key prop
    const rowRendererMatch = conversationListContent.match(/const Row = \({ index, style }\)[^}]+<ConversationRow[^>]*>/s);
    
    if (rowRendererMatch) {
      const rowContent = rowRendererMatch[0];
      
      if (rowContent.includes('key={conversation.id}')) {
        console.log('   ❌ ConversationList still has explicit key in Row renderer');
        results.errors.push('ConversationList Row renderer still has explicit key prop');
      } else {
        console.log('   ✅ ConversationList Row renderer correctly omits key prop');
        results.conversationListFixed = true;
      }
    } else {
      console.log('   ⚠️  Could not find Row renderer in ConversationList');
      results.errors.push('ConversationList Row renderer not found');
    }

  } catch (error) {
    console.log('   ❌ Error reading ConversationList:', error.message);
    results.errors.push(`ConversationList read error: ${error.message}`);
  }

  // Test 3: Check enhanced duplicate prevention in useMessages
  console.log('\n📋 Test 3: Enhanced Duplicate Prevention in useMessages');
  
  try {
    const useMessagesPath = 'components/InboxDashboard/hooks/useMessages.ts';
    const useMessagesContent = fs.readFileSync(useMessagesPath, 'utf8');
    
    // Check for enhanced logging in postgres changes handler
    if (useMessagesContent.includes('Duplicate message prevented (Postgres)')) {
      console.log('   ✅ Postgres duplicate prevention enhanced with logging');
    } else {
      console.log('   ❌ Postgres duplicate prevention not enhanced');
      results.errors.push('Postgres duplicate prevention not enhanced');
    }
    
    // Check for enhanced logging in broadcast handler
    if (useMessagesContent.includes('Duplicate message prevented (Broadcast)')) {
      console.log('   ✅ Broadcast duplicate prevention enhanced with logging');
    } else {
      console.log('   ❌ Broadcast duplicate prevention not enhanced');
      results.errors.push('Broadcast duplicate prevention not enhanced');
    }
    
    // Check that both handlers have duplicate prevention
    const postgresHandler = useMessagesContent.match(/postgres_changes[^}]+setMessages\([^}]+\)/s);
    const broadcastHandler = useMessagesContent.match(/broadcast[^}]+setMessages\([^}]+\)/s);
    
    if (postgresHandler && postgresHandler[0].includes('exists = prev.some')) {
      console.log('   ✅ Postgres handler has duplicate prevention');
    } else {
      console.log('   ❌ Postgres handler missing duplicate prevention');
      results.errors.push('Postgres handler missing duplicate prevention');
    }
    
    if (broadcastHandler && broadcastHandler[0].includes('exists = prev.some')) {
      console.log('   ✅ Broadcast handler has duplicate prevention');
      results.duplicatePreventionEnhanced = true;
    } else {
      console.log('   ❌ Broadcast handler missing duplicate prevention');
      results.errors.push('Broadcast handler missing duplicate prevention');
    }

  } catch (error) {
    console.log('   ❌ Error reading useMessages:', error.message);
    results.errors.push(`useMessages read error: ${error.message}`);
  }

  // Test Summary
  console.log('\n🎯 FIX VERIFICATION SUMMARY');
  console.log('============================');
  
  const allFixed = results.messageListFixed && 
                   results.conversationListFixed && 
                   results.duplicatePreventionEnhanced && 
                   results.errors.length === 0;

  console.log(`${results.messageListFixed ? '✅' : '❌'} MessageList virtualization key fix`);
  console.log(`${results.conversationListFixed ? '✅' : '❌'} ConversationList virtualization key fix`);
  console.log(`${results.duplicatePreventionEnhanced ? '✅' : '❌'} Enhanced duplicate prevention`);
  console.log(`${results.errors.length === 0 ? '✅' : '❌'} No errors found`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS FOUND:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (allFixed) {
    console.log('\n🚀 REACT KEY DUPLICATION: FIXED ✅');
    console.log('The React key duplication error should be resolved.');
    console.log('\n📋 WHAT WAS FIXED:');
    console.log('1. Removed explicit key props from virtualized Row renderers');
    console.log('2. react-window now handles keys automatically for virtualized items');
    console.log('3. Enhanced duplicate message prevention with detailed logging');
    console.log('4. Both postgres_changes and broadcast handlers prevent duplicates');
  } else {
    console.log('\n⚠️  REACT KEY DUPLICATION: NEEDS ATTENTION');
    console.log('Some issues remain that need to be addressed.');
  }

  console.log('\n📋 TESTING INSTRUCTIONS:');
  console.log('1. Open http://localhost:3001/dashboard/inbox');
  console.log('2. Select a conversation with many messages');
  console.log('3. Check browser console for React key warnings');
  console.log('4. Send messages and verify no duplicate key errors');
  console.log('5. Look for duplicate prevention logs in console');

  return allFixed;
}

// Run the test
const success = testReactKeyDuplicationFix();
process.exit(success ? 0 : 1);
