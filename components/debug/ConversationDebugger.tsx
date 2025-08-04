'use client';

import React from 'react';
import { useConversation } from '@/hooks/useConversation';
import { useAuth } from '@/hooks/useAuth';
import { useCampfireStore } from '@/store';

interface ConversationDebuggerProps {
  organizationId: string;
}

export function ConversationDebugger({ organizationId }: ConversationDebuggerProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { ui } = useCampfireStore();
  const selectedConversationId = ui?.selectedConversationId || null;
  
  const {
    conversations,
    conversationMessages,
    selectedConversation,
    isLoading,
    isLoadingMessages,
    error,
    selectConversation,
    loadConversations
  } = useConversation(selectedConversationId);

  // Debug logs
  React.useEffect(() => {

  }, [
    authLoading, isAuthenticated, user?.id, organizationId,
    conversations.length, selectedConversationId, selectedConversation?.id,
    conversationMessages.length, isLoading, isLoadingMessages, error
  ]);

  const handleConversationSelect = async (conversationId: string) => {

    try {
      await selectConversation(conversationId);

    } catch (error) {

    }
  };

  const handleRefresh = async () => {

    try {
      await loadConversations();

    } catch (error) {

    }
  };

  return (
    <div className="spacing-3 bg-[var(--fl-color-warning-subtle)] border border-status-warning-light rounded-ds-lg m-spacing-md">
      <h3 className="text-base font-semibold text-yellow-800 mb-4">🔍 Conversation Debugger</h3>
      
      {/* Authentication Status */}
      <div className="mb-4">
        <h4 className="font-medium text-yellow-600-dark mb-2">Authentication:</h4>
        <div className="text-sm space-y-1">
          <div>Loading: {authLoading ? '✅' : '❌'}</div>
          <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
          <div>User ID: {user?.id || 'None'}</div>
          <div>Organization ID: {organizationId || 'None'}</div>
        </div>
      </div>

      {/* Conversation Data */}
      <div className="mb-4">
        <h4 className="font-medium text-yellow-600-dark mb-2">Conversation Data:</h4>
        <div className="text-sm space-y-1">
          <div>Conversations Loaded: {conversations.length}</div>
          <div>Is Loading: {isLoading ? '✅' : '❌'}</div>
          <div>Error: {error ? `❌ ${typeof error === 'string' ? error : (error as unknown)?.message}` : '✅ None'}</div>
          <div>Global Selected ID: {selectedConversationId || 'None'}</div>
          <div>Hook Selected ID: {selectedConversation?.id || 'None'}</div>
        </div>
      </div>

      {/* Message Data */}
      <div className="mb-4">
        <h4 className="font-medium text-yellow-600-dark mb-2">Message Data:</h4>
        <div className="text-sm space-y-1">
          <div>Messages Count: {conversationMessages.length}</div>
          <div>Is Loading Messages: {isLoadingMessages ? '✅' : '❌'}</div>
          <div>Selected Conversation: {(selectedConversation as unknown)?.customerName || selectedConversation?.customer?.name || (selectedConversation as unknown)?.customerEmail || selectedConversation?.customer?.email || 'None'}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4">
        <h4 className="font-medium text-yellow-600-dark mb-2">Actions:</h4>
        <div className="space-x-spacing-sm">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Conversations'}
          </button>
        </div>
      </div>

      {/* Conversation List */}
      {conversations.length > 0 && (
        <div>
          <h4 className="font-medium text-yellow-600-dark mb-2">Available Conversations:</h4>
          <div className="space-y-spacing-sm">
            {conversations.slice(0, 5).map((conversation: unknown) => (
              <div
                key={conversation.id}
                className={`spacing-2 rounded border cursor-pointer text-sm ${
                  conversation.id === selectedConversation?.id
                    ? 'bg-[var(--fl-color-info-subtle)] border-[var(--fl-color-border-interactive)]'
                    : 'bg-white border-[var(--fl-color-border)] hover:bg-[var(--fl-color-background-subtle)]'
                }`}
                onClick={() => handleConversationSelect(conversation.id)}
              >
                <div className="font-medium">
                  {conversation.customerName || conversation.customerEmail || 'Unknown Customer'}
                </div>
                <div className="text-foreground">ID: {conversation.id}</div>
                <div className="text-foreground">Status: {conversation.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 spacing-3 bg-[var(--fl-color-danger-subtle)] border border-status-error-light rounded">
          <h4 className="font-medium text-red-600-dark mb-2">Error:</h4>
          <div className="text-sm text-red-600">{typeof error === 'string' ? error : (error as unknown)?.message}</div>
        </div>
      )}
    </div>
  );
} 