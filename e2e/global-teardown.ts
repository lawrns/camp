/**
 * E2E Global Teardown
 * 
 * Cleans up the testing environment:
 * - Removes test data
 * - Generates final reports
 * - Cleans up authentication state
 */

import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E Global Teardown...');

  // Load test metadata
  let testMetadata: any = {};
  try {
    testMetadata = JSON.parse(fs.readFileSync('e2e/test-metadata.json', 'utf-8'));
  } catch (error) {
    console.log('⚠️  Could not load test metadata');
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ========================================
  // 1. CLEANUP TEST DATA
  // ========================================
  console.log('🗑️  Cleaning up test data...');

  try {
    // Clean up test conversations
    if (testMetadata.testConversations) {
      const conversationIds = testMetadata.testConversations.map((c: any) => c.id);
      await supabase
        .from('conversations')
        .delete()
        .in('id', conversationIds);
      console.log(`✅ Cleaned up ${conversationIds.length} test conversations`);
    }

    // Clean up test messages
    await supabase
      .from('messages')
      .delete()
      .like('content', '%E2E_TEST%');
    console.log('✅ Cleaned up test messages');

    // Note: We don't delete test users as they might be needed for future runs
    // and Supabase auth users are harder to clean up safely

  } catch (error) {
    console.log('⚠️  Error during cleanup:', error);
  }

  // ========================================
  // 2. GENERATE FINAL REPORT
  // ========================================
  console.log('📊 Generating final E2E report...');

  const endTime = new Date().toISOString();
  const duration = testMetadata.startTime 
    ? new Date(endTime).getTime() - new Date(testMetadata.startTime).getTime()
    : 0;

  const finalReport = {
    ...testMetadata,
    endTime,
    duration,
    durationFormatted: `${Math.round(duration / 1000)}s`,
    cleanup: {
      completed: true,
      timestamp: endTime,
    },
  };

  fs.writeFileSync(
    'test-results/e2e-final-report.json',
    JSON.stringify(finalReport, null, 2)
  );

  // ========================================
  // 3. CLEANUP FILES
  // ========================================
  console.log('🧹 Cleaning up temporary files...');

  const filesToCleanup = [
    'e2e/auth-state.json',
    'e2e/test-metadata.json',
  ];

  filesToCleanup.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✅ Cleaned up: ${file}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not cleanup ${file}:`, error);
    }
  });

  console.log('✅ E2E Global Teardown Complete!');
  console.log(`📊 Total test duration: ${Math.round(duration / 1000)}s`);
}

export default globalTeardown;
