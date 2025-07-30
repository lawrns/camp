import { test, expect } from '@playwright/test';

test.describe('Presence APIs', () => {
  test.describe('Authentication Required', () => {
    test('should require authentication for presence updates', async ({ page }) => {
      const response = await page.request.post('/api/presence', {
        data: {
          status: 'online',
          customStatus: 'Available for chat'
        }
      });

      expect(response.status()).toBe(401);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('UNAUTHORIZED');
    });

    test('should require authentication for presence retrieval', async ({ page }) => {
      const response = await page.request.get('/api/presence');

      expect(response.status()).toBe(401);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('UNAUTHORIZED');
    });

    test('should require authentication for heartbeat', async ({ page }) => {
      const response = await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'online',
          activity: 'typing'
        }
      });

      expect(response.status()).toBe(401);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  test.describe('Authenticated Presence Operations', () => {
    test.beforeEach(async ({ page }) => {
      // Login as test user to get authentication
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"], #email, input[type="email"]', 'jam@jam.com');
      await page.fill('[data-testid="password-input"], #password, input[type="password"]', 'password123');
      await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
      
      // Wait for successful login
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('should update user presence status', async ({ page }) => {
      const response = await page.request.post('/api/presence', {
        data: {
          status: 'online',
          customStatus: 'Available for support',
          metadata: {
            department: 'support',
            skills: ['technical', 'billing']
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.presence).toHaveProperty('status', 'online');
      expect(data.presence).toHaveProperty('customStatus', 'Available for support');
      expect(data.presence).toHaveProperty('userId');
      expect(data.presence).toHaveProperty('organizationId');
    });

    test('should validate presence status values', async ({ page }) => {
      const response = await page.request.post('/api/presence', {
        data: {
          status: 'invalid_status'
        }
      });

      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('should retrieve organization presence data', async ({ page }) => {
      // First set presence
      await page.request.post('/api/presence', {
        data: {
          status: 'online',
          customStatus: 'Ready to help'
        }
      });

      // Then retrieve presence data
      const response = await page.request.get('/api/presence');

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('presence');
      expect(data).toHaveProperty('organizationId');
      expect(Array.isArray(data.presence)).toBe(true);
    });

    test('should support presence filtering options', async ({ page }) => {
      // Test with includeOffline parameter
      const response = await page.request.get('/api/presence?includeOffline=true&limit=10');

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('filters');
      expect(data.filters).toHaveProperty('includeOffline', true);
      expect(data.filters).toHaveProperty('limit', 10);
    });

    test('should set user offline on logout', async ({ page }) => {
      const response = await page.request.delete('/api/presence');

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('userId');
    });
  });

  test.describe('Heartbeat System', () => {
    test.beforeEach(async ({ page }) => {
      // Login as test user
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"], #email, input[type="email"]', 'jam@jam.com');
      await page.fill('[data-testid="password-input"], #password, input[type="password"]', 'password123');
      await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('should send heartbeat updates', async ({ page }) => {
      const response = await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'online',
          activity: 'viewing_dashboard',
          metadata: {
            page: '/dashboard',
            timestamp: new Date().toISOString()
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.heartbeat).toHaveProperty('status', 'online');
      expect(data.heartbeat).toHaveProperty('activity', 'viewing_dashboard');
      expect(data.heartbeat).toHaveProperty('userId');
    });

    test('should validate heartbeat status values', async ({ page }) => {
      const response = await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'invalid_heartbeat_status'
        }
      });

      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    test('should retrieve current heartbeat status', async ({ page }) => {
      // First send a heartbeat
      await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'online',
          activity: 'testing'
        }
      });

      // Then retrieve status
      const response = await page.request.get('/api/presence/heartbeat');

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('presence');
      expect(data.presence).toHaveProperty('userId');
      expect(data.presence).toHaveProperty('status');
      expect(data.presence).toHaveProperty('lastSeen');
    });

    test('should create presence record if none exists', async ({ page }) => {
      // Get heartbeat status (should create record if none exists)
      const response = await page.request.get('/api/presence/heartbeat');

      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('presence');
      expect(data.presence).toHaveProperty('userId');
      
      // Check if it was newly created
      if (data.presence.isNew) {
        console.log('✅ New presence record created automatically');
      }
    });

    test('should handle rapid heartbeat updates', async ({ page }) => {
      // Send multiple heartbeats rapidly
      const heartbeats = [
        { status: 'online', activity: 'typing' },
        { status: 'online', activity: 'reading' },
        { status: 'away', activity: 'idle' },
      ];

      for (const heartbeat of heartbeats) {
        const response = await page.request.post('/api/presence/heartbeat', {
          data: heartbeat
        });

        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data.heartbeat).toHaveProperty('status', heartbeat.status);
        expect(data.heartbeat).toHaveProperty('activity', heartbeat.activity);
      }

      console.log('✅ Rapid heartbeat updates handled successfully');
    });
  });

  test.describe('Real-time Broadcasting', () => {
    test.beforeEach(async ({ page }) => {
      // Login as test user
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"], #email, input[type="email"]', 'jam@jam.com');
      await page.fill('[data-testid="password-input"], #password, input[type="password"]', 'password123');
      await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('should broadcast presence updates', async ({ page }) => {
      const response = await page.request.post('/api/presence', {
        data: {
          status: 'busy',
          customStatus: 'In a meeting'
        }
      });

      expect(response.status()).toBe(200);
      
      // TODO: Add real-time listener verification when Supabase Realtime testing is set up
      console.log('✅ Presence update created - broadcasting should be triggered');
    });

    test('should broadcast heartbeat updates selectively', async ({ page }) => {
      // First heartbeat should broadcast
      const response1 = await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'online',
          metadata: { forceUpdate: true }
        }
      });

      expect(response1.status()).toBe(200);
      
      const data1 = await response1.json();
      expect(data1.heartbeat).toHaveProperty('broadcastSent', true);

      // Immediate second heartbeat should not broadcast (rate limited)
      const response2 = await page.request.post('/api/presence/heartbeat', {
        data: {
          status: 'online'
        }
      });

      expect(response2.status()).toBe(200);
      
      const data2 = await response2.json();
      expect(data2.heartbeat).toHaveProperty('broadcastSent', false);

      console.log('✅ Heartbeat broadcasting rate limiting working');
    });

    test('should broadcast offline status on logout', async ({ page }) => {
      const response = await page.request.delete('/api/presence');

      expect(response.status()).toBe(200);
      
      // TODO: Add real-time listener verification when Supabase Realtime testing is set up
      console.log('✅ Offline status broadcast should be triggered');
    });
  });

  test.describe('Presence Status Transitions', () => {
    test.beforeEach(async ({ page }) => {
      // Login as test user
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"], #email, input[type="email"]', 'jam@jam.com');
      await page.fill('[data-testid="password-input"], #password, input[type="password"]', 'password123');
      await page.click('[data-testid="login-button"], button[type="submit"], button:has-text("Sign in")');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('should support all valid status transitions', async ({ page }) => {
      const statuses = ['online', 'away', 'busy', 'offline'];
      
      for (const status of statuses) {
        const response = await page.request.post('/api/presence', {
          data: {
            status,
            customStatus: `Currently ${status}`
          }
        });

        expect(response.status()).toBe(200);
        
        const data = await response.json();
        expect(data.presence).toHaveProperty('status', status);
      }

      console.log('✅ All status transitions working correctly');
    });
  });
});
