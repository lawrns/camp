const puppeteer = require('puppeteer');

async function testDependencyLoopFix() {
  console.log('🧪 Testing Dependency Loop Fix...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    const reconnectionLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[BROWSER] ${text}`);
      if (text.includes('Conversation ID available') || text.includes('realtime reconnect')) {
        reconnectionLogs.push(text);
        console.log(`[RECONNECTION] ${text}`);
      }
    });
    
    console.log('📱 Navigating to homepage...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for widget to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Looking for widget button...');
    const widgetButton = await page.$('[data-testid="widget-button"]');
    
    if (widgetButton) {
      console.log('✅ Widget button found!');
      
      console.log('🖱️ Clicking widget button...');
      await widgetButton.click();
      
      console.log('⏳ Waiting for widget to open...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔍 Looking for conversation creation...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('✅ Test completed!');
      console.log(`📊 Reconnection logs found: ${reconnectionLogs.length}`);
      if (reconnectionLogs.length === 1) {
        console.log('🎉 SUCCESS: Single reconnection log detected - dependency loop fixed!');
      } else if (reconnectionLogs.length > 1) {
        console.log('⚠️ WARNING: Multiple reconnection logs detected - possible loop still exists');
        reconnectionLogs.forEach((log, index) => {
          console.log(`  ${index + 1}. ${log}`);
        });
      } else {
        console.log('ℹ️ INFO: No reconnection logs detected - widget may not have connected');
      }
      
    } else {
      console.log('❌ Widget button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDependencyLoopFix(); 