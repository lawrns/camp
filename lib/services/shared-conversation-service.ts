/**
 * Shared Conversation Service
 * 
 * Ensures widget and dashboard use the same conversation IDs for proper bidirectional sync.
 * This service manages conversation creation, retrieval, and synchronization between
 * widget and dashboard contexts.
 */

import { createClient } from '@/lib/supabase/server';
import { supabase } from '@/lib/supabase/consolidated-exports';

export interface SharedConversationParams {
  organizationId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  visitorId?: string;
  source: 'widget' | 'dashboard' | 'api';
  metadata?: Record<string, any>;
}

export interface SharedConversation {
  id: string;
  organizationId: string;
  customerEmail: string | null;
  customerName: string | null;
  status: string;
  priority: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates or retrieves a shared conversation that can be used by both widget and dashboard
 */
export async function createOrGetSharedConversation(
  params: SharedConversationParams
): Promise<SharedConversation> {
  const { organizationId, customerEmail, customerName, visitorId, source, metadata = {} } = params;

  // Use service role client to bypass RLS
  const supabaseClient = supabase.admin();

  // Simple conversation lookup logic
  let existingConversation = null;

  if (customerEmail) {
    // Look for existing conversation by customer email
    const { data: emailConversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_email', customerEmail)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    existingConversation = emailConversation;
  } else if (visitorId) {
    // Look for existing conversation by visitor ID
    const { data: visitorConversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('visitor_id', visitorId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    existingConversation = visitorConversation;
  }

  // If we found an existing conversation, return it
  if (existingConversation) {
    return {
      id: existingConversation.id,
      organizationId: existingConversation.organization_id,
      customerEmail: existingConversation.customer_email,
      customerName: existingConversation.customer_name,
      status: existingConversation.status,
      priority: existingConversation.priority || 'medium',
      metadata: existingConversation.metadata || {},
      createdAt: existingConversation.created_at,
      updatedAt: existingConversation.updated_at,
    };
  }

  // Create new conversation
  const conversationData = {
    organization_id: organizationId,
    customer_email: customerEmail || null,
    customer_name: customerName || 'Anonymous User',
    visitor_id: visitorId || null,
    status: 'open',
    priority: 'medium',
    metadata: {
      ...metadata,
      source,
      createdBy: source,
      sharedConversation: true,
    },
  };

  const { data: newConversation, error } = await supabaseClient
    .from('conversations')
    .insert(conversationData)
    .select()
    .single();

  if (error) {
    console.error('[SharedConversationService] Failed to create conversation:', error);
    throw new Error(`Failed to create shared conversation: ${error.message}`);
  }

  return {
    id: newConversation.id,
    organizationId: newConversation.organization_id,
    customerEmail: newConversation.customer_email,
    customerName: newConversation.customer_name,
    status: newConversation.status,
    priority: newConversation.priority,
    metadata: newConversation.metadata,
    createdAt: newConversation.created_at,
    updatedAt: newConversation.updated_at,
  };
}

/**
 * Retrieves a shared conversation by ID
 */
export async function getSharedConversation(
  conversationId: string,
  organizationId: string
): Promise<SharedConversation | null> {
  const supabaseClient = supabase.admin();

  const { data: conversation, error } = await supabaseClient
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !conversation) {
    return null;
  }

  return {
    id: conversation.id,
    organizationId: conversation.organization_id,
    customerEmail: conversation.customer_email,
    customerName: conversation.customer_name,
    status: conversation.status,
    priority: conversation.priority || 'medium',
    metadata: conversation.metadata || {},
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
  };
}

/**
 * Updates conversation metadata to ensure proper sync
 */
export async function updateConversationMetadata(
  conversationId: string,
  organizationId: string,
  metadata: Record<string, any>
): Promise<void> {
  const supabaseClient = supabase.admin();

  const { error } = await supabaseClient
    .from('conversations')
    .update({
      metadata: metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[SharedConversationService] Failed to update metadata:', error);
    throw new Error(`Failed to update conversation metadata: ${error.message}`);
  }
}

/**
 * Ensures a conversation is marked as shared and accessible by both widget and dashboard
 */
export async function ensureConversationIsShared(
  conversationId: string,
  organizationId: string
): Promise<void> {
  const conversation = await getSharedConversation(conversationId, organizationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const updatedMetadata = {
    ...conversation.metadata,
    sharedConversation: true,
    lastSyncedAt: new Date().toISOString(),
  };

  await updateConversationMetadata(conversationId, organizationId, updatedMetadata);
}

/**
 * Gets the standardized channel name for real-time communication
 */
export function getSharedConversationChannel(
  organizationId: string,
  conversationId: string
): string {
  return `org:${organizationId}:conv:${conversationId}`;
}
