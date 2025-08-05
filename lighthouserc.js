/**
 * Lighthouse CI Configuration for Campfire V2
 * 
 * Comprehensive performance testing with:
 * - Core Web Vitals monitoring
 * - Performance budgets
 * - Accessibility audits
 * - SEO optimization
 * - Progressive Web App features
 * - Custom assertions
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3001', // Homepage
        'http://localhost:3001/widget?org=b5e80170-004c-4e82-a88c-3e2166b169dd', // Widget
        'http://localhost:3001/dashboard/login', // Login page
        'http://localhost:3001/dashboard/inbox', // Dashboard
      ],
      
      // Collection settings
      numberOfRuns: 3, // Run multiple times for consistency
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      
      // Chrome settings
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--headless',
        ],
        
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        
        // Device emulation
        emulatedFormFactor: 'mobile',
        
        // Skip certain audits that aren't relevant
        skipAudits: [
          'canonical', // Not applicable for widget
          'robots-txt', // Not applicable for widget
        ],
        
        // Only run specific categories
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
    },
    
    assert: {
      // Performance assertions
      assertions: {
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'total-blocking-time': ['error', { maxNumericValue: 300 }], // 300ms
        'speed-index': ['error', { maxNumericValue: 3400 }], // 3.4s
        
        // Performance metrics
        'interactive': ['error', { maxNumericValue: 3800 }], // 3.8s
        'max-potential-fid': ['error', { maxNumericValue: 130 }], // 130ms
        'server-response-time': ['error', { maxNumericValue: 600 }], // 600ms
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 20000 }], // 20KB
        'unused-css-rules': ['warn', { maxNumericValue: 10000 }], // 10KB
        'unminified-css': ['error', { maxNumericValue: 0 }],
        'unminified-javascript': ['error', { maxNumericValue: 0 }],
        
        // Image optimization
        'modern-image-formats': ['warn', { maxNumericValue: 0 }],
        'uses-optimized-images': ['warn', { maxNumericValue: 0 }],
        'uses-responsive-images': ['warn', { maxNumericValue: 0 }],
        
        // Caching
        'uses-long-cache-ttl': ['warn', { maxNumericValue: 0 }],
        'efficient-animated-content': ['warn', { maxNumericValue: 0 }],
        
        // Network
        'uses-http2': ['warn', { maxNumericValue: 0 }],
        'uses-text-compression': ['error', { maxNumericValue: 0 }],
        
        // Accessibility
        'color-contrast': ['error', { maxNumericValue: 0 }],
        'heading-order': ['error', { maxNumericValue: 0 }],
        'label': ['error', { maxNumericValue: 0 }],
        'link-name': ['error', { maxNumericValue: 0 }],
        'button-name': ['error', { maxNumericValue: 0 }],
        
        // Best practices
        'uses-https': ['error', { maxNumericValue: 0 }],
        'no-vulnerable-libraries': ['error', { maxNumericValue: 0 }],
        'csp-xss': ['warn', { maxNumericValue: 0 }],
        
        // SEO (for public pages)
        'meta-description': ['warn', { maxNumericValue: 0 }],
        'document-title': ['error', { maxNumericValue: 0 }],
        'html-has-lang': ['error', { maxNumericValue: 0 }],
        
        // Category scores
        'categories:performance': ['error', { minScore: 0.9 }], // 90%
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95%
        'categories:best-practices': ['error', { minScore: 0.9 }], // 90%
        'categories:seo': ['warn', { minScore: 0.8 }], // 80%
      },
      
      // Preset configurations
      preset: 'lighthouse:recommended',
      
      // Include passed assertions in output
      includePassedAssertions: true,
    },
    
    upload: {
      // Upload results to Lighthouse CI server (if configured)
      target: 'temporary-public-storage',
      
      // GitHub integration
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      githubToken: process.env.GITHUB_TOKEN,
      
      // Custom server (if available)
      serverBaseUrl: process.env.LHCI_SERVER_BASE_URL,
      token: process.env.LHCI_SERVER_TOKEN,
    },
    
    server: {
      // Local server configuration (for development)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
    
    wizard: {
      // Configuration wizard settings
      skipGithubStatusCheck: true,
    },
  },
  
  // Custom configuration for different environments
  ...(process.env.CI && {
    ci: {
      collect: {
        // CI-specific settings
        numberOfRuns: 1, // Faster CI runs
        settings: {
          chromeFlags: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--headless',
            '--disable-web-security', // For CI environments
          ],
        },
      },
      
      assert: {
        // More lenient assertions for CI
        assertions: {
          'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // 3s
          'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2s
          'categories:performance': ['warn', { minScore: 0.8 }], // 80%
        },
      },
    },
  }),
  
  // Widget-specific configuration
  widget: {
    collect: {
      url: [
        'http://localhost:3001/widget?org=b5e80170-004c-4e82-a88c-3e2166b169dd',
      ],
      
      settings: {
        // Widget-specific settings
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150, // Slower network for widget testing
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },
        
        // Skip audits not relevant to widget
        skipAudits: [
          'canonical',
          'robots-txt',
          'meta-description',
          'structured-data',
        ],
      },
    },
    
    assert: {
      assertions: {
        // Widget-specific performance budgets
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }], // 2s
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }], // 1.5s
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }], // 0.05
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // 200ms
        
        // Widget bundle size
        'unused-javascript': ['error', { maxNumericValue: 10000 }], // 10KB
        'total-byte-weight': ['warn', { maxNumericValue: 250000 }], // 250KB
        
        // Widget accessibility
        'color-contrast': ['error', { maxNumericValue: 0 }],
        'keyboard': ['error', { maxNumericValue: 0 }],
        'focus-traps': ['error', { maxNumericValue: 0 }],
        
        // Widget performance
        'categories:performance': ['error', { minScore: 0.95 }], // 95%
        'categories:accessibility': ['error', { minScore: 0.98 }], // 98%
      },
    },
  },
  
  // Dashboard-specific configuration
  dashboard: {
    collect: {
      url: [
        'http://localhost:3001/dashboard/login',
        'http://localhost:3001/dashboard/inbox',
      ],
      
      settings: {
        // Desktop-focused testing
        emulatedFormFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    
    assert: {
      assertions: {
        // Dashboard performance budgets
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }], // 3s
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // 2s
        'interactive': ['error', { maxNumericValue: 4000 }], // 4s
        
        // Dashboard-specific audits
        'uses-rel-preconnect': ['warn', { maxNumericValue: 0 }],
        'uses-rel-preload': ['warn', { maxNumericValue: 0 }],
        'font-display': ['warn', { maxNumericValue: 0 }],
        
        // Security for dashboard
        'csp-xss': ['error', { maxNumericValue: 0 }],
        'no-vulnerable-libraries': ['error', { maxNumericValue: 0 }],
        
        // Dashboard scores
        'categories:performance': ['error', { minScore: 0.85 }], // 85%
        'categories:accessibility': ['error', { minScore: 0.95 }], // 95%
        'categories:best-practices': ['error', { minScore: 0.95 }], // 95%
      },
    },
  },
};
