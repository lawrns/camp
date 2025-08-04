"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCampfireStore } from "@/store";
import {
  useConversations,
  useSelectedConversation,
  useSelectedConversationId,
} from "@/store/memoized-selectors-improved";

export function StoreDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Get store data
  const conversations = useConversations();
  const selectedConversationId = useSelectedConversationId();
  const selectedConversation = useSelectedConversation();
  const { user } = useAuth();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary fixed bottom-4 right-4 z-50 rounded-ds-lg px-4 py-2 text-white shadow-card-deep hover:bg-blue-700"
      >
        Debug Store
      </button>
    );
  }

  return (
    <div
      data-debug-panel="true"
      className="border-ds-border-strong bg-background fixed bottom-4 right-4 z-50 max-h-96 w-96 overflow-auto rounded-ds-lg border spacing-3 shadow-xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">Store Debug Panel</h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-foreground text-[var(--fl-color-text-muted)]">
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold">Conversations</h4>
          <p>Count: {conversations.length}</p>
          <p>Selected ID: {selectedConversationId || "None"}</p>
          <p>Selected Found: {selectedConversation ? "Yes" : "No"}</p>
        </div>

        <div>
          <h4 className="font-semibold">First 3 Conversations:</h4>
          {conversations.slice(0, 3).map((conv: unknown) => (
            <div key={conv.id} className="ml-2 text-tiny">
              ID: {conv.id}, Status: {conv.status}
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-semibold">Actions</h4>
          <button
            onClick={() => {
              const state = useCampfireStore.getState();
            }}
            className="mr-2 rounded bg-gray-200 px-2 py-1 text-tiny"
          >
            Log State
          </button>
          <button
            onClick={() => {
              if (user?.id) {
                // loadConversations method is not available in the store interface
                const conversations = useCampfireStore.getState().conversations;
                // Note: loadConversations method needs to be updated to not require access_token
              } else {
              }
            }}
            className="rounded bg-blue-200 px-2 py-1 text-tiny"
          >
            Reload Conversations
          </button>
        </div>

        <div>
          <h4 className="font-semibold">Auth Status</h4>
          <p>User: {user ? "Yes" : "No"}</p>
          <p>User ID: {user?.id ? "Yes" : "No"}</p>
        </div>

        <pre className="hidden">
          {JSON.stringify(
            {
              conversations: { size: conversations.length },
              selectedConversationId,
              messages: { size: 0 },
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
