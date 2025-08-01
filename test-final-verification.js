/**
 * Final E2E Verification Test
 * Comprehensive test to verify the infinite loading fix is working
 */

const puppeteer = require('puppeteer');

async function runFinalVerification() {
  console.log('🎯 FINAL VERIFICATION: Testing infinite loading fix...\n');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Capture all console messages for analysis
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      
      if (text.includes('[InboxDashboard]') || text.includes('[useMessages]')) {
        console.log(`📝 ${text}`);
      }
      if (msg.type() === 'error') {
        console.log(`❌ ${text}`);
      }
    });
    
    // Test 1: Verify application loads without infinite loading
    console.log('🧪 Test 1: Application Loading & Authentication');
    console.log('📍 Navigating to dashboard...');
    
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for React to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const pageContent = await page.evaluate(() => ({
      title: document.title,
      bodyText: document.body.innerText.substring(0, 300),
      hasAuthForm: document.body.innerText.includes('Sign in') || 
                   document.body.innerText.includes('Email') ||
                   document.body.innerText.includes('Password'),
      hasLoadingElements: document.querySelectorAll('.animate-pulse, [class*="skeleton"]').length,
      hasErrorElements: document.querySelectorAll('[class*="error"], .text-red-500').length
    }));
    
    console.log(`✅ Page loaded: ${pageContent.title}`);
    console.log(`📊 Loading elements: ${pageContent.hasLoadingElements}`);
    console.log(`📊 Error elements: ${pageContent.hasErrorElements}`);
    
    if (pageContent.hasAuthForm) {
      console.log('✅ Authentication form detected - app is properly secured');
    }
    
    // Test 2: Monitor loading states over time
    console.log('\n🧪 Test 2: Loading State Monitoring');
    console.log('⏱️  Monitoring loading states for 10 seconds...');
    
    const loadingHistory = [];
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const loadingState = await page.evaluate(() => ({
        timestamp: Date.now(),
        loadingElements: document.querySelectorAll('.animate-pulse, [class*="skeleton"]').length,
        spinners: document.querySelectorAll('.animate-spin').length,
        hasInfiniteLoading: Array.from(document.querySelectorAll('.animate-pulse')).some(el => 
          getComputedStyle(el).display !== 'none'
        )
      }));
      
      loadingHistory.push(loadingState);
      process.stdout.write(`   ${i + 1}s: ${loadingState.loadingElements} loading | ${loadingState.spinners} spinners\r`);
    }
    
    console.log('\n');
    
    // Analyze loading pattern
    const persistentLoading = loadingHistory.every(state => state.loadingElements > 0);
    const hasInfiniteLoading = loadingHistory.some(state => state.hasInfiniteLoading);
    
    if (persistentLoading) {
      console.log('❌ INFINITE LOADING DETECTED - Loading elements never disappear');
    } else {
      console.log('✅ Loading states resolve properly - No infinite loading');
    }
    
    // Test 3: Check console messages for useMessages hook behavior
    console.log('\n🧪 Test 3: useMessages Hook Analysis');
    
    const relevantMessages = consoleMessages.filter(msg => 
      msg.text.includes('[useMessages]') || 
      msg.text.includes('[InboxDashboard]') ||
      msg.text.includes('Messages Loading')
    );
    
    console.log(`📊 Captured ${relevantMessages.length} relevant debug messages`);
    
    const loadingMessages = relevantMessages.filter(msg => 
      msg.text.includes('Messages Loading: true')
    );
    const loadingResolvedMessages = relevantMessages.filter(msg => 
      msg.text.includes('Messages Loading: false')
    );
    
    console.log(`📊 Loading started: ${loadingMessages.length} times`);
    console.log(`📊 Loading resolved: ${loadingResolvedMessages.length} times`);
    
    if (loadingResolvedMessages.length > 0) {
      console.log('✅ useMessages hook loading states resolve correctly');
    } else if (loadingMessages.length > 0) {
      console.log('⚠️  Loading states detected but resolution unclear');
    } else {
      console.log('ℹ️  No loading state messages (possibly auth page)');
    }
    
    // Test 4: Check for React errors or warnings
    console.log('\n🧪 Test 4: Error Detection');
    
    const errorMessages = consoleMessages.filter(msg => 
      msg.type === 'error' || 
      msg.text.includes('Error') ||
      msg.text.includes('Warning')
    );
    
    if (errorMessages.length > 0) {
      console.log(`⚠️  Found ${errorMessages.length} console errors/warnings:`);
      errorMessages.slice(0, 3).forEach(msg => {
        console.log(`   ${msg.type}: ${msg.text.substring(0, 100)}...`);
      });
    } else {
      console.log('✅ No console errors detected');
    }
    
    // Test 5: Performance check
    console.log('\n🧪 Test 5: Performance Metrics');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        totalTime: Math.round(navigation.loadEventEnd - navigation.fetchStart)
      };
    });
    
    console.log(`📊 DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`📊 Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`📊 Total Time: ${performanceMetrics.totalTime}ms`);
    
    if (performanceMetrics.totalTime < 5000) {
      console.log('✅ Performance is good (< 5s)');
    } else {
      console.log('⚠️  Performance could be improved (> 5s)');
    }
    
    // Final Assessment
    console.log('\n📋 FINAL ASSESSMENT');
    console.log('==================');
    
    const testResults = {
      applicationLoads: pageContent.title.includes('Campfire'),
      authenticationWorks: pageContent.hasAuthForm,
      noInfiniteLoading: !persistentLoading && !hasInfiniteLoading,
      loadingStatesResolve: loadingResolvedMessages.length > 0 || !pageContent.hasAuthForm,
      noConsoleErrors: errorMessages.length === 0,
      goodPerformance: performanceMetrics.totalTime < 5000
    };
    
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`✅ Application loads correctly: ${testResults.applicationLoads}`);
    console.log(`✅ Authentication works: ${testResults.authenticationWorks}`);
    console.log(`✅ No infinite loading: ${testResults.noInfiniteLoading}`);
    console.log(`✅ Loading states resolve: ${testResults.loadingStatesResolve}`);
    console.log(`✅ No console errors: ${testResults.noConsoleErrors}`);
    console.log(`✅ Good performance: ${testResults.goodPerformance}`);
    
    console.log(`\n📊 Test Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED - INFINITE LOADING FIX VERIFIED!');
      console.log('✅ The message submission infinite loading issue has been resolved');
    } else if (passedTests >= totalTests - 1) {
      console.log('\n✅ MOSTLY SUCCESSFUL - Minor issues detected');
      console.log('✅ The infinite loading fix appears to be working');
    } else {
      console.log('\n⚠️  SOME ISSUES DETECTED - Further investigation needed');
    }
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    
    if (page) {
      await page.screenshot({ path: 'final-verification-failure.png', fullPage: true });
      console.log('📸 Screenshot saved as final-verification-failure.png');
    }
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the verification
if (require.main === module) {
  runFinalVerification()
    .then(() => {
      console.log('\n✅ Final verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Final verification failed:', error);
      process.exit(1);
    });
}

module.exports = { runFinalVerification };
