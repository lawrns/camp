# DEPLOYMENT & DEVOPS COMPREHENSIVE GUIDE

## 🚀 DEPLOYMENT ARCHITECTURE

### Multi-Environment Setup
```
Deployment Pipeline:
├── Development (localhost:3000)
├── Staging (staging.campfire.dev)
├── Production (campfire.dev)
└── Preview Deployments (PR-based)
```

### Infrastructure Overview
```
Production Stack:
├── Vercel (Frontend + API Routes)
├── Supabase (Database + Auth + Storage)
├── Inngest (Background Jobs)
├── Cloudflare (CDN + DNS)
├── Sentry (Error Monitoring)
├── Datadog (Performance Monitoring)
└── GitHub Actions (CI/CD)
```

## 📦 BUILD & DEPLOYMENT PROCESS

### Build Configuration
```javascript
// next.config.js - Production optimization
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  headers: async () => [
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
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' https://api.supabase.io wss://realtime.supabase.io"
          ].join('; ')
        }
      ]
    }
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
```

### Environment Configuration
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-signing-key
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 🔄 CI/CD PIPELINE

### GitHub Actions - Main Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  database-migration:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy database migrations
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}

  post-deploy:
    needs: [deploy, database-migration]
    runs-on: ubuntu-latest
    steps:
      - name: Run health checks
        run: |
          curl -f https://campfire.dev/api/health || exit 1
          curl -f https://campfire.dev/api/health/deep || exit 1
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment completed successfully!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Staging Deployment
```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main, develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}
          vercel-args: '--prod'
```

## 🐳 CONTAINERIZATION

### Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: campfire
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  redis_data:
  postgres_data:
```

## 📊 MONITORING & OBSERVABILITY

### Sentry Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event, hint) {
    // Filter out specific errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    return event;
  }
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

### Health Check Endpoints
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

export async function GET() {
  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);

    if (dbError) throw new Error('Database connection failed');

    // Check Redis connectivity
    await redis.ping();

    // Check external services
    const checks = await Promise.allSettled([
      checkInngestHealth(),
      checkOpenAIHealth(),
      checkStripeHealth()
    ]);

    const failedChecks = checks.filter(result => result.status === 'rejected');
    
    if (failedChecks.length > 0) {
      return NextResponse.json(
        { 
          status: 'degraded',
          timestamp: new Date().toISOString(),
          checks: {
            database: 'healthy',
            redis: 'healthy',
            external: failedChecks.length
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

async function checkInngestHealth() {
  const response = await fetch('https://api.inngest.com/health');
  if (!response.ok) throw new Error('Inngest health check failed');
}

async function checkOpenAIHealth() {
  const response = await fetch('https://api.openai.com/v1/models');
  if (!response.ok) throw new Error('OpenAI health check failed');
}

async function checkStripeHealth() {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  await stripe.customers.list({ limit: 1 });
}
```

### Logging Configuration
```typescript
// lib/logging/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'campfire-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.simple()
        })] 
      : [])
  ]
});

export default logger;
```

## 🚨 ALERTING & INCIDENT RESPONSE

### Alert Rules
```yaml
# alerting/rules.yml
groups:
  - name: campfire-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "Cannot connect to database"

      - alert: RedisConnectionFailure
        expr: up{job="redis-exporter"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection failure"
          description: "Cannot connect to Redis"
```

### Incident Response Playbook
```markdown
# Incident Response Playbook

## Severity Levels
- **P0**: Complete service outage
- **P1**: Critical functionality broken
- **P2**: Degraded performance
- **P3**: Minor issues

## Response Steps
1. **Detection** (0-2 minutes)
   - Monitor alerts from Sentry, Datadog, Pingdom
   - Check #incidents Slack channel

2. **Assessment** (2-5 minutes)
   - Run health checks
   - Check error rates and response times
   - Identify affected components

3. **Communication** (5-10 minutes)
   - Post incident in #incidents
   - Update status page
   - Notify stakeholders

4. **Resolution** (variable)
   - Apply hotfixes if available
   - Rollback if necessary
   - Coordinate with team

5. **Post-Incident** (after resolution)
   - Write incident report
   - Schedule post-mortem
   - Update runbooks
```

## 🔄 ROLLBACK STRATEGIES

### Vercel Rollback
```bash
#!/bin/bash
# scripts/rollback.sh

# Get last successful deployment
LAST_SUCCESSFUL=$(vercel ls --prod --limit 1 --json | jq -r '.[0].uid')

# Rollback to previous deployment
vercel rollback $LAST_SUCCESSFUL --prod --token=$VERCEL_TOKEN

# Verify rollback
curl -f https://campfire.dev/api/health || exit 1

echo "Rollback completed successfully"
```

### Database Rollback
```typescript
// scripts/rollback-database.ts
import { createClient } from '@supabase/supabase-js';

async function rollbackDatabase(targetVersion: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get current migration version
  const { data: currentVersion } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  console.log(`Current version: ${currentVersion?.version}`);
  console.log(`Target version: ${targetVersion}`);

  // Execute rollback
  await supabase.rpc('rollback_to_version', { target_version: targetVersion });
  
  console.log('Database rollback completed');
}

rollbackDatabase(process.argv[2]);
```
