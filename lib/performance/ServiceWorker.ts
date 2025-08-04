/**
 * Comprehensive Service Worker for Campfire
 * Provides offline functionality, caching, and performance optimization
 */

// Service Worker Types
interface CacheConfig {
  name: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
}

interface NetworkFirstConfig {
  cacheName: string;
  networkTimeoutSeconds?: number;
}

interface BackgroundSyncConfig {
  tag: string;
  maxRetentionTime?: number;
}

interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  offlineRequests: number;
  averageResponseTime: number;
}

// Cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  STATIC_ASSETS: {
    name: "campfire-static-v1",
    maxEntries: 100,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
  },
  API_RESPONSES: {
    name: "campfire-api-v1",
    maxEntries: 50,
    maxAgeSeconds: 60 * 60, // 1 hour
  },
  IMAGES: {
    name: "campfire-images-v1",
    maxEntries: 200,
    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
  },
  FONTS: {
    name: "campfire-fonts-v1",
    maxEntries: 20,
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
  },
  REALTIME: {
    name: "campfire-realtime-v1",
    maxEntries: 20,
    maxAgeSeconds: 60 * 5, // 5 minutes
  },
};

// Critical assets to precache
const CRITICAL_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/_next/static/css/app.css",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/framework.js",
  "/fonts/inter-var.woff2",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Performance metrics storage
let performanceMetrics: PerformanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0,
  averageResponseTime: 0,
};

// Background sync queue
const backgroundSyncQueue: Array<{
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  timestamp: number;
}> = [];

/**
 * Service Worker Installation
 */
self.addEventListener("install", (event: ExtendableEvent) => {

  event.waitUntil(
    (async () => {
      try {
        // Precache critical assets
        await precacheCriticalAssets();

        // Initialize performance metrics
        await initializePerformanceMetrics();

        // Skip waiting to activate immediately
        await self.skipWaiting();

      } catch (error) {

        throw error;
      }
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener("activate", (event: ExtendableEvent) => {

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        await cleanupOldCaches();

        // Claim all clients
        await (self as unknown).clients.claim();

        // Initialize background sync
        await initializeBackgroundSync();

      } catch (error) {

      }
    })()
  );
});

/**
 * Fetch Event Handler - Main request interception
 */
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (except for background sync)
  if (request.method !== "GET") {
    if (!navigator.onLine) {
      event.respondWith(handleOfflineRequest(request));
    }
    return;
  }

  // Route requests to appropriate handlers
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isFontRequest(url)) {
    event.respondWith(handleFontRequest(request));
  } else if (isRealtimeData(url)) {
    event.respondWith(handleRealtimeData(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

/**
 * Background Sync Event Handler
 */
self.addEventListener("sync", (event: unknown) => {

  if (event.tag === "background-sync") {
    event.waitUntil(processBackgroundSync());
  }
});

/**
 * Push Event Handler for notifications
 */
self.addEventListener("push", (event: unknown) => {

  const options = {
    body: "You have new updates in Campfire",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Updates",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/xmark.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(self.registration.showNotification("Campfire", options));
});

/**
 * Notification Click Handler
 */
self.addEventListener("notificationclick", (event: unknown) => {

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil((self as unknown).clients.openWindow("/dashboard"));
  }
});

/**
 * Message Handler for communication with main thread
 */
self.addEventListener("message", (event: MessageEvent) => {

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (event.data && event.data.type === "GET_METRICS") {
    event.ports[0].postMessage(performanceMetrics);
  } else if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Precache critical assets during installation
 */
async function precacheCriticalAssets(): Promise<void> {
  const cache = await caches.open(CACHE_CONFIGS.STATIC_ASSETS.name);

  const cachePromises = CRITICAL_ASSETS.map(async (asset) => {
    try {
      const response = await fetch(asset);
      if (response.ok) {
        await cache.put(asset, response);

      }
    } catch (error) {

    }
  });

  await Promise.allSettled(cachePromises);
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request: Request): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_CONFIGS.STATIC_ASSETS.name);

  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      updateMetrics("cacheHit", performance.now() - startTime);
      return cachedResponse;
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(CACHE_CONFIGS.STATIC_ASSETS);
    }

    updateMetrics("networkRequest", performance.now() - startTime);
    return networkResponse;
  } catch (error) {
    updateMetrics("cacheMiss", performance.now() - startTime);

    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/offline.html") || new Response("Offline", { status: 503 });
    }

    throw error;
  }
}

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request: Request): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_CONFIGS.API_RESPONSES.name);

  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), 3000)),
    ]);

    if (networkResponse.ok) {
      // Cache successful GET responses
      if (request.method === "GET") {
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
        await cleanupCache(CACHE_CONFIGS.API_RESPONSES);
      }
    }

    updateMetrics("networkRequest", performance.now() - startTime);
    return networkResponse;
  } catch (error) {
    // Fallback to cache for GET requests
    if (request.method === "GET") {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        updateMetrics("cacheHit", performance.now() - startTime);
        return cachedResponse;
      }
    }

    updateMetrics("offlineRequest", performance.now() - startTime);
    throw error;
  }
}

/**
 * Handle image requests with optimization and caching
 */
async function handleImageRequest(request: Request): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_CONFIGS.IMAGES.name);
  const url = new URL(request.url);

  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      updateMetrics("cacheHit", performance.now() - startTime);
      return cachedResponse;
    }

    // Fetch from network with potential format optimization
    const optimizedRequest = await optimizeImageRequest(request);
    const networkResponse = await fetch(optimizedRequest);

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(CACHE_CONFIGS.IMAGES);
    }

    updateMetrics("networkRequest", performance.now() - startTime);
    return networkResponse;
  } catch (error) {
    updateMetrics("cacheMiss", performance.now() - startTime);
    throw error;
  }
}

/**
 * Handle font requests with long-term caching
 */
async function handleFontRequest(request: Request): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_CONFIGS.FONTS.name);

  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      updateMetrics("cacheHit", performance.now() - startTime);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    updateMetrics("networkRequest", performance.now() - startTime);
    return networkResponse;
  } catch (error) {
    updateMetrics("cacheMiss", performance.now() - startTime);
    throw error;
  }
}

/**
 * Handle real-time data with network-first and short cache
 */
async function handleRealtimeData(request: Request): Promise<Response> {
  const startTime = performance.now();
  const cache = await caches.open(CACHE_CONFIGS.REALTIME.name);

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Network timeout")), 1000)),
    ]);

    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      await cleanupCache(CACHE_CONFIGS.REALTIME);
    }

    updateMetrics("networkRequest", performance.now() - startTime);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      updateMetrics("cacheHit", performance.now() - startTime);
      return cachedResponse;
    }

    updateMetrics("offlineRequest", performance.now() - startTime);
    throw error;
  }
}

/**
 * Handle generic requests
 */
async function handleGenericRequest(request: Request): Promise<Response> {
  const startTime = performance.now();

  try {
    const response = await fetch(request);
    updateMetrics("networkRequest", performance.now() - startTime);
    return response;
  } catch (error) {
    updateMetrics("offlineRequest", performance.now() - startTime);

    // For navigation requests, try to serve cached page or offline page
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_CONFIGS.STATIC_ASSETS.name);
      const cachedResponse = (await cache.match("/")) || (await cache.match("/offline.html"));
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    throw error;
  }
}

/**
 * Handle offline requests (non-GET)
 */
async function handleOfflineRequest(request: Request): Promise<Response> {
  // Add to background sync queue
  const requestData = {
    url: request.url,
    method: request.method,
    body: request.method !== "GET" ? await request.text() : undefined,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: Date.now(),
  };

  backgroundSyncQueue.push(requestData);

  // Store in IndexedDB for persistence
  await storeBackgroundSyncRequest(requestData);

  // Register background sync
  if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
    await self.registration.sync.register("background-sync");
  }

  return new Response(
    JSON.stringify({
      message: "Request queued for background sync",
      queued: true,
    }),
    {
      status: 202,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Process background sync queue
 */
async function processBackgroundSync(): Promise<void> {

  const requests = await getBackgroundSyncRequests();
  const processedRequests: string[] = [];

  for (const requestData of requests) {
    try {
      const { url, method, body, headers } = requestData;

      const response = await fetch(url, {
        method,
        body: body || undefined,
        headers: headers || {},
      });

      if (response.ok) {
        processedRequests.push(requestData.url);

      } else {

      }
    } catch (error) {

    }
  }

  // Remove processed requests
  await removeProcessedBackgroundSyncRequests(processedRequests);
}

/**
 * Optimize image requests for better performance
 */
async function optimizeImageRequest(request: Request): Promise<Request> {
  const url = new URL(request.url);

  // Check if browser supports modern formats
  const acceptHeader = request.headers.get("Accept") || "";

  if (acceptHeader.includes("image/avif")) {
    // Request AVIF if supported
    url.searchParams.set("format", "avif");
  } else if (acceptHeader.includes("image/webp")) {
    // Request WebP if supported
    url.searchParams.set("format", "webp");
  }

  // Add responsive sizing hints if available
  if (url.searchParams.has("w") || url.searchParams.has("width")) {
    const width = url.searchParams.get("w") || url.searchParams.get("width");
    if (width && parseInt(width) > 1920) {
      url.searchParams.set("w", "1920"); // Limit max width
    }
  }

  return new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
  });
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const currentCacheNames = Object.values(CACHE_CONFIGS).map((config) => config.name);

  const deletePromises = cacheNames
    .filter((cacheName) => !currentCacheNames.includes(cacheName))
    .map((cacheName) => caches.delete(cacheName));

  await Promise.all(deletePromises);

}

/**
 * Clean up individual cache based on size and age limits
 */
async function cleanupCache(config: CacheConfig): Promise<void> {
  const cache = await caches.open(config.name);
  const requests = await cache.keys();

  if (config.maxEntries && requests.length > config.maxEntries) {
    // Remove oldest entries
    const entriesToRemove = requests.slice(0, requests.length - config.maxEntries);
    await Promise.all(entriesToRemove.map((request) => cache.delete(request)));
  }

  if (config.maxAgeSeconds) {
    const now = Date.now();
    const maxAge = config.maxAgeSeconds * 1000;

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (now - responseDate > maxAge) {
            await cache.delete(request);
          }
        }
      }
    }
  }
}

/**
 * Clear all caches
 */
async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

}

/**
 * Update performance metrics
 */
function updateMetrics(type: keyof PerformanceMetrics, responseTime?: number): void {
  if (type === "averageResponseTime" && responseTime) {
    const totalRequests =
      performanceMetrics.cacheHits + performanceMetrics.cacheMisses + performanceMetrics.networkRequests;

    performanceMetrics.averageResponseTime =
      (performanceMetrics.averageResponseTime * totalRequests + responseTime) / (totalRequests + 1);
  } else {
    performanceMetrics[type]++;
  }

  // Periodically send metrics to main thread
  if (Math.random() < 0.01) {
    // 1% sampling
    sendMetricsToMainThread();
  }
}

/**
 * Send metrics to main thread
 */
async function sendMetricsToMainThread(): Promise<void> {
  try {
    const clients = await (self as unknown).clients.matchAll();
    clients.forEach((client: unknown) => {
      client.postMessage({
        type: "PERFORMANCE_METRICS",
        data: performanceMetrics,
      });
    });
  } catch (error) {

  }
}

/**
 * Initialize performance metrics
 */
async function initializePerformanceMetrics(): Promise<void> {
  // Load existing metrics from IndexedDB if available
  try {
    const stored = await getStoredMetrics();
    if (stored) {
      performanceMetrics = { ...performanceMetrics, ...stored };
    }
  } catch (error) {

  }
}

/**
 * Initialize background sync
 */
async function initializeBackgroundSync(): Promise<void> {
  // Load pending background sync requests
  const pendingRequests = await getBackgroundSyncRequests();
  backgroundSyncQueue.push(...pendingRequests);

}

/**
 * Utility functions for request type detection
 */
function isStaticAsset(url: URL): boolean {
  return (
    /\.(js|css|html|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
    url.pathname.startsWith("/_next/static/")
  );
}

function isAPIRequest(url: URL): boolean {
  return url.pathname.startsWith("/api/") || url.hostname !== self.location.hostname;
}

function isImageRequest(url: URL): boolean {
  return /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i.test(url.pathname);
}

function isFontRequest(url: URL): boolean {
  return /\.(woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isRealtimeData(url: URL): boolean {
  return url.pathname.includes("/realtime") || url.pathname.includes("/live") || url.pathname.includes("/metrics");
}

/**
 * IndexedDB utilities for persistent storage
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("CampfireServiceWorker", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("backgroundSync")) {
        db.createObjectStore("backgroundSync", { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains("metrics")) {
        db.createObjectStore("metrics", { keyPath: "id" });
      }
    };
  });
}

async function storeBackgroundSyncRequest(requestData: unknown): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(["backgroundSync"], "readwrite");
    const store = transaction.objectStore("backgroundSync");
    await store.add(requestData);
  } catch (error) {

  }
}

async function getBackgroundSyncRequests(): Promise<any[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(["backgroundSync"], "readonly");
    const store = transaction.objectStore("backgroundSync");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {

    return [];
  }
}

async function removeProcessedBackgroundSyncRequests(urls: string[]): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(["backgroundSync"], "readwrite");
    const store = transaction.objectStore("backgroundSync");

    const allRequests = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const request of allRequests) {
      if (urls.includes(request.url)) {
        await store.delete(request.id);
      }
    }
  } catch (error) {

  }
}

async function getStoredMetrics(): Promise<PerformanceMetrics | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(["metrics"], "readonly");
    const store = transaction.objectStore("metrics");

    return new Promise((resolve, reject) => {
      const request = store.get("performance");
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {

    return null;
  }
}

// Export for TypeScript compilation
export {};
