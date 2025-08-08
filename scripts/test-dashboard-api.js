const { createClient } = require('@supabase/supabase-js');

const url = 'https://yvntokkncxbhapqjesti.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

console.log('🔍 Testing dashboard authentication and conversations API...');

async function testDashboardAPI() {
  try {
    const client = createClient(url, anonKey);
    
    console.log('📧 Signing in as jam@jam.com...');
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'jam@jam.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log('User ID:', authData.user?.id);
    console.log('Access token length:', authData.session?.access_token?.length);
    
    // Test the conversations API directly
    console.log('🔍 Testing conversations API...');
    const response = await fetch('http://localhost:3001/api/dashboard/conversations', {
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    const responseText = await response.text();
    console.log('API Response:', responseText);
    
    if (response.ok) {
      try {
        const conversations = JSON.parse(responseText);
        console.log('✅ Conversations API working!');
        console.log('Number of conversations:', conversations.length || 0);
        if (conversations.length > 0) {
          console.log('First conversation:', JSON.stringify(conversations[0], null, 2));
        }
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    } else {
      console.error('❌ API Error:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDashboardAPI();
