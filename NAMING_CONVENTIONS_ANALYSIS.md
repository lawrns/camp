# NAMING CONVENTIONS ANALYSIS - CAMPFIRE V2

**Date:** 2025-01-27  
**Status:** Comprehensive Deep Dive Analysis  
**Scope:** Database Schema, API Endpoints, Components, Hooks, Real-time Systems

---

## 🚨 CRITICAL MISALIGNMENTS FOUND

### 1. **Database vs API Field Naming Mismatches**

#### Conversations Table
| Database Schema | API Implementation | Issue |
|----------------|-------------------|-------|
| `organizationId` (camelCase) | `organization_id` (snake_case) | ❌ **MISMATCH** |
| `customerEmail` (camelCase) | `customer_email` (snake_case) | ❌ **MISMATCH** |
| `customerDisplayName` (camelCase) | `customer_name` (snake_case) | ❌ **MISMATCH** |
| `assignedToId` (camelCase) | `assignee_id` (snake_case) | ❌ **MISMATCH** |
| `lastReplyAt` (camelCase) | `updated_at` (snake_case) | ❌ **MISMATCH** |

#### Messages Table
| Database Schema | API Implementation | Issue |
|----------------|-------------------|-------|
| `organizationId` (camelCase) | `organization_id` (snake_case) | ❌ **MISMATCH** |
| `conversationId` (camelCase) | `conversation_id` (snake_case) | ❌ **MISMATCH** |
| `senderEmail` (camelCase) | `sender_email` (snake_case) | ❌ **MISMATCH** |
| `senderType` (camelCase) | `sender_type` (snake_case) | ❌ **MISMATCH** |

#### Tickets Table
| Database Schema | API Implementation | Issue |
|----------------|-------------------|-------|
| `ticketNumber` (camelCase) | Not used in API | ❌ **MISSING** |
| `conversationId` (camelCase) | `conversation_id` (snake_case) | ❌ **MISMATCH** |
| `assigneeId` (camelCase) | `assignee_id` (snake_case) | ❌ **MISMATCH** |
| `customerId` (camelCase) | `customer_id` (snake_case) | ❌ **MISMATCH** |

### 2. **API Response Format Inconsistencies**

#### Existing API Pattern (dashboard/metrics)
```typescript
// ✅ CORRECT - Returns direct data
return NextResponse.json(metrics);
```

#### New API Pattern (conversations, tickets)
```typescript
// ❌ INCONSISTENT - Wraps in object
return NextResponse.json({ conversations });
return NextResponse.json({ tickets });
```

### 3. **Authentication Context Naming Mismatches**

#### Database Schema
```typescript
// ✅ CORRECT - camelCase
organizationId: uuid("organization_id").notNull()
```

#### API Implementation
```typescript
// ❌ INCONSISTENT - Uses snake_case in queries
.eq('organization_id', organizationId)
```

#### Auth Context
```typescript
// ✅ CORRECT - camelCase
organizationId: session.user.user_metadata?.organization_id
```

### 4. **Real-time System Naming Inconsistencies**

#### Channel Naming
```typescript
// ✅ CORRECT - Standardized patterns
ORGANIZATION: (orgId: string) => `org:${orgId}`,
CONVERSATION: (orgId: string, convId: string) => `org:${orgId}:conversation:${convId}`,
```

#### Event Types
```typescript
// ✅ CORRECT - snake_case for events
MESSAGE_CREATED: 'message_created',
CONVERSATION_UPDATED: 'conversation_updated',
```

### 5. **Component Prop Naming Inconsistencies**

#### Database Schema
```typescript
// ✅ CORRECT - camelCase
customerEmail: nativeEncryptedField("customer_email"),
customerDisplayName: text(),
```

#### Component Props
```typescript
// ❌ INCONSISTENT - Mixed naming
interface KnowledgeBaseDashboardProps {
  organizationId: string; // ✅ camelCase
  className?: string;     // ✅ camelCase
}
```

---

## ✅ ESTABLISHED CONVENTIONS (CORRECT)

### 1. **Database Schema Conventions**
- **Table Names**: snake_case (`conversations`, `messages`, `tickets`)
- **Column Names**: camelCase (`organizationId`, `customerEmail`, `senderType`)
- **Foreign Keys**: camelCase with `Id` suffix (`conversationId`, `assigneeId`)
- **Timestamps**: camelCase (`createdAt`, `updatedAt`, `lastReplyAt`)

### 2. **API Route Conventions**
- **Route Paths**: kebab-case (`/api/dashboard/metrics`, `/api/conversations`)
- **HTTP Methods**: UPPER_CASE (`GET`, `POST`, `PUT`, `DELETE`)
- **Query Parameters**: camelCase (`organizationId`, `conversationId`)

### 3. **Component Conventions**
- **Component Names**: PascalCase (`WelcomeDashboard`, `KnowledgeBaseDashboard`)
- **Prop Names**: camelCase (`organizationId`, `className`)
- **File Names**: PascalCase or kebab-case (`WelcomeDashboard.tsx`, `knowledge-base.tsx`)

### 4. **Hook Conventions**
- **Hook Names**: camelCase with `use` prefix (`useAuth`, `useRealtime`)
- **Return Values**: camelCase (`isConnected`, `lastActivity`)

### 5. **Real-time Conventions**
- **Channel Names**: kebab-case with prefixes (`org:${orgId}:conversation:${convId}`)
- **Event Types**: snake_case (`message_created`, `conversation_updated`)

---

## 🔧 REQUIRED FIXES

### 1. **API Endpoint Fixes**

#### Conversations API
```typescript
// ❌ CURRENT - Inconsistent field names
.insert({
  organization_id: organizationId,  // Should be organizationId
  customer_email: customerEmail,    // Should be customerEmail
  customer_name: customerName,      // Should be customerDisplayName
  created_by: session.user.id       // Should be createdBy
})

// ✅ FIXED - Consistent with database schema
.insert({
  organizationId: organizationId,
  customerEmail: customerEmail,
  customerDisplayName: customerName,
  createdBy: session.user.id
})
```

#### Tickets API
```typescript
// ❌ CURRENT - Inconsistent field names
.insert({
  organization_id: organizationId,  // Should be organizationId
  title: title,
  description: description,
  priority: priority,
  customer_email: customerEmail,    // Should be customerEmail
  status: 'open',
  created_by: session.user.id       // Should be createdBy
})

// ✅ FIXED - Consistent with database schema
.insert({
  organizationId: organizationId,
  title: title,
  description: description,
  priority: priority,
  customerEmail: customerEmail,
  status: 'open',
  createdBy: session.user.id
})
```

### 2. **Query Fixes**

#### Database Queries
```typescript
// ❌ CURRENT - snake_case in queries
.eq('organization_id', organizationId)
.eq('conversation_id', conversationId)
.eq('sender_type', senderType)

// ✅ FIXED - camelCase to match schema
.eq('organizationId', organizationId)
.eq('conversationId', conversationId)
.eq('senderType', senderType)
```

### 3. **Response Format Standardization**

#### All APIs Should Return Direct Data
```typescript
// ❌ INCONSISTENT - Wrapped responses
return NextResponse.json({ conversations });
return NextResponse.json({ tickets });

// ✅ CONSISTENT - Direct data
return NextResponse.json(conversations);
return NextResponse.json(tickets);
```

### 4. **Component Prop Alignment**

#### KnowledgeBaseDashboard
```typescript
// ❌ CURRENT - Missing required props
interface KnowledgeBaseDashboardProps {
  organizationId: string; // Required but not provided
}

// ✅ FIXED - Proper prop handling
interface KnowledgeBaseDashboardProps {
  organizationId?: string; // Optional with fallback
  className?: string;
}
```

---

## 📊 IMPACT ASSESSMENT

### High Impact Issues
1. **Database Query Failures** - Field name mismatches will cause 404/500 errors
2. **API Response Inconsistencies** - Frontend components expect different formats
3. **Authentication Context Mismatches** - Organization ID resolution failures

### Medium Impact Issues
1. **Component Prop Mismatches** - TypeScript errors and runtime failures
2. **Real-time Event Handling** - Inconsistent event naming

### Low Impact Issues
1. **File Naming Conventions** - Cosmetic but affects maintainability
2. **Comment Formatting** - Documentation consistency

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Critical Database Alignment (Immediate)
1. **Fix API field names** to match database schema camelCase
2. **Update database queries** to use correct field names
3. **Standardize API responses** to return direct data

### Phase 2: Component Alignment (High Priority)
1. **Fix component prop interfaces** to match database schema
2. **Update hook return types** for consistency
3. **Align real-time event handling** with established patterns

### Phase 3: Documentation & Standards (Medium Priority)
1. **Create naming convention documentation**
2. **Establish linting rules** for consistency
3. **Update TypeScript types** to enforce conventions

---

## 📝 CONCLUSION

The codebase has **significant naming convention misalignments** between:
- Database schema (camelCase) vs API implementation (snake_case)
- Established patterns vs new implementations
- Component expectations vs actual data structures

**Immediate Action Required:**
1. Fix API field names to match database schema
2. Standardize API response formats
3. Align component props with database schema
4. Update all database queries to use correct field names

**Root Cause:** New API implementations didn't follow established database schema conventions, creating a fragmented architecture that violates the single source of truth principle.

**Status:** Critical fixes needed before continuing implementation 