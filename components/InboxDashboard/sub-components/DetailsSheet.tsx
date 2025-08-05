import React from "react";
import { X } from "lucide-react";
import CustomerSidebar from "./CustomerSidebar";
import { ConversationManagement } from "./ConversationManagement";
import type { Conversation } from "../types";

interface DetailsSheetProps {
  selectedConversation: Conversation | null;
  showCustomerDetails: boolean;
  setShowCustomerDetails: (show: boolean) => void;
  showConversationManagement: boolean;
  setShowConversationManagement: (show: boolean) => void;
  onConversationUpdate?: (updates: Partial<Conversation>) => void;
  className?: string;
}

/**
 * Details sheet component for customer and conversation management
 * Extracted from main InboxDashboard for better separation of concerns
 */
export const DetailsSheet: React.FC<DetailsSheetProps> = ({
  selectedConversation,
  showCustomerDetails,
  setShowCustomerDetails,
  showConversationManagement,
  setShowConversationManagement,
  onConversationUpdate,
  className = "",
}) => {
  if (!selectedConversation) {
    return null;
  }

  return (
    <>
      {/* Conversation Management Panel */}
      {showConversationManagement && (
        <div className={`w-80 border-l border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] overflow-y-auto ${className}`}>
          <div className="p-4 border-b border-[var(--ds-color-border)]">
            <div className="flex items-center justify-between">
              <h3 className="typography-section-title">Conversation Management</h3>
              <button
                onClick={() => setShowConversationManagement(false)}
                className="btn-ghost p-1"
                aria-label="Close conversation management"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <ConversationManagement
              conversation={selectedConversation}
              onUpdate={(updates) => {
                // Update the conversation in the local state
                if (selectedConversation && onConversationUpdate) {
                  onConversationUpdate(updates);
                  console.log('Conversation updated:', { ...selectedConversation, ...updates });
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Customer Details Sidebar */}
      {showCustomerDetails && (
        <CustomerSidebar 
          conversation={selectedConversation} 
          onClose={() => setShowCustomerDetails(false)} 
        />
      )}
    </>
  );
};
