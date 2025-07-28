/**
 * Seamless Storage Adapter
 * Provides a unified interface for storage operations that gracefully handles
 * browser compatibility issues and storage limitations.
 */

export interface StorageAdapter {
  isAvailable(): boolean;
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): boolean;
  clear(): boolean;
  getSize(): number;
  isQuotaExceeded(): boolean;
}

export interface StorageStatus {
  localStorage: boolean;
  sessionStorage: boolean;
  cookieStorage: boolean;
  memoryStorage: boolean;
  quotaExceeded: boolean;
  storageUsed: number;
  storageLimit: number;
}

class MemoryStorage implements StorageAdapter {
  private storage = new Map<string, string>();

  isAvailable(): boolean {
    return true;
  }

  get(key: string): string | null {
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): boolean {
    try {
      this.storage.set(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    return this.storage.delete(key);
  }

  clear(): boolean {
    this.storage.clear();
    return true;
  }

  getSize(): number {
    let size = 0;
    for (const [key, value] of this.storage) {
      size += key.length + value.length;
    }
    return size;
  }

  isQuotaExceeded(): boolean {
    return false; // Memory storage doesn't have traditional quota limits
  }
}

class WebStorageAdapter implements StorageAdapter {
  constructor(private storage: Storage) {}

  isAvailable(): boolean {
    try {
      const test = "__storage_test__";
      this.storage.setItem(test, "test");
      this.storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  get(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): boolean {
    try {
      this.storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      this.storage.clear();
      return true;
    } catch {
      return false;
    }
  }

  getSize(): number {
    try {
      let size = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          size += key.length + (value?.length || 0);
        }
      }
      return size;
    } catch {
      return 0;
    }
  }

  isQuotaExceeded(): boolean {
    try {
      const testKey = "__quota_test__";
      const testValue = "x".repeat(1024); // 1KB test
      this.storage.setItem(testKey, testValue);
      this.storage.removeItem(testKey);
      return false;
    } catch (error) {
      return error instanceof Error && error.name === "QuotaExceededError";
    }
  }
}

class CookieStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    return typeof document !== "undefined" && navigator.cookieEnabled;
  }

  get(key: string): string | null {
    if (typeof document === "undefined") return null;

    const name = key + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      if (!c) continue;
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  }

  set(key: string, value: string): boolean {
    if (typeof document === "undefined") return false;

    try {
      document.cookie = `${key}=${value}; path=/; SameSite=Strict`;
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    if (typeof document === "undefined") return false;

    try {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    if (typeof document === "undefined") return false;

    try {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
      return true;
    } catch {
      return false;
    }
  }

  getSize(): number {
    if (typeof document === "undefined") return 0;
    return document.cookie.length;
  }

  isQuotaExceeded(): boolean {
    return this.getSize() > 4000; // Rough cookie size limit
  }
}

class SeamlessStorageAdapter {
  private adapters: StorageAdapter[];
  private fallbackAdapter: MemoryStorage;

  constructor() {
    this.fallbackAdapter = new MemoryStorage();
    this.adapters = [
      new WebStorageAdapter(typeof localStorage !== "undefined" ? localStorage : ({} as Storage)),
      new WebStorageAdapter(typeof sessionStorage !== "undefined" ? sessionStorage : ({} as Storage)),
      new CookieStorageAdapter(),
      this.fallbackAdapter,
    ];
  }

  getBestAdapter(): StorageAdapter {
    for (const adapter of this.adapters) {
      if (adapter.isAvailable() && !adapter.isQuotaExceeded()) {
        return adapter;
      }
    }
    return this.fallbackAdapter;
  }

  getStatus(): StorageStatus {
    const localStorage = new WebStorageAdapter(typeof window !== "undefined" ? window.localStorage : ({} as Storage));
    const sessionStorage = new WebStorageAdapter(
      typeof window !== "undefined" ? window.sessionStorage : ({} as Storage)
    );
    const cookieStorage = new CookieStorageAdapter();

    return {
      localStorage: localStorage.isAvailable(),
      sessionStorage: sessionStorage.isAvailable(),
      cookieStorage: cookieStorage.isAvailable(),
      memoryStorage: this.fallbackAdapter.isAvailable(),
      quotaExceeded: localStorage.isQuotaExceeded() || sessionStorage.isQuotaExceeded(),
      storageUsed: localStorage.getSize() + sessionStorage.getSize() + cookieStorage.getSize(),
      storageLimit: 10 * 1024 * 1024, // Rough estimate: 10MB
    };
  }

  get(key: string): string | null {
    return this.getBestAdapter().get(key);
  }

  set(key: string, value: string): boolean {
    return this.getBestAdapter().set(key, value);
  }

  remove(key: string): boolean {
    return this.getBestAdapter().remove(key);
  }

  clear(): boolean {
    return this.getBestAdapter().clear();
  }

  isStorageHealthy(): boolean {
    const status = this.getStatus();
    return status.localStorage || status.sessionStorage || status.cookieStorage;
  }

  getStorageStatus(): { status: string; reliable: boolean } {
    const status = this.getStatus();
    const isReliable = status.localStorage || status.sessionStorage;

    if (!isReliable && status.memoryStorage) {
      return { status: "limited", reliable: false };
    }

    return {
      status: isReliable ? "available" : "limited",
      reliable: isReliable,
    };
  }

  getDebugInfo(): { type: string } {
    const status = this.getStatus();

    if (status.localStorage) return { type: "localstorage" };
    if (status.sessionStorage) return { type: "sessionstorage" };
    if (status.cookieStorage) return { type: "cookie" };
    return { type: "memory" };
  }
}

// Export singleton instance
export const storageAdapter = new SeamlessStorageAdapter();

// Export individual adapters for testing
export { MemoryStorage, WebStorageAdapter, CookieStorageAdapter, SeamlessStorageAdapter };
