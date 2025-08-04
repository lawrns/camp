#!/usr/bin/env node

/**
 * Widget Visibility Test
 * 
 * This script tests if the Campfire widget is properly visible and functional
 * on the homepage. It checks for:
 * 1. Widget button presence
 * 2. Widget positioning
 * 3. Widget API calls
 * 4. Widget interaction
 */

const puppeteer = require('puppeteer');

async function testWidgetVisibility() {
  console.log('🔍 Testing Campfire Widget Visibility...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('widget') || msg.text().includes('Widget')) {
        console.log('🔧 Browser Console:', msg.text());
      }
    });
    
    // Navigate to homepage
    console.log('📍 Navigating to http://localhost:3010...');
    await page.goto('http://localhost:3010', { waitUntil: 'networkidle0' });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Check for widget button
    console.log('\n✅ Test 1: Looking for widget button...');
    const widgetButton = await page.$('[data-testid="widget-button"]');
    if (widgetButton) {
      console.log('✅ Widget button found!');
      
      // Get button position and styling
      const buttonInfo = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="widget-button"]');
        if (!btn) return null;
        
        const rect = btn.getBoundingClientRect();
        const styles = window.getComputedStyle(btn);
        
        return {
          position: {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          },
          styles: {
            position: styles.position,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor,
            borderRadius: styles.borderRadius
          },
          isVisible: rect.width > 0 && rect.height > 0
        };
      });
      
      console.log('📊 Button Info:', JSON.stringify(buttonInfo, null, 2));
      
      // Test 2: Click the widget button
      console.log('\n✅ Test 2: Clicking widget button...');
      await widgetButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if widget panel opened
      const widgetPanel = await page.$('[class*="widget"]');
      if (widgetPanel) {
        console.log('✅ Widget panel opened successfully!');
      } else {
        console.log('❌ Widget panel did not open');
      }
      
    } else {
      console.log('❌ Widget button not found');
      
      // Look for any widget-related elements
      const widgetElements = await page.evaluate(() => {
        const elements = [];
        
        // Look for elements with widget in class or id
        document.querySelectorAll('*').forEach(el => {
          if (el.className && el.className.toString().toLowerCase().includes('widget')) {
            elements.push({
              tag: el.tagName,
              className: el.className.toString(),
              id: el.id,
              textContent: el.textContent?.substring(0, 100)
            });
          }
        });
        
        return elements;
      });
      
      console.log('🔍 Found widget-related elements:', widgetElements);
    }
    
    // Test 3: Check for API calls
    console.log('\n✅ Test 3: Checking for widget API calls...');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/widget/')) {
        requests.push(request.url());
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (requests.length > 0) {
      console.log('✅ Widget API calls detected:');
      requests.forEach(url => console.log(`  - ${url}`));
    } else {
      console.log('❌ No widget API calls detected');
    }
    
    // Test 4: Take screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: 'widget-test-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved as widget-test-screenshot.png');
    
    console.log('\n🎉 Widget visibility test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testWidgetVisibility().catch(console.error);
