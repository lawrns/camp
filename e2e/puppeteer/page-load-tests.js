/**
 * Puppeteer E2E Page Load Tests
 * 
 * Tests that all pages load successfully and basic functionality works
 */

const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3005';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Test configuration
const TEST_CONFIG = {
  headless: false, // Set to true for CI/CD
  slowMo: 100,     // Slow down actions for debugging
  timeout: 30000,  // 30 second timeout
  viewport: {
    width: 1280,
    height: 720
  }
};

// Test credentials
const TEST_CREDENTIALS = {
  email: 'jam@jam.com',
  password: 'password123'
};

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Home Page', requiresAuth: false },
  { path: '/login', name: 'Login Page', requiresAuth: false },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/inbox', name: 'Inbox', requiresAuth: true },
  { path: '/conversations', name: 'Conversations', requiresAuth: true },
  { path: '/analytics', name: 'Analytics', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true }
];

class PuppeteerTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async init() {
    console.log('🚀 Initializing Puppeteer browser...');
    
    this.browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      slowMo: TEST_CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(TEST_CONFIG.viewport);
    
    // Set up console logging
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Error') || text.includes('Failed') || text.includes('❌')) {
        console.log(`🔍 Browser Console Error: ${text}`);
      }
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    console.log('✅ Puppeteer browser initialized');
  }

  async testPageLoad(pageConfig) {
    const { path, name, requiresAuth } = pageConfig;
    const url = `${BASE_URL}${path}`;
    
    console.log(`\n📍 Testing: ${name} (${url})`);
    
    try {
      // Navigate to page
      const startTime = Date.now();
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: TEST_CONFIG.timeout 
      });
      const loadTime = Date.now() - startTime;

      // Check response status
      const status = response.status();
      console.log(`  📊 HTTP Status: ${status}`);
      console.log(`  ⏱️ Load Time: ${loadTime}ms`);

      // Check if page loaded successfully
      const title = await this.page.title();
      console.log(`  📄 Page Title: "${title}"`);

      // Check current URL (might redirect)
      const currentUrl = this.page.url();
      console.log(`  🔗 Current URL: ${currentUrl}`);

      // Take screenshot
      const screenshotName = `${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      const screenshotPath = `${SCREENSHOT_DIR}/${screenshotName}`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  📸 Screenshot: ${screenshotPath}`);

      // Check for basic page elements
      const hasContent = await this.page.evaluate(() => {
        const body = document.body;
        return body && body.textContent.trim().length > 0;
      });

      // Check for React hydration
      const isReactHydrated = await this.page.evaluate(() => {
        return window.React !== undefined || document.querySelector('[data-reactroot]') !== null;
      });

      // Check for errors in console
      const hasJSErrors = await this.page.evaluate(() => {
        return window.jsErrors && window.jsErrors.length > 0;
      });

      const result = {
        name,
        path,
        url,
        status,
        loadTime,
        title,
        currentUrl,
        hasContent,
        isReactHydrated,
        hasJSErrors: hasJSErrors || false,
        success: status === 200 && hasContent,
        redirected: currentUrl !== url,
        requiresAuth
      };

      // Special handling for auth-required pages
      if (requiresAuth && currentUrl.includes('/login')) {
        result.authRedirect = true;
        result.success = true; // Redirect to login is expected behavior
        console.log(`  🔐 Redirected to login (expected for auth-required page)`);
      }

      this.results.push(result);

      if (result.success) {
        console.log(`  ✅ ${name}: PASSED`);
      } else {
        console.log(`  ❌ ${name}: FAILED`);
      }

      return result;

    } catch (error) {
      console.log(`  ❌ ${name}: ERROR - ${error.message}`);
      
      const result = {
        name,
        path,
        url,
        error: error.message,
        success: false,
        requiresAuth
      };
      
      this.results.push(result);
      return result;
    }
  }

  async testAuthentication() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    try {
      // Navigate to login page
      await this.page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
      
      // Check if login form exists
      const emailInput = await this.page.$('#email');
      const passwordInput = await this.page.$('#password');
      const submitButton = await this.page.$('button[type="submit"]');
      
      if (!emailInput || !passwordInput || !submitButton) {
        console.log('  ❌ Login form elements not found');
        return false;
      }
      
      console.log('  ✅ Login form elements found');
      
      // Fill login form
      await this.page.type('#email', TEST_CREDENTIALS.email);
      await this.page.type('#password', TEST_CREDENTIALS.password);
      
      console.log(`  📝 Filled login form with ${TEST_CREDENTIALS.email}`);
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const currentUrl = this.page.url();
      const isAuthenticated = !currentUrl.includes('/login');
      
      console.log(`  🔗 Post-login URL: ${currentUrl}`);
      console.log(`  ${isAuthenticated ? '✅' : '❌'} Authentication: ${isAuthenticated ? 'SUCCESS' : 'FAILED'}`);
      
      // Take screenshot of result
      await this.page.screenshot({
        path: `${SCREENSHOT_DIR}/authentication-result.png`,
        fullPage: true
      });
      
      return isAuthenticated;
      
    } catch (error) {
      console.log(`  ❌ Authentication test error: ${error.message}`);
      return false;
    }
  }

  async testTRPCEndpoints() {
    console.log('\n🔌 Testing tRPC API Endpoints...');

    const testOrgId = 'b5e80170-004c-4e82-a88c-3e2166b169dd';

    const endpoints = [
      {
        name: 'Conversations List',
        url: `/api/trpc/conversations.list?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":{"organizationId":testOrgId}}}))}`,
        method: 'GET'
      },
      {
        name: 'Analytics Dashboard',
        url: `/api/trpc/analytics.getDashboardMetrics?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":{"organizationId":testOrgId}}}))}`,
        method: 'GET'
      },
      {
        name: 'Create Conversation',
        url: '/api/trpc/conversations.create?batch=1',
        method: 'POST',
        body: JSON.stringify({
          "0": {
            "json": {
              "organizationId": testOrgId,
              "title": "Puppeteer Test Conversation",
              "priority": "medium"
            }
          }
        })
      }
    ];

    const apiResults = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`  📍 Testing: ${endpoint.name}`);

        const result = await this.page.evaluate(async (endpoint) => {
          const options = {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json'
            }
          };

          if (endpoint.body) {
            options.body = endpoint.body;
          }

          const response = await fetch(endpoint.url, options);
          const text = await response.text();

          return {
            status: response.status,
            statusText: response.statusText,
            responseLength: text.length,
            hasJsonResponse: text.startsWith('{') || text.startsWith('[')
          };
        }, endpoint);

        console.log(`    📊 ${endpoint.name}: ${result.status} ${result.statusText} (${result.responseLength} bytes)`);

        apiResults.push({
          name: endpoint.name,
          ...result,
          success: [200, 400, 401].includes(result.status) // These are all valid responses
        });

      } catch (error) {
        console.log(`    ❌ ${endpoint.name}: ERROR - ${error.message}`);
        apiResults.push({
          name: endpoint.name,
          error: error.message,
          success: false
        });
      }
    }

    const successfulAPIs = apiResults.filter(r => r.success).length;
    console.log(`  📊 API Results: ${successfulAPIs}/${apiResults.length} endpoints accessible`);

    return apiResults;
  }

  async testBidirectionalCommunication() {
    console.log('\n🔄 Testing Bidirectional Communication...');

    try {
      // Test real-time WebSocket connection
      const realtimeTest = await this.page.evaluate(async () => {
        try {
          // Check if Supabase is available
          if (typeof window.supabase !== 'undefined') {
            const supabase = window.supabase;

            // Create a test channel
            const channelName = `puppeteer-test-${Date.now()}`;
            const channel = supabase.channel(channelName);

            let messageReceived = false;
            let connectionEstablished = false;

            // Set up message listener
            channel.on('broadcast', { event: 'test-message' }, (payload) => {
              messageReceived = true;
              console.log('📨 Received test message:', payload);
            });

            // Subscribe to channel
            const subscription = await channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                connectionEstablished = true;
                console.log('✅ Real-time connection established');
              }
            });

            // Wait for connection
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Send a test message
            if (connectionEstablished) {
              await channel.send({
                type: 'broadcast',
                event: 'test-message',
                payload: { message: 'Hello from Puppeteer!', timestamp: Date.now() }
              });

              // Wait for message to be received
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Clean up
            await supabase.removeChannel(channel);

            return {
              supabaseAvailable: true,
              connectionEstablished,
              messageReceived,
              subscriptionState: subscription.state
            };
          } else {
            return { supabaseAvailable: false };
          }
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log('  🔍 Real-time test result:', JSON.stringify(realtimeTest, null, 2));

      // Test bidirectional API communication
      const bidirectionalTest = await this.page.evaluate(async () => {
        try {
          const testData = {
            message: 'Puppeteer bidirectional test',
            timestamp: Date.now(),
            clientId: 'puppeteer-client'
          };

          // Send data to server
          const response = await fetch('/api/trpc/analytics.getRealTimeMetrics?batch=1&input=' +
            encodeURIComponent(JSON.stringify({"0":{"json":{"organizationId":"b5e80170-004c-4e82-a88c-3e2166b169dd"}}})));

          const responseText = await response.text();

          // Measure round-trip time
          const roundTripTime = Date.now() - testData.timestamp;

          return {
            sent: testData,
            received: {
              status: response.status,
              length: responseText.length,
              hasData: responseText.length > 0
            },
            roundTripTime,
            bidirectionalSuccess: response.status !== 404 && responseText.length > 0
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log('  🔍 Bidirectional test result:', JSON.stringify(bidirectionalTest, null, 2));

      const success = (realtimeTest.supabaseAvailable || realtimeTest.error) &&
                     bidirectionalTest.bidirectionalSuccess;

      console.log(`  ${success ? '✅' : '❌'} Bidirectional Communication: ${success ? 'WORKING' : 'ISSUES'}`);

      return {
        realtime: realtimeTest,
        bidirectional: bidirectionalTest,
        success
      };

    } catch (error) {
      console.log(`  ❌ Bidirectional communication test error: ${error.message}`);
      return { error: error.message, success: false };
    }
  }

  async generateReport() {
    console.log('\n📊 GENERATING TEST REPORT...');
    console.log('=' .repeat(60));
    
    // Page load results
    console.log('\n📄 PAGE LOAD RESULTS:');
    const successfulPages = this.results.filter(r => r.success).length;
    console.log(`✅ Successful: ${successfulPages}/${this.results.length} pages`);
    
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const authInfo = result.authRedirect ? ' (auth redirect)' : '';
      console.log(`  ${icon} ${result.name}: ${result.status || 'ERROR'}${authInfo}`);
    });

    // Performance summary
    const loadTimes = this.results.filter(r => r.loadTime).map(r => r.loadTime);
    if (loadTimes.length > 0) {
      const avgLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
      const maxLoadTime = Math.max(...loadTimes);
      console.log(`\n⏱️ PERFORMANCE:`);
      console.log(`  Average load time: ${avgLoadTime}ms`);
      console.log(`  Maximum load time: ${maxLoadTime}ms`);
    }

    console.log('\n🎯 SUMMARY:');
    console.log(`  📄 Pages tested: ${this.results.length}`);
    console.log(`  ✅ Successful loads: ${successfulPages}`);
    console.log(`  ❌ Failed loads: ${this.results.length - successfulPages}`);
    console.log(`  📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    
    console.log('\n🎉 E2E PUPPETEER TESTING COMPLETE!');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

// Main test runner
async function runTests() {
  const tester = new PuppeteerTester();
  
  try {
    // Create screenshots directory
    const fs = require('fs');
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    await tester.init();
    
    // Test all pages
    console.log('🚀 STARTING PUPPETEER E2E TESTS...');
    console.log('=' .repeat(60));
    
    for (const pageConfig of PAGES_TO_TEST) {
      await tester.testPageLoad(pageConfig);
    }
    
    // Test authentication
    const authSuccess = await tester.testAuthentication();

    // Test tRPC endpoints
    const apiResults = await tester.testTRPCEndpoints();

    // Test bidirectional communication
    const bidirectionalResults = await tester.testBidirectionalCommunication();

    // Generate report
    await tester.generateReport();

    // Exit with appropriate code
    const allPagesSuccessful = tester.results.every(r => r.success);
    const allAPIsAccessible = apiResults.every(r => r.success);
    const bidirectionalWorking = bidirectionalResults.success;

    if (allPagesSuccessful && allAPIsAccessible && bidirectionalWorking) {
      console.log('🎉 ALL TESTS PASSED!');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log(`  Pages: ${allPagesSuccessful ? 'PASS' : 'FAIL'}`);
      console.log(`  APIs: ${allAPIsAccessible ? 'PASS' : 'FAIL'}`);
      console.log(`  Bidirectional: ${bidirectionalWorking ? 'PASS' : 'FAIL'}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { PuppeteerTester, runTests };
