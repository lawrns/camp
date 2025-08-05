# PERFORMANCE & OPTIMIZATION COMPREHENSIVE GUIDE

## ⚡ PERFORMANCE ARCHITECTURE

### Performance Metrics Framework
```
Core Web Vitals Targets:
├── LCP (Largest Contentful Paint): <2.5s
├── FID (First Input Delay): <100ms
├── CLS (Cumulative Layout Shift): <0.1
├── TTI (Time to Interactive): <3.5s
├── TBT (Total Blocking Time): <200ms
└── Speed Index: <4.0s
```

### Performance Budget
```
Resource Budgets:
├── JavaScript: <500KB (compressed)
├── CSS: <100KB (compressed)
├── Images: <1MB (total)
├── Fonts: <100KB (total)
├── API Response: <100ms (p95)
└── Database Query: <50ms (p95)
```

## 🚀 FRONTEND OPTIMIZATION

### Next.js Performance Configuration
```typescript
// next.config.js - Performance optimizations
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2
  }
};
```

### Code Splitting & Lazy Loading
```typescript
// components/performance/LazyComponents.tsx
import dynamic from 'next/dynamic';
import { Suspense, lazy } from 'react';

// Dynamic imports for heavy components
const ConversationDetail = dynamic(
  () => import('@/components/conversations/ConversationDetail'),
  {
    loading: () => <ConversationDetailSkeleton />,
    ssr: false
  }
);

const AnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AnalyticsDashboard'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false
  }
);

const WidgetLauncher = dynamic(
  () => import('@/components/widget/WidgetLauncher'),
  {
    loading: () => <WidgetSkeleton />,
    ssr: false
  }
);

// Lazy load heavy libraries
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
const ChartJS = lazy(() => import('chart.js/auto'));

// Preload critical components
export const preloadCriticalComponents = () => {
  if (typeof window !== 'undefined') {
    // Preload conversation components when user is on dashboard
    if (window.location.pathname.includes('/dashboard')) {
      import('@/components/conversations/ConversationDetail');
    }
  }
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIntersecting] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
};
```

### Image Optimization
```typescript
// lib/performance/image-optimization.ts
import Image from 'next/image';

// Optimized image component with blur placeholder
export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  ...props 
}: OptimizedImageProps) => {
  const blurDataURL = generateBlurDataURL(width, height);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL={blurDataURL}
      loading={priority ? 'eager' : 'lazy'}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
};

// Generate blur placeholder
const generateBlurDataURL = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Responsive image component
export const ResponsiveImage = ({ 
  src, 
  alt, 
  sizes = '100vw',
  quality = 75 
}: ResponsiveImageProps) => {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      style={{ objectFit: 'cover' }}
      placeholder="blur"
    />
  );
};
```

### Bundle Analysis & Optimization
```typescript
// analyze-bundle.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

const bundleAnalyzerConfig = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),
    new CompressionPlugin({
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        params: {
          [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      threshold: 8192,
      minRatio: 0.8
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
};

// Bundle size monitoring
const bundleSizeLimits = {
  'pages/_app.js': 150 * 1024, // 150KB
  'pages/dashboard.js': 200 * 1024, // 200KB
  'pages/conversations.js': 180 * 1024, // 180KB
  'pages/widget.js': 100 * 1024, // 100KB
  'chunks/vendor.js': 400 * 1024, // 400KB
};

const checkBundleSizes = () => {
  const stats = require('./bundle-stats.json');
  const assets = stats.assets;
  
  Object.entries(bundleSizeLimits).forEach(([filename, limit]) => {
    const asset = assets.find(a => a.name.includes(filename));
    if (asset && asset.size > limit) {
      console.warn(`${filename} exceeds size limit: ${asset.size} > ${limit}`);
    }
  });
};
```

## 🗄️ DATABASE OPTIMIZATION

### Query Optimization
```typescript
// lib/performance/database-optimization.ts
import { createClient } from '@supabase/supabase-js';

// Connection pooling configuration
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'campfire',
    },
  },
});

// Query optimization strategies
export const queryOptimization = {
  // Index optimization queries
  createOptimizedIndexes: async () => {
    const indexes = [
      // Conversation indexes
      'CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON conversations(organization_id, status);',
      'CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);',
      
      // Message indexes
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);',
      
      // User indexes
      'CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      
      // Composite indexes for complex queries
      'CREATE INDEX IF NOT EXISTS idx_conversations_org_priority_status ON conversations(organization_id, priority, status);',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_type ON messages(conversation_id, message_type);'
    ];

    for (const index of indexes) {
      await supabase.rpc('exec_sql', { sql: index });
    }
  },

  // Query performance monitoring
  monitorQueryPerformance: async () => {
    const slowQueries = await supabase.rpc('get_slow_queries', {
      min_duration_ms: 100
    });

    return slowQueries.data.map(query => ({
      query: query.query,
      duration: query.duration,
      frequency: query.calls,
      optimization_suggestions: this.getOptimizationSuggestions(query)
    }));
  },

  // Pagination optimization
  optimizedPagination: async (table: string, page: number, limit: number, filters: any) => {
    const offset = (page - 1) * limit;
    
    // Use keyset pagination for better performance
    const query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there's a next page

    if (filters.organization_id) {
      query.eq('organization_id', filters.organization_id);
    }

    if (filters.status) {
      query.eq('status', filters.status);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    
    return {
      items,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].created_at : null
    };
  },

  // Connection pooling
  connectionPool: {
    maxConnections: 20,
    minConnections: 5,
    idleTimeout: 30000,
    acquireTimeout: 60000,
    evictTimeout: 1000
  }
};
```

### Caching Strategy
```typescript
// lib/performance/caching.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  keyPrefix: 'campfire:'
});

export class CacheManager {
  // Cache layers
  static layers = {
    L1: 'memory', // In-memory cache
    L2: 'redis', // Redis cache
    L3: 'database' // Database
  };

  // Cache strategies
  static strategies = {
    // Cache-aside pattern
    cacheAside: async (key: string, fetcher: () => Promise<any>, ttl: number = 3600) => {
      // Try Redis first
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from database
      const data = await fetcher();
      
      // Cache in Redis
      await redis.setex(key, ttl, JSON.stringify(data));
      
      return data;
    },

    // Write-through cache
    writeThrough: async (key: string, data: any, ttl: number = 3600) => {
      // Write to database
      await db.query('UPDATE your_table SET data = $1 WHERE key = $2', [data, key]);
      
      // Write to cache
      await redis.setex(key, ttl, JSON.stringify(data));
    },

    // Cache invalidation
    invalidate: async (pattern: string) => {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    },

    // Cache warming
    warmCache: async () => {
      const criticalQueries = [
        { key: 'conversations:active', query: 'SELECT * FROM conversations WHERE status = $1', params: ['active'] },
        { key: 'users:active', query: 'SELECT * FROM users WHERE last_seen > NOW() - INTERVAL $1', params: ['1 day'] },
        { key: 'organizations:list', query: 'SELECT * FROM organizations ORDER BY created_at DESC' }
      ];

      for (const { key, query, params = [] } of criticalQueries) {
        const result = await db.query(query, params);
        await redis.setex(key, 3600, JSON.stringify(result.rows));
      }
    }
  };

  // Cache keys structure
  static keys = {
    conversation: (id: string) => `conversation:${id}`,
    user: (id: string) => `user:${id}`,
    organization: (id: string) => `org:${id}`,
    conversationsList: (orgId: string, status: string) => `conversations:${orgId}:${status}`,
    analytics: (period: string) => `analytics:${period}`,
    search: (query: string) => `search:${Buffer.from(query).toString('base64')}`
  };

  // Cache metrics
  static metrics = {
    async getCacheStats() {
      const info = await redis.info('stats');
      const stats = this.parseRedisInfo(info);
      
      return {
        hitRate: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses),
        memoryUsage: stats.used_memory_human,
        connectedClients: stats.connected_clients,
        totalCommands: stats.total_commands_processed
      };
    },

    async getKeyStats(pattern: string) {
      const keys = await redis.keys(pattern);
      const pipeline = redis.pipeline();
      
      keys.forEach(key => {
        pipeline.ttl(key);
        pipeline.memory('usage', key);
      });
      
      const results = await pipeline.exec();
      
      return keys.map((key, index) => ({
        key,
        ttl: results[index * 2][1],
        memory: results[index * 2 + 1][1]
      }));
    }
  };

  private static parseRedisInfo(info: string) {
    const lines = info.split('\r\n');
    const stats: any = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });
    
    return stats;
  }
}
```

## 🌐 NETWORK OPTIMIZATION

### CDN & Edge Configuration
```typescript
// vercel.json - Edge optimization
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400"
        }
      ]
    },
    {
      "source": "/conversations",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "private, no-cache, no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/conversations",
      "destination": "/api/conversations/index"
    }
  ],
  "functions": {
    "api/conversations/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Service Worker Configuration
```typescript
// public/sw.js - Service Worker for caching
const CACHE_NAME = 'campfire-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const db = await openDB('campfire-sync', 1, {
    upgrade(db) {
      db.createObjectStore('pending-messages', { keyPath: 'id' });
    }
  });

  const pendingMessages = await db.getAll('pending-messages');
  
  for (const message of pendingMessages) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      await db.delete('pending-messages', message.id);
    } catch (error) {
      console.error('Failed to sync message:', error);
    }
  }
}
```

## 📊 PERFORMANCE MONITORING

### Real User Monitoring (RUM)
```typescript
// lib/performance/rum.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const initWebVitals = () => {
  const reportWebVitals = (metric: any) => {
    // Send to analytics
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    });
  };

  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
};

// Performance observer for custom metrics
export const initPerformanceObserver = () => {
  if ('PerformanceObserver' in window) {
    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          console.warn('Slow resource:', entry.name, entry.duration);
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });

    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('Long task detected:', entry.duration);
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }
};

// Error tracking
export const initErrorTracking = () => {
  window.addEventListener('error', (event) => {
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: Date.now()
      })
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now()
      })
    });
  });
};
```

### API Performance Monitoring
```typescript
// lib/performance/api-monitoring.ts
import { NextRequest, NextResponse } from 'next/server';

export const withPerformanceMonitoring = (handler: Function) => {
  return async (req: NextRequest, res: NextResponse) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const result = await handler(req, res);
      
      const duration = Date.now() - start;
      
      // Log performance metrics
      await logApiMetrics({
        requestId,
        endpoint: req.url,
        method: req.method,
        duration,
        status: res.statusCode,
        userAgent: req.headers.get('user-agent'),
        ip: req.ip
      });

      // Add performance headers
      res.headers.set('X-Response-Time', `${duration}ms`);
      res.headers.set('X-Request-ID', requestId);

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      await logApiMetrics({
        requestId,
        endpoint: req.url,
        method: req.method,
        duration,
        status: 500,
        error: error.message,
        userAgent: req.headers.get('user-agent'),
        ip: req.ip
      });

      throw error;
    }
  };
};

// Database query performance
export const monitorDatabaseQueries = async (query: string, params: any[]) => {
  const start = Date.now();
  
  try {
    const result = await db.query(query, params);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      console.warn(`Slow query detected: ${duration}ms - ${query}`);
      
      await logSlowQuery({
        query,
        params,
        duration,
        timestamp: new Date()
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed after ${duration}ms:`, error);
    throw error;
  }
};
```

## 🧪 PERFORMANCE TESTING

### Load Testing Configuration
```typescript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Test conversation list
  const conversationsRes = http.get(`${baseUrl}/api/conversations?limit=20`);
  check(conversationsRes, {
    'conversations status is 200': (r) => r.status === 200,
    'conversations response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Test message sending
  const messagePayload = JSON.stringify({
    conversationId: 'test-conv-123',
    content: 'Load test message',
    senderType: 'user'
  });
  
  const messageRes = http.post(`${baseUrl}/api/messages`, messagePayload, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  check(messageRes, {
    'message sent successfully': (r) => r.status === 201,
    'message response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}

// Stress test
export const stressOptions = {
  stages: [
    { duration: '5m', target: 1000 }, // Stress test
    { duration: '10m', target: 1000 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};
```

### Lighthouse CI Configuration
```yaml
# .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/conversations',
        'http://localhost:3000/widget-demo'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```
