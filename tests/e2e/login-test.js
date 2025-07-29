/**
 * Simple login test to verify JWT enrichment is working
 */

const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('🔐 Testing login with jam@jam.com...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('JWT') || text.includes('Auth') || text.includes('enrichment')) {
        console.log('BROWSER:', text);
      }
    });

    // Navigate to login
    console.log('📱 Navigating to login page...');
    await page.goto('http://localhost:3002/login');
    
    // Wait for login form
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in credentials
    console.log('✍️ Filling in credentials...');
    await page.type('input[type="email"]', 'jam@jam.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit form
    console.log('🚀 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation or dashboard
    console.log('⏳ Waiting for login to complete...');
    await Promise.race([
      page.waitForNavigation({ timeout: 15000 }),
      page.waitForSelector('[data-testid="dashboard-content"]', { timeout: 15000 }),
      page.waitForFunction(() => window.location.pathname.includes('dashboard'), { timeout: 15000 })
    ]);
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful! Redirected to dashboard');
    } else {
      console.log('⚠️ Login may have failed - not on dashboard');
    }
    
    // Wait a bit to see any JWT enrichment logs
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();
