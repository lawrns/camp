/**
 * Next.js Configuration for Widget Optimization
 * 
 * Optimizations:
 * - Bundle splitting for widget components
 * - Dynamic imports for edge deployment
 * - Compression and minification
 * - Tree shaking for unused code
 * - Code splitting by route and component
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for optimization
  experimental: {
    // Enable React Server Components
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    
    // Optimize bundle splitting
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@supabase/supabase-js',
      'zustand',
    ],
    
    // Enable edge runtime for widget endpoints
    runtime: 'edge',
  },

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Widget-specific optimizations
    if (!isServer) {
      // Split widget components into separate chunks
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          
          // Widget core chunk (<30KB target)
          widgetCore: {
            name: 'widget-core',
            test: /[\\/]components[\\/]widget[\\/]core[\\/]/,
            chunks: 'all',
            priority: 30,
            enforce: true,
            maxSize: 30000, // 30KB limit
          },
          
          // Widget features chunk (lazy loaded)
          widgetFeatures: {
            name: 'widget-features',
            test: /[\\/]components[\\/]widget[\\/]features[\\/]/,
            chunks: 'async',
            priority: 25,
            maxSize: 50000, // 50KB per feature chunk
          },
          
          // Widget performance chunk
          widgetPerformance: {
            name: 'widget-performance',
            test: /[\\/]components[\\/]widget[\\/]performance[\\/]/,
            chunks: 'async',
            priority: 20,
          },
          
          // Realtime chunk
          realtime: {
            name: 'realtime',
            test: /[\\/]lib[\\/]realtime[\\/]/,
            chunks: 'async',
            priority: 15,
          },
          
          // Supabase chunk
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            chunks: 'all',
            priority: 10,
          },
          
          // Framer Motion chunk (heavy animation library)
          framerMotion: {
            name: 'framer-motion',
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            chunks: 'async',
            priority: 8,
          },
          
          // Lucide icons chunk
          lucideIcons: {
            name: 'lucide-icons',
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            chunks: 'all',
            priority: 5,
            maxSize: 20000, // 20KB for icons
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Minimize bundle size
      config.optimization.minimize = true;
      
      // Add bundle size warnings
      config.performance = {
        hints: dev ? false : 'warning',
        maxAssetSize: 250000, // 250KB
        maxEntrypointSize: 250000, // 250KB
        assetFilter: (assetFilename) => {
          // Only warn for widget-related assets
          return assetFilename.includes('widget') || assetFilename.includes('chunk');
        },
      };
    }

    // Add webpack plugins for optimization
    config.plugins.push(
      // Analyze bundle composition
      new webpack.DefinePlugin({
        'process.env.BUNDLE_ANALYZE': JSON.stringify(process.env.ANALYZE === 'true'),
      })
    );

    return config;
  },

  // Compression
  compress: true,
  
  // Image optimization for widget performance
  images: {
    // Enable modern formats for better compression
    formats: ['image/avif', 'image/webp'],

    // Cache optimization
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    // Quality settings for different use cases
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Widget-specific domains for external images
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
      // Add your CDN domains here
    ],

    // Remote patterns for more flexible image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],

    // SVG support with security
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Loader configuration for custom CDN
    loader: 'default',
    path: '/_next/image',

    // Disable static imports for better bundle size
    disableStaticImages: false,

    // Unoptimized for development speed
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/widget/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for widget optimization
  async redirects() {
    return [
      // Redirect old widget paths to optimized versions
      {
        source: '/widget/legacy/:path*',
        destination: '/widget/:path*',
        permanent: true,
      },
    ];
  },

  // Rewrites for edge functions
  async rewrites() {
    return [
      {
        source: '/api/widget-edge/:path*',
        destination: '/api/widget/:path*',
      },
    ];
  },

  // Environment variables for optimization
  env: {
    WIDGET_BUNDLE_TARGET: '30000', // 30KB target for core widget
    ENABLE_WIDGET_PRELOAD: 'true',
    WIDGET_LAZY_LOAD_DELAY: '1000', // 1 second delay for lazy loading
  },

  // Output configuration for edge deployment
  output: 'standalone',
  
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Optimize fonts
  optimizeFonts: true,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    
    // Remove React DevTools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Transpile packages for better tree shaking
  transpilePackages: [
    '@supabase/supabase-js',
    'lucide-react',
  ],

  // Modularize imports for better tree shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },
};

// Bundle analyzer configuration
const analyzerConfig = {
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'server',
      analyzerPort: 8888,
    },
    client: {
      analyzerMode: 'static',
      reportFilename: '../bundle-analysis/client.html',
      openAnalyzer: false,
    },
  },
};

module.exports = withBundleAnalyzer({
  ...nextConfig,
  ...analyzerConfig,
});

// Export configuration for use in other files
module.exports.widgetOptimizationConfig = {
  bundleTargets: {
    core: 30000, // 30KB
    features: 50000, // 50KB per feature
    total: 250000, // 250KB total
  },
  
  lazyLoadingConfig: {
    delay: 1000, // 1 second
    preloadOnHover: true,
    preloadOnIdle: true,
  },
  
  compressionConfig: {
    gzip: true,
    brotli: true,
    level: 9,
  },
  
  cacheConfig: {
    staticAssets: 31536000, // 1 year
    dynamicContent: 3600, // 1 hour
  },
};
