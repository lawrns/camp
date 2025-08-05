#!/usr/bin/env node

/**
 * Comprehensive Error Detection Script
 * 
 * Tests all pages for errors and reports findings
 */

const puppeteer = require('puppeteer');

const PAGES_TO_TEST = [
  { path: '/', name: 'Homepage' },
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Register Page' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/inbox', name: 'Inbox' },
  { path: '/widget', name: 'Widget' },
  { path: '/onboarding', name: 'Onboarding' },
  { path: '/settings', name: 'Settings' },
  { path: '/profile', name: 'Profile' },
  { path: '/nonexistent-page', name: '404 Page' },
];

async function testPageForErrors(page, url, pageName) {
  const errors = [];
  const warnings = [];
  const consoleLogs = [];
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      errors.push({
        type: 'console',
        message: text,
        url: msg.location()?.url || url
      });
    } else if (type === 'warning') {
      warnings.push({
        type: 'console',
        message: text,
        url: msg.location()?.url || url
      });
    } else {
      consoleLogs.push({
        type: 'console',
        message: text,
        url: msg.location()?.url || url
      });
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    errors.push({
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      url: url
    });
  });

  // Listen for request failures
  page.on('requestfailed', request => {
    errors.push({
      type: 'requestfailed',
      message: `Request failed: ${request.url()}`,
      url: request.url(),
      failure: request.failure()?.errorText || 'Unknown failure'
    });
  });

  try {
    console.log(`\n🔍 Testing ${pageName} (${url})...`);
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait a bit for any delayed errors
    await page.waitForTimeout(2000);

    // Check for common error indicators
    const errorIndicators = await page.evaluate(() => {
      const indicators = [];
      
      // Check for error messages in the DOM
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], [data-error], .error, .Error');
      errorElements.forEach(el => {
        indicators.push({
          type: 'dom_error',
          message: el.textContent?.trim() || 'Error element found',
          selector: el.tagName + (el.className ? '.' + el.className : '')
        });
      });

      // Check for loading states that might indicate issues
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="Loading"], .loading, .Loading');
      if (loadingElements.length > 0) {
        indicators.push({
          type: 'loading_state',
          message: `${loadingElements.length} loading elements found - may indicate issues`,
          count: loadingElements.length
        });
      }

      // Check for empty content areas
      const mainContent = document.querySelector('main, [role="main"], #__next');
      if (mainContent && mainContent.textContent?.trim().length < 50) {
        indicators.push({
          type: 'empty_content',
          message: 'Main content area appears empty or very minimal',
          contentLength: mainContent.textContent?.trim().length || 0
        });
      }

      return indicators;
    });

    // Add DOM errors to our error list
    errors.push(...errorIndicators.filter(indicator => 
      indicator.type === 'dom_error' || indicator.type === 'empty_content'
    ));

    // Check page title and status
    const title = await page.title();
    const status = await page.evaluate(() => document.readyState);

    console.log(`  📄 Title: ${title}`);
    console.log(`  📊 Status: ${status}`);
    console.log(`  ❌ Errors: ${errors.length}`);
    console.log(`  ⚠️  Warnings: ${warnings.length}`);
    console.log(`  📝 Console logs: ${consoleLogs.length}`);

    // Log specific errors
    if (errors.length > 0) {
      console.log(`  ❌ Error Details:`);
      errors.forEach((error, index) => {
        console.log(`    ${index + 1}. ${error.type}: ${error.message}`);
        if (error.stack) {
          console.log(`       Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }

    // Log warnings
    if (warnings.length > 0) {
      console.log(`  ⚠️  Warning Details:`);
      warnings.slice(0, 3).forEach((warning, index) => {
        console.log(`    ${index + 1}. ${warning.message}`);
      });
      if (warnings.length > 3) {
        console.log(`    ... and ${warnings.length - 3} more warnings`);
      }
    }

    return {
      pageName,
      url,
      title,
      status,
      errors,
      warnings,
      consoleLogs,
      success: errors.length === 0
    };

  } catch (error) {
    console.log(`  💥 Navigation failed: ${error.message}`);
    return {
      pageName,
      url,
      title: 'Navigation Failed',
      status: 'failed',
      errors: [{
        type: 'navigation',
        message: error.message,
        url: url
      }],
      warnings: [],
      consoleLogs: [],
      success: false
    };
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Error Detection...');
  console.log('📍 Testing server at: http://localhost:3001');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1280, height: 720 });

  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const pageConfig of PAGES_TO_TEST) {
    const url = `http://localhost:3001${pageConfig.path}`;
    const result = await testPageForErrors(page, url, pageConfig.name);
    results.push(result);
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }

  await browser.close();

  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE ERROR DETECTION SUMMARY');
  console.log('='.repeat(80));

  const successfulPages = results.filter(r => r.success);
  const failedPages = results.filter(r => !r.success);

  console.log(`\n✅ Successful Pages: ${successfulPages.length}/${results.length}`);
  successfulPages.forEach(r => {
    console.log(`  ✅ ${r.pageName} - ${r.title}`);
  });

  console.log(`\n❌ Pages with Issues: ${failedPages.length}/${results.length}`);
  failedPages.forEach(r => {
    console.log(`  ❌ ${r.pageName} - ${r.errors.length} errors, ${r.warnings.length} warnings`);
  });

  console.log(`\n📈 Overall Statistics:`);
  console.log(`  Total Errors: ${totalErrors}`);
  console.log(`  Total Warnings: ${totalWarnings}`);
  console.log(`  Success Rate: ${((successfulPages.length / results.length) * 100).toFixed(1)}%`);

  // Detailed error analysis
  if (totalErrors > 0) {
    console.log(`\n🔍 Error Analysis:`);
    
    const errorTypes = {};
    results.forEach(r => {
      r.errors.forEach(error => {
        errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
      });
    });

    Object.entries(errorTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} occurrences`);
    });
  }

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (totalErrors === 0) {
    console.log(`  🎉 Excellent! No errors detected across all pages.`);
  } else {
    console.log(`  🔧 ${totalErrors} errors need attention:`);
    if (errorTypes['console']) {
      console.log(`    - Review console errors for JavaScript issues`);
    }
    if (errorTypes['requestfailed']) {
      console.log(`    - Check API endpoints and network requests`);
    }
    if (errorTypes['dom_error']) {
      console.log(`    - Review error message display in UI`);
    }
    if (errorTypes['empty_content']) {
      console.log(`    - Check content loading and rendering`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Error Detection Complete');
  console.log('='.repeat(80));

  return {
    totalPages: results.length,
    successfulPages: successfulPages.length,
    failedPages: failedPages.length,
    totalErrors,
    totalWarnings,
    successRate: (successfulPages.length / results.length) * 100,
    results
  };
}

// Run the script
main().catch(console.error); 