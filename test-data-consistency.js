#!/usr/bin/env node

/**
 * Test script to verify data consistency between main dashboard and dedicated inbox page
 * This script checks if both pages are fetching the same conversation data
 */

const puppeteer = require('puppeteer');

async function testDataConsistency() {
  console.log('🔍 Testing data consistency between dashboard pages...\n');

  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test main dashboard page
    console.log('📊 Testing main dashboard page (/dashboard)...');
    const page1 = await browser.newPage();
    
    // Enable console logging
    page1.on('console', msg => {
      if (msg.text().includes('[useConversations]')) {
        console.log(`[Dashboard] ${msg.text()}`);
      }
    });

    await page1.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for data to load

    // Test dedicated inbox page
    console.log('\n📥 Testing dedicated inbox page (/dashboard/inbox)...');
    const page2 = await browser.newPage();
    
    // Enable console logging
    page2.on('console', msg => {
      if (msg.text().includes('[useConversations]')) {
        console.log(`[Inbox] ${msg.text()}`);
      }
    });

    await page2.goto('http://localhost:3001/dashboard/inbox', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for data to load

    // Extract conversation data from both pages
    const dashboardData = await page1.evaluate(() => {
      // Look for conversation elements or data
      const conversationElements = document.querySelectorAll('[data-testid*="conversation"], .conversation-item, [class*="conversation"]');
      return {
        conversationCount: conversationElements.length,
        hasInboxComponent: !!document.querySelector('[data-testid="inbox-dashboard"]'),
        pageTitle: document.title,
        url: window.location.href
      };
    });

    const inboxData = await page2.evaluate(() => {
      // Look for conversation elements or data
      const conversationElements = document.querySelectorAll('[data-testid*="conversation"], .conversation-item, [class*="conversation"]');
      return {
        conversationCount: conversationElements.length,
        hasInboxComponent: !!document.querySelector('[data-testid="inbox-dashboard"]'),
        pageTitle: document.title,
        url: window.location.href
      };
    });

    // Compare results
    console.log('\n📋 Results Comparison:');
    console.log('Dashboard page:', dashboardData);
    console.log('Inbox page:', inboxData);

    const isConsistent = dashboardData.conversationCount === inboxData.conversationCount;
    
    if (isConsistent) {
      console.log('\n✅ SUCCESS: Both pages show the same number of conversations!');
      console.log(`   Conversation count: ${dashboardData.conversationCount}`);
    } else {
      console.log('\n❌ INCONSISTENCY DETECTED:');
      console.log(`   Dashboard conversations: ${dashboardData.conversationCount}`);
      console.log(`   Inbox conversations: ${inboxData.conversationCount}`);
    }

    // Check if both pages have the inbox component
    if (dashboardData.hasInboxComponent && inboxData.hasInboxComponent) {
      console.log('✅ Both pages have InboxDashboard component');
    } else {
      console.log('⚠️  InboxDashboard component status differs:');
      console.log(`   Dashboard: ${dashboardData.hasInboxComponent}`);
      console.log(`   Inbox: ${inboxData.hasInboxComponent}`);
    }

    await page1.close();
    await page2.close();

    return isConsistent;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testDataConsistency()
  .then(success => {
    console.log(`\n🏁 Test completed: ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
