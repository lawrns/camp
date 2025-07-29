#!/usr/bin/env node

/**
 * Simple Login Test Script
 * Tests basic login functionality and session persistence
 */

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  email: 'jam@jam.com',
  password: 'password123',
};

async function testLogin() {
  console.log('🧪 Testing Login Functionality...');
  
  try {
    // Test 1: Login API endpoint
    console.log('📝 Test 1: Login API endpoint');
    const loginResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_CONFIG.email,
        password: TEST_CONFIG.password,
      }),
    });

    console.log(`Login response status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login API successful');
      console.log('Response:', JSON.stringify(loginData, null, 2));
      
      // Check for cookies
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        console.log('✅ Cookies set:', cookies);
      } else {
        console.log('⚠️  No cookies in response');
      }
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Login API failed');
      console.log('Error:', errorData);
      return;
    }

    // Test 2: Session validation
    console.log('\n📝 Test 2: Session validation');
    const sessionResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || '',
      },
    });

    console.log(`Session response status: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session validation successful');
      console.log('Session data:', JSON.stringify(sessionData, null, 2));
    } else {
      const errorData = await sessionResponse.text();
      console.log('⚠️  Session validation failed');
      console.log('Error:', errorData);
    }

    // Test 3: User endpoint
    console.log('\n📝 Test 3: User endpoint');
    const userResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || '',
      },
    });

    console.log(`User response status: ${userResponse.status}`);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ User endpoint successful');
      console.log('User data:', JSON.stringify(userData, null, 2));
    } else {
      const errorData = await userResponse.text();
      console.log('⚠️  User endpoint failed');
      console.log('Error:', errorData);
    }

    console.log('\n✅ Login test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testLogin()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLogin };
