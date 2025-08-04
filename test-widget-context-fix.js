#!/usr/bin/env node

/**
 * Test script to verify the widget context provider bug is fixed
 * This script checks for the specific error patterns that were causing infinite loops
 */

const puppeteer = require('puppeteer');

async function testWidgetContextFix() {
  console.log('🧪 Testing Widget Context Provider Fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture console logs to check for errors
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      
      // Check for the specific error we're trying to fix
      if (text.includes('useWidget must be used within WidgetProvider')) {
        errors.push('CRITICAL: useWidget context error detected');
      }
      
      // Check for infinite loop indicators
      if (text.includes('Widget context not available') && consoleMessages.filter(m => m.includes('Widget context not available')).length > 5) {
        errors.push('WARNING: Potential infinite loop detected');
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    console.log('📱 Loading homepage with widget...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for widget to load
    console.log('⏳ Waiting for widget to initialize...');
    await page.waitForTimeout(5000);
    
    // Check if widget button is present
    const widgetButton = await page.$('[data-testid="widget-button"], .widget-button, [class*="widget"]');
    
    if (widgetButton) {
      console.log('✅ Widget button found on page');
      
      // Try to click the widget button
      try {
        await widgetButton.click();
        console.log('✅ Widget button clicked successfully');
        
        // Wait for widget to open
        await page.waitForTimeout(2000);
        
        // Check if widget panel opened
        const widgetPanel = await page.$('[data-testid="widget-panel"], .widget-panel, [class*="widget-open"]');
        if (widgetPanel) {
          console.log('✅ Widget panel opened successfully');
        } else {
          console.log('⚠️  Widget panel not found (may be using different selectors)');
        }
        
      } catch (clickError) {
        console.log('❌ Failed to click widget button:', clickError.message);
      }
    } else {
      console.log('❌ Widget button not found on page');
    }
    
    // Wait a bit more to capture any delayed errors
    await page.waitForTimeout(3000);
    
    // Analyze results
    console.log('\n📊 Test Results:');
    console.log('================');
    
    if (errors.length === 0) {
      console.log('🎉 SUCCESS: No widget context errors detected!');
      console.log('✅ Widget provider hierarchy is working correctly');
    } else {
      console.log('❌ ERRORS DETECTED:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Show recent console messages for debugging
    console.log('\n📝 Recent Console Messages (last 10):');
    console.log('=====================================');
    consoleMessages.slice(-10).forEach(msg => {
      if (msg.includes('Widget') || msg.includes('useWidget') || msg.includes('Provider')) {
        console.log(`   ${msg}`);
      }
    });
    
    return errors.length === 0;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testWidgetContextFix().then(success => {
  console.log(`\n🏁 Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
