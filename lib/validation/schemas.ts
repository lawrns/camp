/**
 * PHASE 1 CRITICAL FIX: Input Validation Schemas
 * 
 * Comprehensive Zod validation schemas for all API endpoints
 * identified as missing in god.md analysis (C003).
 * 
 * Features:
 * - Type-safe validation
 * - Sanitization of inputs
 * - Custom error messages
 * - Reusable schema components
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Base schemas for common types
 */
export const BaseSchemas = {
  uuid: z.string().regex(UUID_REGEX, 'Invalid UUID format'),
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format').max(254),
  organizationId: z.string().regex(UUID_REGEX, 'Invalid organization ID'),
  conversationId: z.string().regex(UUID_REGEX, 'Invalid conversation ID'),
  messageId: z.string().regex(UUID_REGEX, 'Invalid message ID'),
  userId: z.string().min(1, 'User ID required').max(100),
  visitorId: z.string().min(1, 'Visitor ID required').max(100),
  
  // Content validation
  messageContent: z.string()
    .min(1, 'Message content cannot be empty')
    .max(4000, 'Message content too long')
    .transform(content => content.trim()),
  
  customerName: z.string()
    .min(1, 'Customer name required')
    .max(100, 'Customer name too long')
    .transform(name => name.trim()),
  
  customerEmail: z.string()
    .regex(EMAIL_REGEX, 'Invalid email format')
    .max(254, 'Email too long')
    .transform(email => email.toLowerCase().trim()),
  
  // Enum validations
  senderType: z.enum(['visitor', 'agent', 'ai_assistant', 'customer'], {
    errorMap: () => ({ message: 'Invalid sender type' })
  }),
  
  messageStatus: z.enum(['pending', 'delivered', 'read', 'failed'], {
    errorMap: () => ({ message: 'Invalid message status' })
  }),
  
  // Metadata validation
  metadata: z.record(z.any()).optional().default({}),
  
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  
  // Timestamps
  timestamp: z.string().datetime().optional(),
  
  // Widget action types
  widgetAction: z.enum([
    'create-conversation',
    'send-message',
    'get-messages',
    'typing-indicator',
    'read-receipt'
  ], {
    errorMap: () => ({ message: 'Invalid widget action' })
  })
};

/**
 * Widget API Schemas
 */
export const WidgetSchemas = {
  // Create conversation request
  createConversation: z.object({
    action: z.literal('create-conversation'),
    providedVisitorId: BaseSchemas.visitorId.optional(),
    customerEmail: BaseSchemas.customerEmail.optional(),
    customerName: BaseSchemas.customerName.optional(),
    initialMessage: BaseSchemas.messageContent.optional(),
    metadata: BaseSchemas.metadata,
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    currentUrl: z.string().optional()
  }),

  // Send message request
  sendMessage: z.object({
    action: z.literal('send-message'),
    conversationId: BaseSchemas.conversationId,
    content: BaseSchemas.messageContent,
    senderEmail: BaseSchemas.customerEmail.optional(),
    senderName: BaseSchemas.customerName.optional(),
    senderType: BaseSchemas.senderType.default('customer'),
    metadata: BaseSchemas.metadata
  }),

  // Get messages request
  getMessages: z.object({
    action: z.literal('get-messages'),
    conversationId: BaseSchemas.conversationId,
    page: BaseSchemas.page,
    limit: BaseSchemas.limit,
    since: BaseSchemas.timestamp
  }),

  // Typing indicator request
  typingIndicator: z.object({
    action: z.literal('typing-indicator'),
    conversationId: BaseSchemas.conversationId,
    userId: BaseSchemas.userId,
    userName: BaseSchemas.customerName.optional(),
    isTyping: z.boolean()
  }),

  // Read receipt request
  readReceipt: z.object({
    action: z.literal('read-receipt'),
    messageId: BaseSchemas.messageId,
    conversationId: BaseSchemas.conversationId,
    status: BaseSchemas.messageStatus.default('read')
  }),

  // Widget session initialization
  sessionInit: z.object({
    organizationId: BaseSchemas.organizationId,
    visitorId: BaseSchemas.visitorId.optional(),
    metadata: BaseSchemas.metadata
  })
};

/**
 * Dashboard API Schemas
 */
export const DashboardSchemas = {
  // Get conversations
  getConversations: z.object({
    organizationId: BaseSchemas.organizationId,
    page: BaseSchemas.page,
    limit: BaseSchemas.limit,
    status: z.enum(['active', 'closed', 'pending']).optional(),
    assignedTo: BaseSchemas.userId.optional()
  }),

  // Update conversation
  updateConversation: z.object({
    conversationId: BaseSchemas.conversationId,
    status: z.enum(['active', 'closed', 'pending']).optional(),
    assignedTo: BaseSchemas.userId.optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    tags: z.array(z.string().max(50)).max(10).optional()
  }),

  // Agent message
  agentMessage: z.object({
    conversationId: BaseSchemas.conversationId,
    content: BaseSchemas.messageContent,
    agentId: BaseSchemas.userId,
    agentName: BaseSchemas.customerName,
    metadata: BaseSchemas.metadata
  })
};

/**
 * Authentication Schemas
 */
export const AuthSchemas = {
  // Login request
  login: z.object({
    email: BaseSchemas.email,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    organizationId: BaseSchemas.organizationId.optional()
  }),

  // Register request
  register: z.object({
    email: BaseSchemas.email,
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    name: BaseSchemas.customerName,
    organizationId: BaseSchemas.organizationId.optional()
  }),

  // Password reset
  passwordReset: z.object({
    email: BaseSchemas.email
  }),

  // Token validation
  tokenValidation: z.object({
    token: z.string().min(1, 'Token required'),
    organizationId: BaseSchemas.organizationId.optional()
  })
};

/**
 * File Upload Schemas
 */
export const FileSchemas = {
  upload: z.object({
    conversationId: BaseSchemas.conversationId,
    fileName: z.string().min(1).max(255),
    fileSize: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
    fileType: z.string().regex(/^[a-zA-Z0-9\/\-\+]+$/, 'Invalid file type'),
    metadata: BaseSchemas.metadata
  })
};

/**
 * Validation helper functions
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Middleware for request validation
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return async function validationMiddleware(
    request: NextRequest,
    handler: (validatedData: T) => Promise<NextResponse>
  ): Promise<NextResponse> {
    try {
      const body = await request.json();
      const validation = validateRequest(schema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: validation.errors
            }
          },
          { status: 400 }
        );
      }
      
      return handler(validation.data!);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body'
          }
        },
        { status: 400 }
      );
    }
  };
}

/**
 * Query parameter validation
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: boolean; data?: T; errors?: string[] } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return validateRequest(schema, params);
}
