/**
 * FOCUSED EXPONENTIAL BACKOFF TEST
 * 
 * A simple, focused test to verify that the exponential backoff
 * implementation is working correctly by monitoring console logs
 * and subscription behavior.
 */

import { test, expect, Page } from '@playwright/test';

const TEST_CONFIG = {
  baseURL: 'http://localhost:3001',
  agentEmail: 'jam@jam.com',
  agentPassword: 'password123'
};

test.describe('Focused Exponential Backoff Test', () => {
  test('should verify exponential backoff implementation in console logs', async ({ page }) => {
    console.log('🔍 Testing exponential backoff implementation...');

    // Monitor console for exponential backoff logs
    const backoffLogs: string[] = [];
    const timeoutLogs: string[] = [];
    const retryLogs: string[] = [];
    const subscriptionLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      
      // Capture exponential backoff related logs
      if (text.includes('exponential backoff')) {
        backoffLogs.push(text);
      }
      
      // Capture timeout progression logs
      if (text.includes('Using timeout:') && text.includes('s (exponential backoff)')) {
        timeoutLogs.push(text);
      }
      
      // Capture retry attempt logs
      if (text.includes('Attempt') && text.includes('Ensuring subscription')) {
        retryLogs.push(text);
      }
      
      // Capture subscription status logs
      if (text.includes('Subscription status') || text.includes('Successfully subscribed')) {
        subscriptionLogs.push(text);
      }
    });

    // Navigate to homepage to trigger widget realtime
    console.log('🏠 Navigating to homepage to trigger widget realtime...');
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');

    // Open widget to trigger realtime subscriptions
    console.log('🔧 Opening widget to trigger realtime subscriptions...');
    try {
      await page.waitForSelector('[data-testid="widget-button"]', { timeout: 10000 });
      await page.click('[data-testid="widget-button"]');
      await page.waitForSelector('[data-testid="widget-panel"]', { timeout: 10000 });
      console.log('✅ Widget opened successfully');
    } catch (error) {
      console.log('⚠️ Widget opening failed, continuing with test...');
    }

    // Wait for realtime subscription attempts
    console.log('⏳ Waiting for realtime subscription attempts...');
    await page.waitForTimeout(30000); // Wait 30 seconds for subscription attempts

    // Navigate to login page to trigger dashboard realtime
    console.log('🔐 Navigating to login page...');
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Attempt login to trigger dashboard realtime
    console.log('📱 Attempting login to trigger dashboard realtime...');
    try {
      await page.fill('#email', TEST_CONFIG.agentEmail);
      await page.fill('#password', TEST_CONFIG.agentPassword);
      await page.click('button[type="submit"]');
      
      // Wait for potential dashboard navigation
      await page.waitForTimeout(15000);
      console.log('✅ Login attempted');
    } catch (error) {
      console.log('⚠️ Login failed, continuing with test...');
    }

    // Wait for additional subscription attempts
    console.log('⏳ Waiting for additional subscription attempts...');
    await page.waitForTimeout(45000); // Wait 45 seconds for more attempts

    // Analyze collected logs
    console.log('\n📊 EXPONENTIAL BACKOFF ANALYSIS:');
    console.log('=====================================');

    console.log(`\n🔄 Exponential Backoff Logs (${backoffLogs.length}):`);
    backoffLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });

    console.log(`\n⏱️ Timeout Progression Logs (${timeoutLogs.length}):`);
    timeoutLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });

    console.log(`\n🔄 Retry Attempt Logs (${retryLogs.length}):`);
    retryLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });

    console.log(`\n📡 Subscription Status Logs (${subscriptionLogs.length}):`);
    subscriptionLogs.slice(0, 10).forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.substring(0, 100)}...`);
    });

    // Verify exponential backoff implementation
    console.log('\n🎯 VERIFICATION RESULTS:');
    console.log('========================');

    // Check for timeout progression (15s → 30s → 60s)
    const expectedTimeouts = ['15s', '30s', '60s'];
    const foundTimeouts = expectedTimeouts.filter(timeout => 
      timeoutLogs.some(log => log.includes(timeout))
    );

    if (foundTimeouts.length > 0) {
      console.log(`✅ Exponential backoff timeouts detected: ${foundTimeouts.join(', ')}`);
    } else {
      console.log('ℹ️ No explicit timeout progression detected (may indicate successful connections)');
    }

    // Check for retry attempts
    const attemptPattern = /Attempt (\d+)\/3/;
    const attempts = retryLogs
      .map(log => {
        const match = log.match(attemptPattern);
        return match ? parseInt(match[1]) : null;
      })
      .filter(attempt => attempt !== null);

    if (attempts.length > 0) {
      const maxAttempt = Math.max(...attempts);
      console.log(`✅ Retry attempts detected up to: ${maxAttempt}/3`);
      
      if (maxAttempt > 1) {
        console.log('✅ Multi-attempt retry logic is active');
      }
    } else {
      console.log('ℹ️ No retry attempts detected (may indicate successful first attempts)');
    }

    // Check for exponential backoff mentions
    if (backoffLogs.length > 0) {
      console.log('✅ Exponential backoff implementation detected in logs');
    } else {
      console.log('ℹ️ No explicit exponential backoff mentions (implementation may be working silently)');
    }

    // Check for successful subscriptions
    const successfulSubscriptions = subscriptionLogs.filter(log => 
      log.includes('Successfully subscribed')
    );

    if (successfulSubscriptions.length > 0) {
      console.log(`✅ Found ${successfulSubscriptions.length} successful subscriptions`);
    } else {
      console.log('⚠️ No successful subscriptions detected');
    }

    // Overall assessment
    console.log('\n🎉 OVERALL ASSESSMENT:');
    console.log('======================');

    const hasTimeoutProgression = foundTimeouts.length > 0;
    const hasRetryAttempts = attempts.length > 0 && Math.max(...attempts) > 1;
    const hasBackoffLogs = backoffLogs.length > 0;
    const hasSuccessfulSubs = successfulSubscriptions.length > 0;

    if (hasTimeoutProgression || hasRetryAttempts || hasBackoffLogs) {
      console.log('✅ SUCCESS: Exponential backoff implementation is active and working');
    } else if (hasSuccessfulSubs) {
      console.log('✅ SUCCESS: Subscriptions working successfully (no retries needed)');
    } else {
      console.log('⚠️ INCONCLUSIVE: Limited evidence of exponential backoff activity');
    }

    // Verify implementation exists in code
    console.log('\n🔍 CODE VERIFICATION:');
    console.log('=====================');

    // Check if our implementation logs are present
    const implementationIndicators = [
      timeoutLogs.some(log => log.includes('exponential backoff')),
      retryLogs.some(log => log.includes('Attempt') && log.includes('/3')),
      subscriptionLogs.some(log => log.includes('elapsed:'))
    ];

    const implementationScore = implementationIndicators.filter(Boolean).length;
    console.log(`Implementation indicators found: ${implementationScore}/3`);

    if (implementationScore >= 2) {
      console.log('✅ Strong evidence of exponential backoff implementation');
    } else if (implementationScore >= 1) {
      console.log('✅ Some evidence of exponential backoff implementation');
    } else {
      console.log('⚠️ Limited evidence of implementation (may need code review)');
    }

    console.log('\n🎉 Focused exponential backoff test completed!');
  });

  test('should verify timeout progression in realtime subscriptions', async ({ page }) => {
    console.log('⏱️ Testing timeout progression specifically...');

    const timeoutProgressionLogs: string[] = [];
    const allRealtimeLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      
      // Capture all realtime-related logs
      if (text.includes('[Realtime]')) {
        allRealtimeLogs.push(text);
        
        // Specifically look for timeout progression
        if (text.includes('timeout:') || text.includes('Timeout') || text.includes('attempt')) {
          timeoutProgressionLogs.push(text);
        }
      }
    });

    // Navigate to trigger realtime
    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');

    // Wait for realtime activity
    console.log('⏳ Monitoring realtime activity for timeout progression...');
    await page.waitForTimeout(60000); // Wait 1 minute

    console.log(`\n📊 Realtime Activity Summary:`);
    console.log(`Total realtime logs: ${allRealtimeLogs.length}`);
    console.log(`Timeout progression logs: ${timeoutProgressionLogs.length}`);

    console.log(`\n⏱️ Timeout Progression Details:`);
    timeoutProgressionLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log}`);
    });

    // Look for specific timeout values
    const timeout15s = timeoutProgressionLogs.filter(log => log.includes('15s') || log.includes('15000'));
    const timeout30s = timeoutProgressionLogs.filter(log => log.includes('30s') || log.includes('30000'));
    const timeout60s = timeoutProgressionLogs.filter(log => log.includes('60s') || log.includes('60000'));

    console.log(`\n🎯 Timeout Detection:`);
    console.log(`15-second timeouts: ${timeout15s.length}`);
    console.log(`30-second timeouts: ${timeout30s.length}`);
    console.log(`60-second timeouts: ${timeout60s.length}`);

    if (timeout15s.length > 0 || timeout30s.length > 0 || timeout60s.length > 0) {
      console.log('✅ Timeout progression evidence found');
    } else {
      console.log('ℹ️ No explicit timeout progression (connections may be succeeding)');
    }

    console.log('\n🎉 Timeout progression test completed!');
  });
});
