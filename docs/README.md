# 🔥 Campfire v2 - AI-Powered Customer Support Platform

## Overview

Campfire v2 is an enterprise-grade AI customer support platform that delivers human-like interactions with seamless AI-to-human handoffs. Built with Next.js 15, TypeScript, and cutting-edge AI technologies, it provides 70%+ autonomous resolution rates while maintaining the personal touch customers expect.

## 🎯 Key Features

### AI-Powered Support
- **Multi-Model AI Routing**: Intelligent routing between GPT-4, Claude, and other models
- **RAG Integration**: Vector-based knowledge retrieval for accurate, contextual responses
- **Confidence Scoring**: Automatic handoff when AI confidence drops below threshold
- **Human-like Responses**: Natural language processing with empathy and personality

### Real-time Communication
- **WebSocket Integration**: Sub-100ms real-time messaging
- **Typing Indicators**: Live typing status for both AI and human agents
- **Presence Management**: Online/offline status tracking
- **Message Threading**: Organized conversation flows

### Seamless Handoffs
- **Context Preservation**: Full conversation history and customer data transfer
- **Queue Management**: Intelligent agent assignment based on skills and availability
- **Priority Routing**: Urgent issues get immediate human attention
- **Handoff Analytics**: Track handoff success rates and reasons

### Enterprise Features
- **Multi-tenant Architecture**: Complete organization isolation
- **Role-based Access Control**: Admin, Agent, and Viewer permissions
- **Comprehensive Analytics**: Real-time metrics and performance dashboards
- **Security & Compliance**: SOX, GDPR, HIPAA ready with audit logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/campfire-v2.git
cd campfire-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Environment Configuration

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Redis (for caching)
REDIS_URL=your_redis_url
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.4.4, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM with type-safe queries
- **AI**: OpenAI GPT-4, Anthropic Claude, custom RAG
- **Real-time**: Supabase Realtime, WebSockets
- **State Management**: Zustand, React Query
- **Testing**: Jest, Cypress, Playwright
- **Deployment**: Vercel, Docker support

### Key Components

```
campfire-v2/
├── app/                    # Next.js 15 App Router
├── components/             # React components
│   ├── ai/                # AI-specific components
│   ├── chat/              # Chat interface
│   ├── widget/            # Embeddable widget
│   └── ui/                # Design system components
├── lib/                   # Core libraries
│   ├── ai/                # AI services and routing
│   ├── realtime/          # Real-time communication
│   ├── security/          # Security and compliance
│   └── utils/             # Utility functions
├── db/                    # Database schema and migrations
├── tests/                 # Comprehensive test suite
└── docs/                  # Documentation
```

## 🧪 Testing

### Test Coverage
- **Unit Tests**: >90% code coverage with Jest
- **Integration Tests**: API and database testing
- **E2E Tests**: Critical user flows with Cypress
- **Performance Tests**: Load and stress testing
- **Visual Tests**: Regression testing with Playwright

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run visual regression tests
npm run test:visual
```

## 🎨 Design System

### Token Alignment
Campfire v2 features a bulletproof design system with centralized tokens:

```css
/* CSS Variables */
:root {
  --ds-spacing-4: 1rem;
  --ds-radius-lg: 0.5rem;
  --ds-color-primary: #3b82f6;
}
```

```jsx
/* Tailwind Utilities */
<div className="p-ds-4 rounded-ds-lg bg-primary">
  Consistent design tokens
</div>
```

### Validation
- **Automated Linting**: ESLint rules prevent invalid token usage
- **Token Validation Script**: `npm run tokens:validate`
- **Regression Prevention**: Comprehensive test suite

## 📊 Performance Targets

### Response Times
- **AI Responses**: <2 seconds (target: 1.5s)
- **Real-time Latency**: <100ms (target: 50ms)
- **Page Load**: <3 seconds
- **Widget Load**: <1 second

### Scalability
- **Concurrent Users**: 1000+ supported
- **Messages/Hour**: 10,000+ throughput
- **Uptime**: 99.9% target
- **Error Rate**: <0.1%

### Quality Metrics
- **AI Resolution Rate**: >85% (target: 90%)
- **Customer Satisfaction**: >90% (target: 95%)
- **Handoff Success**: >95% (target: 98%)
- **Context Preservation**: 100%

## 🔒 Security

### Security Features
- **Data Encryption**: End-to-end encryption
- **Authentication**: Multi-factor authentication
- **Authorization**: Role-based access control
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: API protection
- **CSP/SRI**: Content security policies

### Compliance
- **SOX**: Financial data protection
- **GDPR**: EU privacy compliance
- **HIPAA**: Healthcare data security
- **SOC 2**: Security controls

## 🚀 Deployment

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Docker deployment
docker build -t campfire-v2 .
docker run -p 3000:3000 campfire-v2
```

### Environment Setup
- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.campfire.ai`
- **Production**: `https://app.campfire.ai`

## 📈 Monitoring

### Analytics
- **Real-time Metrics**: Live dashboard updates
- **Performance Monitoring**: Response time tracking
- **Error Tracking**: Sentry integration
- **User Analytics**: PostHog integration

### Alerts
- **Performance Degradation**: >2s response times
- **Error Rate Spikes**: >1% error rate
- **Downtime**: Service unavailability
- **Security Events**: Suspicious activity

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Zero warnings policy
- **Prettier**: Automatic formatting
- **Testing**: >90% coverage required
- **Documentation**: Comprehensive inline docs

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Component Library](./docs/components.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guide](./docs/security.md)
- [Testing Guide](./docs/testing.md)
- [Design System](./docs/design-system.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.campfire.ai](https://docs.campfire.ai)
- **Community**: [Discord](https://discord.gg/campfire)
- **Issues**: [GitHub Issues](https://github.com/your-org/campfire-v2/issues)
- **Email**: support@campfire.ai

---

Built with ❤️ by the Campfire team. Transforming customer support with AI that feels human.
