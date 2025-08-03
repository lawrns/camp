const { chromium } = require('playwright');

async function testMinimalRealtime() {
  console.log('🎯 MINIMAL REALTIME TEST - ISOLATE BINDING MISMATCH');
  console.log('==================================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all console messages and errors
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  try {
    console.log('\n--- Step 1: Login as Agent ---');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'jam@jam.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Agent logged in');
    
    console.log('\n--- Step 2: Navigate to Inbox ---');
    await page.goto('http://localhost:3001/dashboard/inbox');
    await page.waitForTimeout(5000);
    console.log('✅ Inbox loaded');
    
    console.log('\n--- Step 3: Test Basic Realtime Connection ---');
    
    // Inject a minimal realtime test script
    const realtimeTestResult = await page.evaluate(async () => {
      try {
        // Get Supabase client from window (should be available)
        const supabase = window.__SUPABASE_CLIENT__;
        if (!supabase) {
          return { success: false, error: 'Supabase client not found at window.__SUPABASE_CLIENT__' };
        }
        
        console.log('Testing basic realtime connection...');
        
        // Create a simple channel without complex filters
        const testChannel = supabase.channel('test-basic-realtime');
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ success: false, error: 'Timeout - no subscription response' });
          }, 10000);
          
          testChannel
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'messages'
              // No filter to avoid binding issues
            }, (payload) => {
              console.log('Basic realtime event received:', payload);
            })
            .subscribe((status, err) => {
              clearTimeout(timeout);
              console.log('Basic subscription status:', status, err);
              
              if (err) {
                resolve({ success: false, error: err.message || err.toString() });
              } else if (status === 'SUBSCRIBED') {
                resolve({ success: true, status: status });
              } else {
                resolve({ success: false, error: `Unexpected status: ${status}` });
              }
            });
        });
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\n--- Step 4: Realtime Test Results ---');
    console.log('Result:', realtimeTestResult);
    
    if (realtimeTestResult.success) {
      console.log('🎉 SUCCESS: Basic realtime connection working!');
      
      console.log('\n--- Step 5: Test Filtered Subscription ---');
      
      // Now test with a filter to see if that causes the binding mismatch
      const filteredTestResult = await page.evaluate(async () => {
        try {
          const supabase = window.__SUPABASE_CLIENT__;
          const testChannel = supabase.channel('test-filtered-realtime');
          
          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              resolve({ success: false, error: 'Timeout - no filtered subscription response' });
            }, 10000);
            
            testChannel
              .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: 'conversation_id=eq.1b9397c1-73c6-4b83-b6ec-9bfcd052fc61'  // Use actual conversation ID
              }, (payload) => {
                console.log('Filtered realtime event received:', payload);
              })
              .subscribe((status, err) => {
                clearTimeout(timeout);
                console.log('Filtered subscription status:', status, err);
                
                if (err) {
                  resolve({ success: false, error: err.message || err.toString() });
                } else if (status === 'SUBSCRIBED') {
                  resolve({ success: true, status: status });
                } else {
                  resolve({ success: false, error: `Unexpected status: ${status}` });
                }
              });
          });
          
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      console.log('Filtered Result:', filteredTestResult);
      
      if (filteredTestResult.success) {
        console.log('🎉 SUCCESS: Filtered realtime connection also working!');
        console.log('✅ The binding mismatch might be resolved!');
      } else {
        console.log('❌ FAILED: Filtered subscription failed - this is the binding mismatch source');
        console.log('Error:', filteredTestResult.error);
      }
      
    } else {
      console.log('❌ FAILED: Basic realtime connection failed');
      console.log('Error:', realtimeTestResult.error);
    }
    
    // Wait a bit more to see any additional logs
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'minimal-realtime-test.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    console.log('\n🎉 MINIMAL REALTIME TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'minimal-realtime-test-error.png', fullPage: true });
  }
  
  await browser.close();
}

testMinimalRealtime();
