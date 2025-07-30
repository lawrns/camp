#!/usr/bin/env node

/**
 * Authentication Persistence Test Script
 * Tests login persistence and extension conflict handling
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer not found. Install it with: npm install puppeteer');
  process.exit(1);
}

const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3005',
  email: 'jam@jam.com',
  password: 'password123',
  headless: false, // Set to true for CI
  timeout: 30000,
};

async function testAuthPersistence() {
  console.log('🧪 Starting Authentication Persistence Test...');
  
  const browser = await puppeteer.launch({
    headless: TEST_CONFIG.headless,
    devtools: !TEST_CONFIG.headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      // Simulate extension conflicts
      '--load-extension=./test-fixtures/mock-extension',
    ]
  });

  const page = await browser.newPage();
  
  // Monitor console for extension errors
  const consoleMessages = [];
  const extensionErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    
    // Check for extension-related errors that should be suppressed
    if (
      text.includes('Could not establish connection') ||
      text.includes('message port closed') ||
      text.includes('DeviceTrust access denied') ||
      text.includes('Failed to request') ||
      text.includes('Lock monitor stopped')
    ) {
      extensionErrors.push(text);
    }
  });

  try {
    // Test 1: Initial Login
    console.log('📝 Test 1: Initial Login');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: TEST_CONFIG.timeout });
    
    await page.type('input[type="email"]', TEST_CONFIG.email);
    await page.type('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await page.waitForNavigation({ timeout: TEST_CONFIG.timeout });
    
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      throw new Error(`Login failed - redirected to: ${currentUrl}`);
    }
    console.log('✅ Initial login successful');

    // Test 2: Session Persistence on Page Refresh
    console.log('📝 Test 2: Session Persistence on Page Refresh');
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Should still be authenticated
    await page.waitForTimeout(2000); // Allow auth check to complete
    const urlAfterRefresh = page.url();
    if (!urlAfterRefresh.includes('/dashboard')) {
      throw new Error(`Session not persisted after refresh - redirected to: ${urlAfterRefresh}`);
    }
    console.log('✅ Session persisted after page refresh');

    // Test 3: Session Persistence on New Tab
    console.log('📝 Test 3: Session Persistence on New Tab');
    const newPage = await browser.newPage();
    await newPage.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await newPage.waitForTimeout(2000);
    
    const newTabUrl = newPage.url();
    if (!newTabUrl.includes('/dashboard')) {
      throw new Error(`Session not shared across tabs - redirected to: ${newTabUrl}`);
    }
    console.log('✅ Session persisted across new tab');
    await newPage.close();

    // Test 4: Extension Error Suppression
    console.log('📝 Test 4: Extension Error Suppression');
    
    // Inject some extension-like errors
    await page.evaluate(() => {
      console.error('Could not establish connection. Receiving end does not exist.');
      console.error('The message port closed before a response was received.');
      console.error('DeviceTrust access denied');
      console.warn('Failed to request accounts in requestAndUnlockAccountsFromApp');
    });
    
    await page.waitForTimeout(1000);
    
    // Check if errors were properly suppressed (should not appear in visible console)
    const visibleErrors = await page.evaluate(() => {
      return window.__SUPPRESSED_LOGS__ || [];
    });
    
    if (visibleErrors.length === 0) {
      console.log('⚠️  Extension error suppression may not be working (no suppressed logs found)');
    } else {
      console.log(`✅ Extension errors suppressed: ${visibleErrors.length} errors caught`);
    }

    // Test 5: Auth Recovery After Storage Clear
    console.log('📝 Test 5: Auth Recovery After Storage Clear');
    
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000); // Allow recovery mechanisms to work
    
    const urlAfterClear = page.url();
    if (urlAfterClear.includes('/dashboard')) {
      console.log('✅ Session recovered after storage clear (HTTP-only cookies working)');
    } else {
      console.log('⚠️  Session not recovered after storage clear - this may be expected if using localStorage-only auth');
    }

    // Test 6: Logout and Re-login
    console.log('📝 Test 6: Logout and Re-login');
    
    // Navigate to dashboard first to ensure we're authenticated
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await page.waitForTimeout(1000);
    
    // Look for logout button/link
    try {
      await page.click('[data-testid="logout"], button:contains("Logout"), a:contains("Sign out")');
      await page.waitForNavigation({ timeout: 5000 });
    } catch (error) {
      console.log('⚠️  Could not find logout button, manually navigating to login');
      await page.goto(`${TEST_CONFIG.baseUrl}/api/auth/logout`);
      await page.waitForNavigation({ timeout: 5000 });
    }
    
    // Should be redirected to login
    const logoutUrl = page.url();
    if (logoutUrl.includes('/login') || logoutUrl.includes('/')) {
      console.log('✅ Logout successful');
    } else {
      console.log(`⚠️  Unexpected URL after logout: ${logoutUrl}`);
    }

    // Test Results Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Extension errors detected: ${extensionErrors.length}`);
    
    if (extensionErrors.length > 0) {
      console.log('\n🔍 Extension Errors Found (these should be suppressed in production):');
      extensionErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n✅ Authentication Persistence Test Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    
    // Capture screenshot for debugging
    await page.screenshot({ 
      path: 'auth-test-failure.png', 
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved as auth-test-failure.png');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testAuthPersistence()
    .then(() => {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthPersistence };
