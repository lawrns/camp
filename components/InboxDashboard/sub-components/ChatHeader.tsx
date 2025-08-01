// ChatHeader component for conversation header

import { AIConfidenceIndicator } from "@/components/inbox/AIConfidenceIndicator";
import { AIHandoverButton } from "@/components/inbox/AIHandoverButton";
import { AssignmentDialog } from "@/components/conversations/AssignmentDialog";
import { StatusBadge } from "@/components/inbox/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getAvatarPath } from "@/lib/utils/avatar";
import { Clock, MoreVertical, Info, Tag, Ticket, Users } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import type { Conversation } from "../types";

interface ChatHeaderProps {
  conversation: Conversation;
  isAIActive: boolean;
  toggleAIHandover: () => void;
  showCustomerDetails: boolean;
  setShowCustomerDetails: (show: boolean) => void;
  typingUsers: string[];
  onlineUsers: string[];
  // NEW: Add callback functions for actions
  onAssignConversation?: () => void;
  onConvertToTicket?: () => void;
}

/**
 * Chat header component with customer info and actions
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isAIActive,
  toggleAIHandover,
  showCustomerDetails,
  setShowCustomerDetails,
  typingUsers,
  onlineUsers,
  onAssignConversation,
  onConvertToTicket,
}) => {
  // Get auth context to determine if user is an agent (not widget user)
  const { user } = useAuth();
  const isAgent = user && (user.organizationRole === "agent" || user.organizationRole === "admin");

  // State for assignment dialog
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  // Format last activity with error handling
  const formatLastActivity = (timestamp: string) => {
    try {
      if (!timestamp) return "Unknown activity";

      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Unknown activity";
      }

      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

      if (diffInMinutes < 1) {
        return "Active now";
      } else if (diffInMinutes < 60) {
        return `Active ${Math.floor(diffInMinutes)}m ago`;
      } else if (diffInMinutes < 1440) {
        return `Active ${Math.floor(diffInMinutes / 60)}h ago`;
      } else {
        return `Last seen ${date.toLocaleDateString()}`;
      }
    } catch (error) {

      return "Unknown activity";
    }
  };

  // Check if customer is online
  const isCustomerOnline = onlineUsers.includes(conversation.customerEmail);

  return (
    <div className="ds-inbox-header chat-header bg-background flex-shrink-0 border-b border-[var(--fl-color-border)] px-6 py-4 shadow-sm" data-testid="chat-header">
      <div className="flex items-center justify-between" data-testid="chat-header-content">
        {/* Left side - Customer info */}
        <div className="flex items-center gap-3" data-testid="chat-header-customer-info">
          {/* Avatar with online indicator */}
          <div className="relative" data-testid="chat-header-avatar-container">
            <img
              src={getAvatarPath(conversation.customerEmail || conversation.customerName, "customer")}
              alt={conversation.customerName}
              className="h-10 w-10 rounded-ds-full object-cover shadow-card-base"
              data-testid="chat-header-avatar"
            />
            {/* Online indicator */}
            {isCustomerOnline && (
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-ds-full border-2 border-white bg-green-400 shadow-card-base" data-testid="chat-header-online-indicator"></div>
            )}
          </div>

          {/* Customer details */}
          <div className="min-w-0 flex-1" data-testid="chat-header-customer-details">
            <div className="flex items-center gap-2" data-testid="chat-header-customer-title-row">
              <h2 className="font-sans truncate text-base font-semibold text-gray-900" data-testid="chat-header-customer-name">{conversation.customerName}</h2>

              {/* Status badge using unified component */}
              <StatusBadge 
                status={conversation.status}
                priority={conversation.priority}
                variant="header"
                size="sm"
                showIcon={false}
                data-testid="chat-header-status-badge"
              />

              {/* AI Confidence Indicator - Agent Only */}
              {isAgent && isAIActive && (
                <div data-testid="chat-header-ai-confidence">
                  <AIConfidenceIndicator
                    confidence={0.85} // Default confidence since ai_confidence_score doesn't exist in Conversation type
                    variant="badge"
                    size="sm"
                    showTrend={false}
                  />
                </div>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3" data-testid="chat-header-customer-meta">
              <p className="truncate text-sm text-[var(--fl-color-text-muted)]" data-testid="chat-header-customer-email">{conversation.customerEmail}</p>

              {/* Connection status removed - was showing inappropriate warnings */}

              {/* Last activity */}
              <div className="flex items-center gap-1 text-tiny text-[var(--fl-color-text-muted)]" data-testid="chat-header-last-activity">
                <Clock className="h-3 w-3" data-testid="chat-header-activity-icon" />
                <span data-testid="chat-header-activity-text">{formatLastActivity(conversation.lastMessageAt)}</span>
              </div>
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="mt-1 flex items-center gap-1" data-testid="chat-header-typing-indicator">
                <div className="flex gap-1" data-testid="chat-header-typing-dots">
                  <div className="bg-primary h-1 w-1 animate-bounce rounded-ds-full" data-testid="chat-header-typing-dot-1"></div>
                  <div
                    className="bg-primary h-1 w-1 animate-bounce rounded-ds-full"
                    style={{ animationDelay: "0.1s" }}
                    data-testid="chat-header-typing-dot-2"
                  ></div>
                  <div
                    className="bg-primary h-1 w-1 animate-bounce rounded-ds-full"
                    style={{ animationDelay: "0.2s" }}
                    data-testid="chat-header-typing-dot-3"
                  ></div>
                </div>
                <span className="text-tiny text-blue-600" data-testid="chat-header-typing-text">
                  {typingUsers.length === 1
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}

            {/* Tags */}
            {conversation.tags && conversation.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1" data-testid="chat-header-tags">
                {conversation.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-background inline-flex items-center rounded-ds-full px-2 py-1 text-tiny font-medium text-gray-800"
                    data-testid={`chat-header-tag-${index}`}
                  >
                    <Tag className="mr-1 h-3 w-3" data-testid={`chat-header-tag-icon-${index}`} />
                    {tag}
                  </span>
                ))}
                {conversation.tags.length > 3 && (
                  <span className="text-tiny text-[var(--fl-color-text-muted)]" data-testid="chat-header-tags-overflow">
                    +{conversation.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2" data-testid="chat-header-actions">
          {/* NEW: Assign Conversation Button */}
          {onAssignConversation && (
            <button
              onClick={() => setShowAssignmentDialog(true)}
              className="hover:bg-background hover:text-foreground rounded-ds-lg p-2 text-gray-400 transition-colors w-10 h-10 flex items-center justify-center"
              title="Assign conversation"
              aria-label="Assign conversation"
              data-testid="chat-header-assign-button"
            >
              <Users className="h-4 w-4" />
            </button>
          )}

          {/* NEW: Convert to Ticket Button */}
          {onConvertToTicket && (
            <button
              onClick={onConvertToTicket}
              className="hover:bg-background hover:text-foreground rounded-ds-lg p-2 text-gray-400 transition-colors w-10 h-10 flex items-center justify-center"
              title="Convert to ticket"
              aria-label="Convert to ticket"
              data-testid="chat-header-convert-ticket-button"
            >
              <Ticket className="h-5 w-5" data-testid="chat-header-convert-ticket-icon" />
            </button>
          )}

          {/* AI Handover Button - Agent Only */}
          {isAgent && (
            <div data-testid="chat-header-ai-handover">
              <AIHandoverButton
                conversationId={conversation.id}
                organizationId={user?.organizationId || ""}
                userId={user?.id || ""}
                currentConfidence={0.85} // Default confidence since ai_confidence_score doesn't exist
                variant="button"
                showDetails={false}
                className="agent-only"
              />
            </div>
          )}

          {/* Customer details toggle */}
          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className={`rounded-ds-lg p-2 transition-colors w-10 h-10 flex items-center justify-center ${
              showCustomerDetails ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title="Toggle customer details"
            aria-label="Toggle customer details"
            data-testid="chat-header-details-toggle"
          >
            <Info className="h-5 w-5" data-testid="chat-header-details-icon" />
          </button>

          {/* More actions menu */}
          <button
            className="hover:bg-background hover:text-foreground rounded-ds-lg p-2 text-gray-400 transition-colors w-10 h-10 flex items-center justify-center"
            title="More actions"
            aria-label="More actions"
            data-testid="chat-header-more-actions"
          >
            <MoreVertical className="h-5 w-5" data-testid="chat-header-more-actions-icon" />
          </button>
        </div>
      </div>

      {/* Assignment Dialog */}
      <AssignmentDialog
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
        conversationId={conversation.id}
        currentAgentId={conversation.assigneeId}
        organizationId={user?.organizationId || ""}
        onAssigned={(agentId) => {
          onAssignConversation?.();
          setShowAssignmentDialog(false);
        }}
      />
    </div>
  );
};

export default ChatHeader;
