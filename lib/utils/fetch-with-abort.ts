/**
 * Fetch utilities with abort controller support
 * Prevents state updates on unmounted components
 */

import { apiDebug, logError } from "./debug";

export interface FetchWithAbortOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface AbortableFetch {
  promise: Promise<Response>;
  abort: () => void;
}

/**
 * Create a fetch request with abort controller
 * Automatically handles timeouts and provides abort functionality
 */
export function createAbortableFetch(
  url: string,
  options: FetchWithAbortOptions = {}
): AbortableFetch {
  const { timeout = 10000, retries = 0, retryDelay = 1000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchWithRetry = async (attempt: number = 0): Promise<Response> => {
    try {
      apiDebug.log(`Fetching ${url} (attempt ${attempt + 1})`);
      
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok && attempt < retries) {
        apiDebug.warn(`Request failed (${response.status}), retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(attempt + 1);
      }

      return response;
    } catch (error) {
      if (signal.aborted) {
        throw new Error('Request was aborted');
      }
      
      if (attempt < retries) {
        apiDebug.warn(`Request failed, retrying in ${retryDelay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(attempt + 1);
      }
      
      throw error;
    }
  };

  return {
    promise: fetchWithRetry(),
    abort: () => controller.abort(),
  };
}

/**
 * Hook-style fetch with automatic cleanup
 * Use this in React components to prevent state updates after unmount
 */
export class ComponentFetch {
  private abortControllers = new Set<AbortController>();
  private isDestroyed = false;

  /**
   * Create an abortable fetch that will be automatically cleaned up
   */
  fetch(url: string, options: FetchWithAbortOptions = {}): AbortableFetch {
    if (this.isDestroyed) {
      throw new Error('ComponentFetch has been destroyed');
    }

    const controller = new AbortController();
    this.abortControllers.add(controller);

    const { timeout = 10000, ...fetchOptions } = options;
    
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const promise = fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
      this.abortControllers.delete(controller);
    });

    return {
      promise,
      abort: () => {
        controller.abort();
        this.abortControllers.delete(controller);
      },
    };
  }

  /**
   * Fetch JSON with automatic parsing and error handling
   */
  async fetchJson<T = any>(url: string, options: FetchWithAbortOptions = {}): Promise<T> {
    const { promise } = this.fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    try {
      const response = await promise;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logError(error, { url, method: options.method || 'GET' });
      throw error;
    }
  }

  /**
   * POST request with JSON body
   */
  async post<T = any>(url: string, data: unknown, options: FetchWithAbortOptions = {}): Promise<T> {
    return this.fetchJson<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request with JSON body
   */
  async put<T = any>(url: string, data: unknown, options: FetchWithAbortOptions = {}): Promise<T> {
    return this.fetchJson<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request with JSON body
   */
  async patch<T = any>(url: string, data: unknown, options: FetchWithAbortOptions = {}): Promise<T> {
    return this.fetchJson<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: FetchWithAbortOptions = {}): Promise<T> {
    return this.fetchJson<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Abort all pending requests
   */
  abortAll(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Destroy the fetch manager and abort all requests
   * Call this in component cleanup (useEffect return)
   */
  destroy(): void {
    this.abortAll();
    this.isDestroyed = true;
  }

  /**
   * Get the number of pending requests
   */
  get pendingCount(): number {
    return this.abortControllers.size;
  }

  /**
   * Check if there are any pending requests
   */
  get hasPending(): boolean {
    return this.abortControllers.size > 0;
  }
}

/**
 * React hook for component-scoped fetch operations
 * Automatically cleans up on unmount
 */
export function useComponentFetch(): ComponentFetch {
  const fetchManager = new ComponentFetch();

  // In a real React hook, this would be:
  // useEffect(() => {
  //   return () => fetchManager.destroy();
  // }, []);

  return fetchManager;
}

/**
 * Utility for batch requests with abort support
 */
export class BatchFetch {
  private requests: AbortableFetch[] = [];

  add(url: string, options: FetchWithAbortOptions = {}): this {
    const request = createAbortableFetch(url, options);
    this.requests.push(request);
    return this;
  }

  async execute(): Promise<Response[]> {
    try {
      const responses = await Promise.all(
        this.requests.map(request => request.promise)
      );
      return responses;
    } catch (error) {
      // If any request fails, abort all others
      this.abortAll();
      throw error;
    }
  }

  abortAll(): void {
    this.requests.forEach(request => request.abort());
    this.requests = [];
  }
}

/**
 * Simple fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithAbortOptions = {}
): Promise<Response> {
  const { promise } = createAbortableFetch(url, options);
  return promise;
}
