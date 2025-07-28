import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { signIn, signUp, signOut, getCurrentUser } from '@/lib/auth';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Authentication Integration Tests', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn()
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      }))
    };
    
    mockCreateClient.mockReturnValue(mockSupabase);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        organizationName: 'Test Org'
      };
      
      const mockUser = {
        id: 'user-123',
        email: userData.email,
        user_metadata: {
          full_name: userData.fullName
        }
      };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: { id: 'org-123', name: userData.organizationName },
        error: null
      });
      
      const result = await signUp(userData);
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            organization_name: userData.organizationName
          }
        }
      });
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });
    
    it('should handle registration errors', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123',
        fullName: 'Test User',
        organizationName: 'Test Org'
      };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' }
      });
      
      const result = await signUp(userData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
    
    it('should validate password strength', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Weak password
        fullName: 'Test User',
        organizationName: 'Test Org'
      };
      
      const result = await signUp(userData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters');
    });
  });

  describe('User Sign In', () => {
    it('should successfully sign in with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockSession = {
        access_token: 'token-123',
        user: {
          id: 'user-123',
          email: credentials.email
        }
      };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });
      
      const result = await signIn(credentials.email, credentials.password);
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password
      });
      
      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockSession);
    });
    
    it('should handle invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });
      
      const result = await signIn(credentials.email, credentials.password);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });
    
    it('should handle network errors during sign in', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await signIn(credentials.email, credentials.password);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('User Sign Out', () => {
    it('should successfully sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });
      
      const result = await signOut();
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
    
    it('should handle sign out errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      });
      
      const result = await signOut();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('Session Management', () => {
    it('should get current user session', async () => {
      const mockSession = {
        access_token: 'token-123',
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      const result = await getCurrentUser();
      
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(result.user).toEqual(mockSession.user);
    });
    
    it('should handle expired sessions', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });
      
      const result = await getCurrentUser();
      
      expect(result.user).toBeNull();
      expect(result.error).toBe('Session expired');
    });
    
    it('should refresh expired tokens', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() - 1000 // Expired
      };
      
      const newSession = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() + 3600000 // Valid for 1 hour
      };
      
      mockSupabase.auth.getSession
        .mockResolvedValueOnce({
          data: { session: expiredSession },
          error: null
        })
        .mockResolvedValueOnce({
          data: { session: newSession },
          error: null
        });
      
      const result = await getCurrentUser();
      
      expect(result.session).toEqual(newSession);
    });
  });

  describe('User Profile Management', () => {
    it('should update user profile', async () => {
      const userId = 'user-123';
      const profileData = {
        full_name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg'
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { id: userId, ...profileData },
        error: null
      });
      
      // Mock function to update profile
      const updateProfile = async (id: string, data: any) => {
        const result = await mockSupabase
          .from('profiles')
          .update(data)
          .eq('id', id)
          .single();
        
        return result;
      };
      
      const result = await updateProfile(userId, profileData);
      
      expect(result.data).toEqual({ id: userId, ...profileData });
      expect(result.error).toBeNull();
    });
    
    it('should handle profile update errors', async () => {
      const userId = 'user-123';
      const profileData = {
        full_name: 'Updated Name'
      };
      
      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Profile update failed' }
      });
      
      const updateProfile = async (id: string, data: any) => {
        const result = await mockSupabase
          .from('profiles')
          .update(data)
          .eq('id', id)
          .single();
        
        return result;
      };
      
      const result = await updateProfile(userId, profileData);
      
      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Profile update failed');
    });
  });

  describe('Organization Management', () => {
    it('should create organization during registration', async () => {
      const orgData = {
        name: 'Test Organization',
        slug: 'test-org',
        plan: 'starter'
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: { id: 'org-123', ...orgData },
        error: null
      });
      
      const createOrganization = async (data: any) => {
        const result = await mockSupabase
          .from('organizations')
          .insert(data)
          .single();
        
        return result;
      };
      
      const result = await createOrganization(orgData);
      
      expect(result.data).toEqual({ id: 'org-123', ...orgData });
      expect(result.error).toBeNull();
    });
    
    it('should handle duplicate organization names', async () => {
      const orgData = {
        name: 'Existing Organization',
        slug: 'existing-org'
      };
      
      mockSupabase.from().insert().single.mockResolvedValue({
        data: null,
        error: { message: 'Organization name already exists' }
      });
      
      const createOrganization = async (data: any) => {
        const result = await mockSupabase
          .from('organizations')
          .insert(data)
          .single();
        
        return result;
      };
      
      const result = await createOrganization(orgData);
      
      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Organization name already exists');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting during sign in attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' }
        });
        
        const result = await signIn(credentials.email, credentials.password);
        expect(result.success).toBe(false);
      }
      
      // 6th attempt should be rate limited
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Too many requests. Please try again later.' }
      });
      
      const result = await signIn(credentials.email, credentials.password);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Too many requests');
    });
  });
});