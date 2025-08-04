// ChatHeader component for conversation header

import { AIConfidenceIndicator } from "@/components/inbox/AIConfidenceIndicator";
import ConsciousnessToggle from "@/components/ai/ConsciousnessToggle";
import ThinkingSidebar from "@/components/ai/ThinkingSidebar";
import { useAIConsciousness } from "@/hooks/useAIConsciousness";
import { AssignmentDialog } from "@/components/conversations/AssignmentDialog";
import { useAuth } from "@/hooks/useAuth";
import { Clock, MoreVertical, Info, Tag, Ticket, Users, Brain } from "lucide-react";
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
  toggleAIHandover: _toggleAIHandover,
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
  // State for thinking sidebar
  const [showThinkingSidebar, setShowThinkingSidebar] = useState(false);

  // AI Consciousness state
  const aiConsciousness = useAIConsciousness({
    conversationId: conversation.id,
    organizationId: user?.organizationId,
    userId: user?.id,
    onStateChange: (state) => {
      console.log('AI consciousness state changed:', state);
    },
    onError: (error) => {
      console.error('AI consciousness error:', error);
    },
  });

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

  // Get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-400";
      case "pending":
        return "bg-yellow-400";
      case "resolved":
        return "bg-gray-400";
      case "escalated":
        return "bg-red-400";
      default:
        return "bg-gray-400";
    }
  };

  // Check if customer is online
  const isCustomerOnline = onlineUsers.includes(conversation.customerEmail);

  return (
    <div className="ds-inbox-header" data-testid="chat-header">
      <div className="flex items-center justify-between w-full" data-testid="chat-header-content">
        {/* Left side - Customer info */}
        <div className="flex items-center" style={{ gap: 'var(--ds-inbox-header-gap)' }} data-testid="chat-header-customer-info">
          {/* Avatar with online indicator */}
          <div className="relative" data-testid="chat-header-avatar-container">
            <img
              src={(() => {
                const { getAvatarPath } = require("@/lib/utils/avatar");
                return getAvatarPath(conversation.customerEmail || conversation.customerName, "customer");
              })()}
              alt={conversation.customerName}
              className="ds-inbox-avatar object-cover"
              data-testid="chat-header-avatar"
            />
            {/* Online indicator */}
            {isCustomerOnline && (
              <div className="ds-inbox-status absolute -bottom-1 -right-1 bg-green-400" data-testid="chat-header-online-indicator"></div>
            )}
          </div>

          {/* Customer details */}
          <div className="min-w-0 flex-1" data-testid="chat-header-customer-details">
            <div className="flex items-center" style={{ gap: 'var(--ds-spacing-2)' }} data-testid="chat-header-customer-title-row">
              <h2 className="truncate text-base font-semibold" style={{ color: 'var(--ds-color-text)' }} data-testid="chat-header-customer-name">{conversation.customerName}</h2>

              {/* Status badge */}
              <span
                className={`inline-flex items-center rounded-full text-xs font-medium text-white ${getStatusColor(conversation.status)}`}
                style={{ padding: 'var(--ds-spacing-1) var(--ds-spacing-2)' }}
                data-testid="chat-header-status-badge"
              >
                <div className={`h-2 w-2 rounded-full ${getStatusColor(conversation.status)}`} style={{ marginRight: 'var(--ds-spacing-1)' }} data-testid="chat-header-status-indicator"></div>
                {conversation.status}
              </span>

              {/* Priority badge */}
              {conversation.priority && (
                <span
                  className={`inline-flex items-center rounded-ds-full px-2 py-1 text-xs font-medium ${conversation.priority === "urgent"
                    ? "bg-red-100 text-red-800"
                    : conversation.priority === "high"
                      ? "bg-orange-100 text-orange-800"
                      : conversation.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  data-testid="chat-header-priority-badge"
                >
                  {conversation.priority}
                </span>
              )}

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

            <div className="mt-1 flex items-center space-x-3" data-testid="chat-header-customer-meta">
              <p className="truncate text-sm text-[var(--fl-color-text-muted)]" data-testid="chat-header-customer-email">{conversation.customerEmail}</p>

              {/* Connection status removed - was showing inappropriate warnings */}

              {/* Last activity */}
              <div className="flex items-center space-x-1 text-tiny text-[var(--fl-color-text-muted)]" data-testid="chat-header-last-activity">
                <Clock className="h-3 w-3" data-testid="chat-header-activity-icon" />
                <span data-testid="chat-header-activity-text">{formatLastActivity(conversation.lastMessageAt)}</span>
              </div>
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="mt-1 flex items-center space-x-1" data-testid="chat-header-typing-indicator">
                <div className="flex space-x-1" data-testid="chat-header-typing-dots">
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
        <div className="flex items-center" style={{ gap: 'var(--ds-inbox-button-gap)' }} data-testid="chat-header-actions">
          {/* Assignment Button - Opens Dialog */}
          <button
            onClick={() => setShowAssignmentDialog(true)}
            className="ds-inbox-button ds-inbox-button-secondary"
            title="Assign conversation"
            aria-label="Assign conversation"
            data-testid="chat-header-assign-button"
          >
            <Users className="h-4 w-4" />
          </button>

          {/* NEW: Convert to Ticket Button */}
          {onConvertToTicket && (
            <button
              onClick={onConvertToTicket}
              className="ds-inbox-button ds-inbox-button-secondary"
              title="Convert to ticket"
              aria-label="Convert to ticket"
              data-testid="chat-header-convert-ticket-button"
            >
              <Ticket className="h-5 w-5" data-testid="chat-header-convert-ticket-icon" />
            </button>
          )}

          {/* AI Consciousness Toggle */}
          {/* Temporarily visible for all users for testing */}
          <div data-testid="chat-header-ai-handover">
            <ConsciousnessToggle
              conversationId={conversation.id}
              isAIActive={aiConsciousness.isAIActive}
              aiStatus={aiConsciousness.aiStatus}
              confidence={aiConsciousness.confidence}
              accuracy={aiConsciousness.accuracy}
              onToggle={aiConsciousness.toggleAI}
              isLoading={false}
              variant="inline"
              showDetails={true}
              className="test-visible"
            />
          </div>

          {/* AI Thinking Sidebar Toggle */}
          {/* Temporarily visible for all users for testing */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThinkingSidebar(!showThinkingSidebar)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Toggle AI Thinking Sidebar"
            >
              <Brain className="h-5 w-5" />
            </button>
          </div>

          {/* Customer details toggle */}
          <button
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className={`ds-inbox-button ${showCustomerDetails ? "ds-inbox-button-primary" : "ds-inbox-button-secondary"}`}
            title="Toggle customer details"
            aria-label="Toggle customer details"
            data-testid="chat-header-details-toggle"
          >
            <Info className="h-5 w-5" data-testid="chat-header-details-icon" />
          </button>

          {/* More actions menu */}
          <button
            className="ds-inbox-button ds-inbox-button-secondary"
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
        currentAgentId={null}
        organizationId={user?.organizationId || ""}
        onAssigned={(_agentId) => {
          onAssignConversation?.();
          setShowAssignmentDialog(false);
        }}
      />
    </div>

    {/* AI Thinking Sidebar */}
    {showThinkingSidebar && (
      <ThinkingSidebar
        conversationId={conversation.id}
        isVisible={showThinkingSidebar}
        aiStatus={aiConsciousness.aiStatus}
        confidence={aiConsciousness.confidence}
        accuracy={aiConsciousness.accuracy}
        isThinking={aiConsciousness.isThinking}
        reasoning={aiConsciousness.reasoning}
        onClose={() => setShowThinkingSidebar(false)}
      />
    )}
  </>
  );
};

export default ChatHeader;
