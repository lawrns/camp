/**
 * Authentication Persistence Fix
 * Addresses login persistence issues and extension conflicts
 */

import { supabase } from '@/lib/supabase';
import { authLogger } from '@/lib/utils/logger';

interface AuthPersistenceConfig {
  enableExtensionIsolation: boolean;
  enableFallbackStorage: boolean;
  enableSessionRecovery: boolean;
  sessionCheckInterval: number;
}

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  organization_id?: string;
}

const DEFAULT_CONFIG: AuthPersistenceConfig = {
  enableExtensionIsolation: true,
  enableFallbackStorage: true,
  enableSessionRecovery: true,
  sessionCheckInterval: 30000, // 30 seconds
};

class AuthPersistenceManager {
  private config: AuthPersistenceConfig;
  private sessionCheckTimer: NodeJS.Timeout | null = null;
  private lastSessionCheck: number = 0;
  private isRecovering: boolean = false;

  constructor(config: Partial<AuthPersistenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize authentication persistence with extension isolation
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. Isolate from browser extensions
      if (this.config.enableExtensionIsolation) {
        this.isolateFromExtensions();
      }

      // 2. Set up fallback storage mechanisms
      if (this.config.enableFallbackStorage) {
        this.setupFallbackStorage();
      }

      // 3. Enable session recovery
      if (this.config.enableSessionRecovery) {
        await this.enableSessionRecovery();
      }

      // 4. Start periodic session validation
      this.startSessionMonitoring();

      authLogger.info('[AuthPersistence] Initialization complete');
    } catch (error) {
      authLogger.error('[AuthPersistence] Initialization failed:', error);
    }
  }

  /**
   * Isolate authentication from browser extension interference
   */
  private isolateFromExtensions(): void {
    // Create isolated storage namespace
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;

    // Wrap localStorage methods to prevent extension interference
    localStorage.setItem = function(key: string, value: string) {
      try {
        // Use a prefixed key to avoid extension conflicts
        const isolatedKey = key.startsWith('sb-') ? `campfire_${key}` : key;
        return originalSetItem.call(this, isolatedKey, value);
      } catch (error) {
        authLogger.warn('[AuthPersistence] localStorage.setItem failed:', error);
        // Fallback to sessionStorage
        try {
          sessionStorage.setItem(key, value);
        } catch (fallbackError) {
          authLogger.error('[AuthPersistence] All storage methods failed:', fallbackError);
        }
      }
    };

    localStorage.getItem = function(key: string) {
      try {
        const isolatedKey = key.startsWith('sb-') ? `campfire_${key}` : key;
        return originalGetItem.call(this, isolatedKey);
      } catch (error) {
        authLogger.warn('[AuthPersistence] localStorage.getItem failed:', error);
        // Fallback to sessionStorage
        try {
          return sessionStorage.getItem(key);
        } catch (fallbackError) {
          authLogger.error('[AuthPersistence] All storage retrieval failed:', fallbackError);
          return null;
        }
      }
    };

    localStorage.removeItem = function(key: string) {
      try {
        const isolatedKey = key.startsWith('sb-') ? `campfire_${key}` : key;
        return originalRemoveItem.call(this, isolatedKey);
      } catch (error) {
        authLogger.warn('[AuthPersistence] localStorage.removeItem failed:', error);
        try {
          sessionStorage.removeItem(key);
        } catch (fallbackError) {
          authLogger.error('[AuthPersistence] All storage removal failed:', fallbackError);
        }
      }
    };
  }

  /**
   * Set up fallback storage mechanisms
   */
  private setupFallbackStorage(): void {
    // Create in-memory fallback for critical auth data
    const memoryStorage = new Map<string, string>();

    // Override Supabase storage adapter if needed
    if ((window as any).supabase?.auth?.storage) {
      const originalStorage = (window as any).supabase.auth.storage;
      
      (window as any).supabase.auth.storage = {
        getItem: (key: string) => {
          try {
            return originalStorage.getItem(key) || memoryStorage.get(key) || null;
          } catch (error) {
            authLogger.warn('[AuthPersistence] Storage getItem failed, using memory fallback');
            return memoryStorage.get(key) || null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            originalStorage.setItem(key, value);
            memoryStorage.set(key, value); // Always backup to memory
          } catch (error) {
            authLogger.warn('[AuthPersistence] Storage setItem failed, using memory fallback');
            memoryStorage.set(key, value);
          }
        },
        removeItem: (key: string) => {
          try {
            originalStorage.removeItem(key);
            memoryStorage.delete(key);
          } catch (error) {
            authLogger.warn('[AuthPersistence] Storage removeItem failed');
            memoryStorage.delete(key);
          }
        }
      };
    }
  }

  /**
   * Enable session recovery mechanisms
   */
  private async enableSessionRecovery(): Promise<void> {
    try {
      // Check for existing session
      const session = await supabase.auth.getSession();
      
      if (session.data.session) {
        authLogger.info('[AuthPersistence] Existing session found, validating...');
        
        // Validate session is still active
        const { data: user, error } = await supabase.auth.getUser();
        
        if (error || !user.user) {
          authLogger.warn('[AuthPersistence] Session invalid, attempting recovery...');
          await this.attemptSessionRecovery();
        } else {
          authLogger.info('[AuthPersistence] Session validated successfully');
        }
      } else {
        authLogger.info('[AuthPersistence] No existing session found');
        await this.attemptSessionRecovery();
      }
    } catch (error) {
      authLogger.error('[AuthPersistence] Session recovery check failed:', error);
    }
  }

  /**
   * Attempt to recover session from various storage mechanisms
   */
  private async attemptSessionRecovery(): Promise<void> {
    if (this.isRecovering) return;
    this.isRecovering = true;

    try {
      authLogger.info('[AuthPersistence] Attempting session recovery...');

      // Try to recover from cookies first
      const cookieSession = this.recoverFromCookies();
      if (cookieSession) {
        await this.restoreSession(cookieSession);
        return;
      }

      // Try to recover from localStorage backup
      const localSession = this.recoverFromLocalStorage();
      if (localSession) {
        await this.restoreSession(localSession);
        return;
      }

      // Try to recover from sessionStorage
      const sessionSession = this.recoverFromSessionStorage();
      if (sessionSession) {
        await this.restoreSession(sessionSession);
        return;
      }

      authLogger.info('[AuthPersistence] No recoverable session found');
    } catch (error) {
      authLogger.error('[AuthPersistence] Session recovery failed:', error);
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Recover session from cookies
   */
  private recoverFromCookies(): SessionData | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('auth-token') || name.includes('sb-')) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(value));
            if (sessionData.access_token && sessionData.refresh_token) {
              return sessionData;
            }
          } catch (parseError) {
            continue;
          }
        }
      }
    } catch (error) {
      authLogger.warn('[AuthPersistence] Cookie recovery failed:', error);
    }
    return null;
  }

  /**
   * Recover session from localStorage
   */
  private recoverFromLocalStorage(): SessionData | null {
    try {
      // Try various localStorage keys
      const keys = [
        'supabase.auth.token',
        'campfire_supabase.auth.token',
        'campfire_auth_session',
        'auth_session_backup'
      ];

      for (const key of keys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const sessionData = JSON.parse(stored);
            if (sessionData.access_token && sessionData.refresh_token) {
              return sessionData;
            }
          }
        } catch (parseError) {
          continue;
        }
      }
    } catch (error) {
      authLogger.warn('[AuthPersistence] localStorage recovery failed:', error);
    }
    return null;
  }

  /**
   * Recover session from sessionStorage
   */
  private recoverFromSessionStorage(): SessionData | null {
    try {
      const keys = ['supabase.auth.token', 'campfire_auth_session'];
      
      for (const key of keys) {
        try {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            const sessionData = JSON.parse(stored);
            if (sessionData.access_token && sessionData.refresh_token) {
              return sessionData;
            }
          }
        } catch (parseError) {
          continue;
        }
      }
    } catch (error) {
      authLogger.warn('[AuthPersistence] sessionStorage recovery failed:', error);
    }
    return null;
  }

  /**
   * Restore session using recovered data
   */
  private async restoreSession(sessionData: SessionData): Promise<void> {
    try {
      authLogger.info('[AuthPersistence] Attempting to restore session...');

      const { data, error } = await supabase.auth.setSession({
        access_token: sessionData.access_token,
        refresh_token: sessionData.refresh_token
      });

      if (error) {
        authLogger.error('[AuthPersistence] Session restoration failed:', error);
        return;
      }

      if (data.session) {
        authLogger.info('[AuthPersistence] Session restored successfully');
        
        // Backup the restored session
        this.backupSession(sessionData);
      }
    } catch (error) {
      authLogger.error('[AuthPersistence] Session restoration error:', error);
    }
  }

  /**
   * Backup session to multiple storage locations
   */
  private backupSession(sessionData: SessionData): void {
    try {
      const backupData = JSON.stringify(sessionData);
      
      // Backup to localStorage
      try {
        localStorage.setItem('auth_session_backup', backupData);
      } catch (error) {
        authLogger.warn('[AuthPersistence] localStorage backup failed');
      }

      // Backup to sessionStorage
      try {
        sessionStorage.setItem('campfire_auth_session', backupData);
      } catch (error) {
        authLogger.warn('[AuthPersistence] sessionStorage backup failed');
      }
    } catch (error) {
      authLogger.error('[AuthPersistence] Session backup failed:', error);
    }
  }

  /**
   * Start periodic session monitoring
   */
  private startSessionMonitoring(): void {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
    }

    this.sessionCheckTimer = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastSessionCheck < this.config.sessionCheckInterval) {
        return;
      }

      this.lastSessionCheck = now;
      await this.validateSession();
    }, this.config.sessionCheckInterval);
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<void> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        authLogger.warn('[AuthPersistence] Session validation failed, attempting recovery');
        await this.attemptSessionRecovery();
      }
    } catch (error) {
      authLogger.error('[AuthPersistence] Session validation error:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
  }
}

// Export singleton instance
export const authPersistenceManager = new AuthPersistenceManager();

/**
 * Initialize authentication persistence
 */
export async function initializeAuthPersistence(config?: Partial<AuthPersistenceConfig>): Promise<void> {
  if (config) {
    // Create new instance with custom config
    const manager = new AuthPersistenceManager(config);
    await manager.initialize();
  } else {
    // Use singleton
    await authPersistenceManager.initialize();
  }
}

/**
 * Force session recovery
 */
export async function forceSessionRecovery(): Promise<void> {
  await (authPersistenceManager as any).attemptSessionRecovery();
}
