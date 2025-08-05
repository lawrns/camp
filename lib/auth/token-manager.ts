/**
 * Comprehensive Token Management System
 * 
 * Features:
 * - Automatic token refresh
 * - Expiry monitoring
 * - Session revocation
 * - Security event logging
 * - Multi-tab synchronization
 * - Offline handling
 */

'use client';

import { jwtDecode } from 'jwt-decode';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface TokenInfo {
  token: string;
  expiresAt: number;
  issuedAt: number;
  userId: string;
  role: string;
}

interface SessionState {
  session: Session | null;
  user: User | null;
  isValid: boolean;
  expiresAt: number | null;
  refreshToken: string | null;
}

interface TokenManagerConfig {
  refreshThreshold: number; // Refresh when token expires in X seconds
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMultiTabSync: boolean;
}

// ============================================================================
// TOKEN MANAGER CLASS
// ============================================================================

export class TokenManager {
  private config: TokenManagerConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isRefreshing = false;
  private retryCount = 0;

  constructor(config: Partial<TokenManagerConfig> = {}) {
    this.config = {
      refreshThreshold: 300, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      enableMultiTabSync: true,
      ...config,
    };

    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initialize() {
    if (typeof window === 'undefined') return;

    // Set up auth state listener
    supabase.browser().auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session);
    });

    // Set up multi-tab synchronization
    if (this.config.enableMultiTabSync) {
      this.setupMultiTabSync();
    }

    // Set up visibility change handling
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkTokenValidity();
      }
    });

    // Initial token check
    this.checkTokenValidity();
  }

  // ============================================================================
  // TOKEN VALIDATION
  // ============================================================================

  public async getTokenInfo(token: string): Promise<TokenInfo | null> {
    try {
      const decoded = jwtDecode<any>(token);
      
      return {
        token,
        expiresAt: decoded.exp * 1000, // Convert to milliseconds
        issuedAt: decoded.iat * 1000,
        userId: decoded.sub,
        role: decoded.role || 'authenticated',
      };
    } catch (error) {
      this.log('Error decoding token:', error);
      return null;
    }
  }

  public async getCurrentSession(): Promise<SessionState> {
    try {
      const { data: { session }, error } = await supabase.browser().auth.getSession();
      
      if (error) {
        this.log('Error getting session:', error);
        return {
          session: null,
          user: null,
          isValid: false,
          expiresAt: null,
          refreshToken: null,
        };
      }

      if (!session) {
        return {
          session: null,
          user: null,
          isValid: false,
          expiresAt: null,
          refreshToken: null,
        };
      }

      const tokenInfo = await this.getTokenInfo(session.access_token);
      const isValid = tokenInfo ? tokenInfo.expiresAt > Date.now() : false;

      return {
        session,
        user: session.user,
        isValid,
        expiresAt: tokenInfo?.expiresAt || null,
        refreshToken: session.refresh_token,
      };
    } catch (error) {
      this.log('Error in getCurrentSession:', error);
      return {
        session: null,
        user: null,
        isValid: false,
        expiresAt: null,
        refreshToken: null,
      };
    }
  }

  public async isTokenExpired(token?: string): Promise<boolean> {
    if (!token) {
      const sessionState = await this.getCurrentSession();
      token = sessionState.session?.access_token;
    }

    if (!token) return true;

    const tokenInfo = await this.getTokenInfo(token);
    if (!tokenInfo) return true;

    return tokenInfo.expiresAt <= Date.now();
  }

  public async isTokenExpiringSoon(token?: string): Promise<boolean> {
    if (!token) {
      const sessionState = await this.getCurrentSession();
      token = sessionState.session?.access_token;
    }

    if (!token) return true;

    const tokenInfo = await this.getTokenInfo(token);
    if (!tokenInfo) return true;

    const thresholdTime = Date.now() + (this.config.refreshThreshold * 1000);
    return tokenInfo.expiresAt <= thresholdTime;
  }

  // ============================================================================
  // TOKEN REFRESH
  // ============================================================================

  public async refreshToken(): Promise<Session | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise.then(() => this.getCurrentSession().then(s => s.session));
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      await this.refreshPromise;
      const sessionState = await this.getCurrentSession();
      return sessionState.session;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performRefresh(): Promise<void> {
    try {
      this.log('Refreshing token...');
      
      const { data, error } = await supabase.browser().auth.refreshSession();
      
      if (error) {
        this.retryCount++;
        
        if (this.retryCount <= this.config.maxRetries) {
          this.log(`Token refresh failed, retrying (${this.retryCount}/${this.config.maxRetries}):`, error);
          
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * this.retryCount)
          );
          
          return this.performRefresh();
        } else {
          this.log('Token refresh failed after max retries:', error);
          this.emit('refresh-failed', error);
          await this.handleRefreshFailure(error);
          return;
        }
      }

      if (data.session) {
        this.retryCount = 0;
        this.log('Token refreshed successfully');
        this.emit('refresh-success', data.session);
        this.scheduleNextRefresh(data.session.access_token);
      }
    } catch (error) {
      this.log('Unexpected error during token refresh:', error);
      this.emit('refresh-error', error);
    }
  }

  private async handleRefreshFailure(error: any): Promise<void> {
    this.log('Handling refresh failure, signing out user');
    
    try {
      await supabase.browser().auth.signOut();
      this.emit('session-expired');
    } catch (signOutError) {
      this.log('Error signing out after refresh failure:', signOutError);
    }
  }

  // ============================================================================
  // AUTOMATIC REFRESH SCHEDULING
  // ============================================================================

  private scheduleNextRefresh(token: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.getTokenInfo(token).then(tokenInfo => {
      if (!tokenInfo) return;

      const timeUntilRefresh = tokenInfo.expiresAt - Date.now() - (this.config.refreshThreshold * 1000);
      
      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
        
        this.log(`Next token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`);
      } else {
        // Token is already expired or expiring soon, refresh immediately
        this.refreshToken();
      }
    });
  }

  private async checkTokenValidity(): Promise<void> {
    const sessionState = await this.getCurrentSession();
    
    if (!sessionState.session) {
      this.log('No active session found');
      return;
    }

    if (!sessionState.isValid) {
      this.log('Current token is invalid, attempting refresh');
      await this.refreshToken();
    } else if (await this.isTokenExpiringSoon(sessionState.session.access_token)) {
      this.log('Token expiring soon, scheduling refresh');
      this.scheduleNextRefresh(sessionState.session.access_token);
    }
  }

  // ============================================================================
  // SESSION REVOCATION
  // ============================================================================

  public async revokeSession(): Promise<void> {
    try {
      this.log('Revoking session');
      
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      await supabase.browser().auth.signOut();
      this.emit('session-revoked');
      
      this.log('Session revoked successfully');
    } catch (error) {
      this.log('Error revoking session:', error);
      throw error;
    }
  }

  public async revokeAllSessions(): Promise<void> {
    try {
      this.log('Revoking all sessions');
      
      // Sign out from all devices
      await supabase.browser().auth.signOut({ scope: 'global' });
      this.emit('all-sessions-revoked');
      
      this.log('All sessions revoked successfully');
    } catch (error) {
      this.log('Error revoking all sessions:', error);
      throw error;
    }
  }

  // ============================================================================
  // MULTI-TAB SYNCHRONIZATION
  // ============================================================================

  private setupMultiTabSync(): void {
    // Listen for storage events to sync across tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'supabase.auth.token') {
        this.log('Token updated in another tab, checking validity');
        this.checkTokenValidity();
      }
    });

    // Broadcast token updates to other tabs
    this.on('refresh-success', (session: Session) => {
      localStorage.setItem('supabase.auth.token.updated', Date.now().toString());
    });
  }

  // ============================================================================
  // AUTH STATE HANDLING
  // ============================================================================

  private handleAuthStateChange(event: string, session: Session | null): void {
    this.log(`Auth state changed: ${event}`);

    switch (event) {
      case 'SIGNED_IN':
        if (session?.access_token) {
          this.scheduleNextRefresh(session.access_token);
        }
        this.emit('signed-in', session);
        break;

      case 'SIGNED_OUT':
        if (this.refreshTimer) {
          clearTimeout(this.refreshTimer);
          this.refreshTimer = null;
        }
        this.emit('signed-out');
        break;

      case 'TOKEN_REFRESHED':
        if (session?.access_token) {
          this.scheduleNextRefresh(session.access_token);
        }
        this.emit('token-refreshed', session);
        break;

      case 'USER_UPDATED':
        this.emit('user-updated', session?.user);
        break;
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          this.log(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private log(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[TokenManager] ${message}`, ...args);
    }
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    this.eventListeners.clear();
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const tokenManager = new TokenManager();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useState } from 'react';

export function useTokenManager() {
  const [sessionState, setSessionState] = useState<SessionState>({
    session: null,
    user: null,
    isValid: false,
    expiresAt: null,
    refreshToken: null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial session check
    tokenManager.getCurrentSession().then(setSessionState);

    // Set up event listeners
    const handleRefreshStart = () => setIsRefreshing(true);
    const handleRefreshEnd = () => {
      setIsRefreshing(false);
      tokenManager.getCurrentSession().then(setSessionState);
    };

    tokenManager.on('refresh-success', handleRefreshEnd);
    tokenManager.on('refresh-failed', handleRefreshEnd);
    tokenManager.on('signed-in', handleRefreshEnd);
    tokenManager.on('signed-out', handleRefreshEnd);

    return () => {
      tokenManager.off('refresh-success', handleRefreshEnd);
      tokenManager.off('refresh-failed', handleRefreshEnd);
      tokenManager.off('signed-in', handleRefreshEnd);
      tokenManager.off('signed-out', handleRefreshEnd);
    };
  }, []);

  return {
    ...sessionState,
    isRefreshing,
    refreshToken: () => tokenManager.refreshToken(),
    revokeSession: () => tokenManager.revokeSession(),
    revokeAllSessions: () => tokenManager.revokeAllSessions(),
  };
}
