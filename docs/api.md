# 🔌 Campfire v2 API Documentation

## Overview

Campfire v2 provides a comprehensive REST API and real-time WebSocket API for integrating AI-powered customer support into your applications. The API is built with tRPC for type safety and includes comprehensive authentication, rate limiting, and monitoring.

## Authentication

### API Key Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.campfire.ai/v2/conversations
```

### JWT Authentication
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     https://api.campfire.ai/v2/conversations
```

## Base URLs

- **Production**: `https://api.campfire.ai/v2`
- **Staging**: `https://staging-api.campfire.ai/v2`
- **Development**: `http://localhost:3000/api/v2`

## Core Endpoints

### Conversations

#### Create Conversation
```http
POST /api/v2/conversations
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "customerId": "customer_123",
  "mailboxId": "mailbox_456",
  "subject": "Billing Question",
  "priority": "medium",
  "metadata": {
    "source": "widget",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/pricing"
  }
}
```

**Response:**
```json
{
  "id": "conv_789",
  "customerId": "customer_123",
  "mailboxId": "mailbox_456",
  "subject": "Billing Question",
  "status": "open",
  "priority": "medium",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "metadata": {
    "source": "widget",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/pricing"
  }
}
```

#### Get Conversation
```http
GET /api/v2/conversations/{conversationId}
Authorization: Bearer YOUR_API_KEY
```

#### List Conversations
```http
GET /api/v2/conversations?page=1&limit=50&status=open&priority=high
Authorization: Bearer YOUR_API_KEY
```

#### Update Conversation
```http
PATCH /api/v2/conversations/{conversationId}
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "status": "resolved",
  "priority": "low",
  "assignedAgentId": "agent_123"
}
```

### Messages

#### Send Message
```http
POST /api/v2/conversations/{conversationId}/messages
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "content": "Hello, I need help with my billing",
  "authorType": "customer",
  "authorId": "customer_123",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "widget"
  }
}
```

**Response:**
```json
{
  "id": "msg_456",
  "conversationId": "conv_789",
  "content": "Hello, I need help with my billing",
  "authorType": "customer",
  "authorId": "customer_123",
  "createdAt": "2024-01-15T10:30:00Z",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "widget"
  }
}
```

#### Get Messages
```http
GET /api/v2/conversations/{conversationId}/messages?page=1&limit=50
Authorization: Bearer YOUR_API_KEY
```

### AI Integration

#### Generate AI Response
```http
POST /api/v2/ai/generate-response
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "conversationId": "conv_789",
  "messageContent": "How do I update my billing information?",
  "context": {
    "customerTier": "premium",
    "previousInteractions": 3,
    "knowledgeBaseEnabled": true
  }
}
```

**Response:**
```json
{
  "content": "I'd be happy to help you update your billing information. You can do this by...",
  "confidence": 0.92,
  "sources": [
    {
      "title": "Billing FAQ",
      "url": "/docs/billing-faq",
      "relevance": 0.95
    }
  ],
  "shouldHandoff": false,
  "responseTime": 1.2,
  "model": "gpt-4"
}
```

#### Trigger Handoff
```http
POST /api/v2/conversations/{conversationId}/handoff
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "reason": "Customer requested human assistance",
  "priority": "medium",
  "requiredSkills": ["billing", "enterprise"],
  "context": {
    "customerInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "tier": "enterprise"
    },
    "issueType": "billing",
    "previousAttempts": 2
  }
}
```

### Analytics

#### Get Metrics
```http
GET /api/v2/analytics/metrics?period=7d&metrics=response_time,resolution_rate,satisfaction
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "period": "7d",
  "metrics": {
    "response_time": {
      "average": 1.8,
      "p95": 2.5,
      "trend": "improving"
    },
    "resolution_rate": {
      "ai_resolution": 0.87,
      "total_resolution": 0.94,
      "trend": "stable"
    },
    "satisfaction": {
      "average": 4.6,
      "total_responses": 1247,
      "trend": "improving"
    }
  }
}
```

## Real-time API (WebSocket)

### Connection
```javascript
const ws = new WebSocket('wss://api.campfire.ai/v2/realtime');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'YOUR_JWT_TOKEN'
}));
```

### Subscribe to Conversation
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'conversation:conv_789'
}));
```

### Message Events
```javascript
// New message
{
  "type": "message",
  "channel": "conversation:conv_789",
  "data": {
    "id": "msg_456",
    "content": "Hello, how can I help?",
    "authorType": "ai",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// Typing indicator
{
  "type": "typing",
  "channel": "conversation:conv_789",
  "data": {
    "authorId": "agent_123",
    "isTyping": true
  }
}

// Handoff event
{
  "type": "handoff",
  "channel": "conversation:conv_789",
  "data": {
    "status": "assigned",
    "agentId": "agent_123",
    "estimatedWaitTime": 30
  }
}
```

## Widget API

### Embed Widget
```html
<script>
  window.CampfireConfig = {
    apiKey: 'YOUR_API_KEY',
    mailboxId: 'mailbox_456',
    customerId: 'customer_123',
    theme: {
      primaryColor: '#3b82f6',
      position: 'bottom-right'
    }
  };
</script>
<script src="https://widget.campfire.ai/v2/widget.js"></script>
```

### Widget Events
```javascript
// Listen for widget events
window.Campfire.on('conversation:started', (data) => {
  console.log('Conversation started:', data.conversationId);
});

window.Campfire.on('message:received', (data) => {
  console.log('Message received:', data.content);
});

window.Campfire.on('handoff:requested', (data) => {
  console.log('Handoff requested:', data.reason);
});
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid conversation ID",
    "details": {
      "field": "conversationId",
      "value": "invalid_id",
      "expected": "Valid conversation ID"
    },
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_ERROR` (401): Invalid or missing API key
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request data
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

### Limits
- **API Requests**: 1000 requests/minute per API key
- **WebSocket Connections**: 100 concurrent connections per organization
- **Message Rate**: 60 messages/minute per conversation

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @campfire/sdk
```

```javascript
import { CampfireClient } from '@campfire/sdk';

const client = new CampfireClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.campfire.ai/v2'
});

// Create conversation
const conversation = await client.conversations.create({
  customerId: 'customer_123',
  subject: 'Support Request'
});

// Send message
const message = await client.messages.create(conversation.id, {
  content: 'Hello, I need help',
  authorType: 'customer'
});
```

### Python
```bash
pip install campfire-sdk
```

```python
from campfire import CampfireClient

client = CampfireClient(api_key='YOUR_API_KEY')

# Create conversation
conversation = client.conversations.create(
    customer_id='customer_123',
    subject='Support Request'
)

# Send message
message = client.messages.create(
    conversation_id=conversation.id,
    content='Hello, I need help',
    author_type='customer'
)
```

## Webhooks

### Configuration
```http
POST /api/v2/webhooks
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "url": "https://your-app.com/webhooks/campfire",
  "events": ["conversation.created", "message.sent", "handoff.completed"],
  "secret": "your_webhook_secret"
}
```

### Event Payload
```json
{
  "id": "evt_123",
  "type": "conversation.created",
  "data": {
    "conversation": {
      "id": "conv_789",
      "customerId": "customer_123",
      "status": "open"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing

### Test API Key
Use `test_sk_123456789` for testing in development environment.

### Mock Responses
Enable mock mode by adding `X-Campfire-Mock: true` header to requests.

---

For more information, visit our [Developer Portal](https://developers.campfire.ai) or contact our API support team at api-support@campfire.ai.
