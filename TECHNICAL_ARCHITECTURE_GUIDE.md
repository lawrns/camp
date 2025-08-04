# 🏗️ Campfire v2 - Technical Architecture Guide

## 📋 System Overview

Campfire v2 is a modern, real-time customer support platform built with:
- **Frontend**: Next.js 14 + React + TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **State Management**: Zustand stores
- **Styling**: Tailwind CSS + Custom Design System
- **Real-time**: Supabase Realtime WebSockets

## 🔧 Key Architectural Decisions

### 1. Real-time Communication Strategy
```typescript
// Unified channel naming convention
org:{orgId}:conv:{convId}        // Conversation messages
org:{orgId}:agents:presence      // Agent presence
org:{orgId}:typing:{convId}      // Typing indicators
```

### 2. State Management Architecture
```
📁 store/
├── domains/
│   ├── messages/           # Message state and optimistic updates
│   ├── conversations/      # Conversation management
│   ├── realtime/          # Real-time subscriptions and presence
│   └── analytics/         # Dashboard metrics and insights
└── unified-campfire-store.ts  # Global state orchestration
```

### 3. Database Schema Optimization
```sql
-- Key tables and relationships
conversations (id, customer_name, customer_email, status, organization_id)
messages (id, conversation_id, content, sender_type, created_at)
profiles (user_id, organization_id, full_name, is_online, last_seen_at)
read_receipts (message_id, user_id, read_at)
```

## 🚀 Performance Optimizations

### 1. Message Deduplication System
```typescript
// Three-layer deduplication in messages-store.ts
1. Exact ID matching prevention
2. Optimistic message replacement logic
3. Content-based duplicate detection (2s window)
```

### 2. Real-time Connection Management
```typescript
// Enhanced connection reliability
- Auth validation before channel creation
- Exponential backoff: baseDelay * 2^attempt
- Heartbeat interval: 25s (prevents timeouts)
- Auto-reconnection with progressive delays
```

### 3. Database Query Optimization
```typescript
// Analytics data aggregator improvements
- Real Supabase queries replacing mock data
- Proper error handling and fallbacks
- Efficient conversation metrics calculation
- Channel distribution with live data
```

## 🔐 Security Implementation

### 1. Authentication Flow
```typescript
// Multi-layer auth approach
1. Supabase Auth (JWT tokens)
2. Row Level Security (RLS) policies
3. API route protection with createRouteHandlerClient
4. Real-time auth with supabase.realtime.setAuth()
```

### 2. API Security
```typescript
// Agent availability API example
- Authorization header support: Bearer {token}
- Session validation before data access
- Organization-scoped data queries
- Proper error handling without data leaks
```

## 📊 Real-time Features

### 1. Typing Indicators
```typescript
// Implementation in MessagePanel.tsx
- Real-time typing status broadcasting
- Store integration with typing state management
- Automatic timeout (1 second)
- Multi-user typing support
```

### 2. Presence System
```typescript
// User presence tracking
- Database-backed online status (profiles.is_online)
- Real-time presence updates via WebSocket
- Last seen timestamp tracking
- Automatic presence cleanup on disconnect
```

### 3. Message Delivery Status
```typescript
// Delivery tracking pipeline
1. Optimistic message (temp ID)
2. API call with real message creation
3. Delivery status update (sent → delivered)
4. Read receipt tracking via API
5. Real-time status broadcasting
```

## 🎨 UI/UX Enhancements

### 1. Conversation Display
```typescript
// Enhanced ConversationRow.tsx
- Customer avatar with online status indicator
- Tags display with overflow handling (max 2 + count)
- Priority and status badges
- Real-time last message updates
```

### 2. Message Interface
```typescript
// MessagePanel.tsx improvements
- Enhanced typing indicator display
- Message status icons (sending/sent/delivered/read)
- Real-time message updates
- Optimistic UI with proper fallbacks
```

## 🔄 Data Flow Architecture

### 1. Message Sending Flow
```
User Input → Optimistic Update → API Call → Real Message → 
WebSocket Broadcast → Store Update → UI Refresh
```

### 2. Real-time Updates Flow
```
Database Change → Supabase Realtime → WebSocket Event → 
Store Action → Component Re-render → UI Update
```

### 3. Analytics Data Flow
```
Database Queries → Data Aggregator → Store State → 
Dashboard Components → Real-time Metrics Display
```

## 🧪 Testing Strategy

### 1. Unit Tests
```typescript
// Key test files created
- useMessages.test.ts (sender_type consistency)
- Message deduplication logic tests
- Real-time subscription tests
- Analytics calculation tests
```

### 2. Integration Tests
```typescript
// End-to-end scenarios
- Widget ↔ Dashboard bidirectional communication
- Agent handoff flows with real API calls
- Real-time typing and presence updates
- Message delivery and read receipts
```

### 3. Performance Tests
```typescript
// Load testing targets
- 10k+ concurrent WebSocket connections
- <100ms API response times
- <50ms real-time message latency
- Memory usage under sustained load
```

## 🔧 Development Workflow

### 1. Code Standards
```typescript
// Enforced patterns
- TypeScript strict mode
- Consistent hook naming (useAIState vs useAIMode)
- Proper error handling with try/catch
- Real-time subscription cleanup
```

### 2. Database Migrations
```sql
-- Schema changes approach
1. Add new columns with defaults
2. Update application code
3. Migrate existing data
4. Remove old columns (if needed)
```

### 3. Deployment Process
```bash
# Recommended deployment steps
1. npm run build          # Verify compilation
2. npm run test           # Run test suite
3. npm run lint           # Code quality check
4. Deploy to staging      # Integration testing
5. Deploy to production   # Blue-green deployment
```

## 📈 Monitoring & Observability

### 1. Key Metrics to Track
```typescript
// Performance metrics
- WebSocket connection success rate
- Message delivery latency
- API response times
- Database query performance
- Memory usage and garbage collection
```

### 2. Error Tracking
```typescript
// Critical errors to monitor
- Real-time connection failures
- Message sending failures
- Authentication errors
- Database query timeouts
- Memory leaks in long-running sessions
```

### 3. Business Metrics
```typescript
// User experience metrics
- Agent response times
- Customer satisfaction scores
- Conversation resolution rates
- Feature usage analytics
- User engagement patterns
```

## 🔮 Future Architecture Considerations

### 1. Scaling Strategy
```typescript
// Horizontal scaling approach
- Database read replicas for analytics
- Redis for session management
- CDN for static assets
- Load balancing for API endpoints
```

### 2. Microservices Migration
```typescript
// Potential service boundaries
- Authentication service
- Message processing service
- Analytics service
- Notification service
- File upload service
```

### 3. AI/ML Integration Points
```typescript
// ML enhancement opportunities
- Intelligent message routing
- Sentiment analysis pipeline
- Automated response suggestions
- Conversation summarization
- Predictive analytics
```

## 🎯 Performance Targets

### Production SLAs
- **Uptime**: 99.9% availability
- **Response Time**: <100ms API responses
- **Real-time Latency**: <50ms message delivery
- **Concurrent Users**: 10,000+ supported
- **Error Rate**: <0.1% of requests

### Scalability Goals
- **Messages/Second**: 10,000+ throughput
- **Database Connections**: 1,000+ concurrent
- **WebSocket Connections**: 10,000+ active
- **Storage**: Unlimited message history
- **Bandwidth**: Auto-scaling based on usage

---

**🏆 Campfire v2 represents a modern, scalable, and production-ready customer support platform that can compete with industry leaders while providing superior developer experience and customization capabilities.**
