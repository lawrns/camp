/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved to serverExternalPackages
  serverExternalPackages: ['@supabase/supabase-js', 'openai', '@anthropic-ai/sdk', 'stripe'],
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com'
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ];
  },
  
  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health'
      }
    ];
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add custom webpack configurations here
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false
    };
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true
  },
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
    dirs: ['app', 'components', 'lib', 'hooks']
  },
  
  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // React strict mode
  reactStrictMode: true,
  
  // SWC minification is now default in Next.js 15
  
  // Trailing slash
  trailingSlash: false,
  
  // Generate build ID
  generateBuildId: async () => {
    // You can, for example, get the latest git commit hash here
    return 'campfire-v2-build';
  },
  
  // Custom page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  }
};

module.exports = nextConfig;