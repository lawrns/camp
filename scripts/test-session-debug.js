const { createClient } = require('@supabase/supabase-js');

const url = 'https://yvntokkncxbhapqjesti.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bnRva2tuY3hiaGFwcWplc3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0ODUxNTQsImV4cCI6MjA2MDA2MTE1NH0.iJ4C4AHk0bfBmISvbSekGIAXn7puFL0lGbBwqBd6XTs';

console.log('🔍 Testing session and cookie authentication...');

async function testSessionDebug() {
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
    console.log('User metadata:', JSON.stringify(authData.user?.user_metadata, null, 2));
    console.log('App metadata:', JSON.stringify(authData.user?.app_metadata, null, 2));
    
    // Test login API to set cookies
    console.log('🔍 Testing login API to set cookies...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'jam@jam.com',
        password: 'password123'
      })
    });
    
    console.log('Login API Response status:', loginResponse.status);
    const loginResponseText = await loginResponse.text();
    console.log('Login API Response:', loginResponseText);
    
    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Set-Cookie headers:', cookies);
    
    if (loginResponse.ok && cookies) {
      // Test the conversations API with cookies
      console.log('🔍 Testing conversations API with cookies...');
      const conversationsResponse = await fetch('http://localhost:3001/api/dashboard/conversations', {
        headers: {
          'Cookie': cookies,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Conversations API Response status:', conversationsResponse.status);
      const conversationsResponseText = await conversationsResponse.text();
      console.log('Conversations API Response:', conversationsResponseText);
      
      if (conversationsResponse.ok) {
        try {
          const conversations = JSON.parse(conversationsResponseText);
          console.log('✅ Conversations API working with cookies!');
          console.log('Number of conversations:', conversations.length || 0);
        } catch (e) {
          console.log('Response is not JSON:', conversationsResponseText);
        }
      } else {
        console.error('❌ Conversations API Error:', conversationsResponse.status, conversationsResponseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSessionDebug();
