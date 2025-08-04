import React, { useState } from "react";
import { Clock, User, X } from "lucide-react";
import type { Conversation } from "../types";
import { getAvatarPath } from "@/lib/utils/avatar";
import { formatRelativeTimeShort } from "@/lib/utils/date";
import {
  getStatusBadgeClasses,
  getPriorityBadgeClasses,
  getUserTypeBadgeClasses,
  getBadgeClasses,
  unreadBadgeClasses,
  avatarRingClasses,
  conversationCardClasses,
  layoutClasses
} from "@/lib/utils/badge-styles";

interface SidebarNavProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  isLoading: boolean;
  className?: string;
}

/**
 * Sidebar navigation component for conversation list
 * Extracted from main InboxDashboard for better separation of concerns
 * Uses design system tokens for consistent styling
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchQuery,
  statusFilter,
  priorityFilter,
  isLoading,
  className = "",
}) => {
  return (
    <div className={`w-80 border-r border-gray-200 bg-white flex flex-col h-full ${className}`}>
      {/* Header section */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">
          Conversations
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 font-medium">No conversations</p>
            <p className="text-gray-500 text-sm mt-1">New conversations will appear here</p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversationId === conversation.id}
                onSelect={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

function ConversationCard({ conversation, isSelected, onSelect }: ConversationCardProps) {
  // Generate unique avatar for this conversation using design system
  const avatarPath = getAvatarPath(conversation.customerEmail || conversation.id.toString(), 'customer');

  // Format timestamp using short format
  const timeAgo = conversation.lastMessageAt
    ? formatRelativeTimeShort(new Date(conversation.lastMessageAt))
    : 'just now';

  // State for avatar loading
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Get customer display name with fallback
  const customerName = conversation.customerName || "Anonymous User";

  // Generate cartoon character fallback for Anonymous Users
  const getAvatarFallback = (name: string) => {
    const cartoonAvatars = ['🦉', '🍊', '🐱', '🐶', '🐸', '🦊', '🐼', '🐨'];
    const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const avatarIndex = nameHash % cartoonAvatars.length;

    if (name === "Anonymous User") {
      return cartoonAvatars[avatarIndex];
    }

    // For named users, use initials
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`${conversationCardClasses.base} ${
        isSelected
          ? conversationCardClasses.selected
          : conversationCardClasses.unselected
      }`}
      onClick={onSelect}
    >
      <div className={`${layoutClasses.flexStart} ${layoutClasses.conversationGap}`}>
        {/* Circular Avatar with cartoon character fallbacks */}
        <div className="flex-shrink-0 relative">
          <div className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ${avatarRingClasses}`}>
            {!avatarError && avatarPath ? (
              <img
                src={avatarPath}
                alt={customerName}
                className="w-full h-full object-cover"
                onLoad={() => setAvatarLoaded(true)}
                onError={() => {
                  setAvatarError(true);
                  setAvatarLoaded(false);
                }}
                style={{ display: avatarLoaded && !avatarError ? 'block' : 'none' }}
              />
            ) : null}

            {/* Fallback display - cartoon characters for Anonymous Users, initials for named users */}
            {(!avatarLoaded || avatarError || !avatarPath) && (
              <span className="text-white font-semibold text-lg">
                {getAvatarFallback(customerName)}
              </span>
            )}
          </div>

          {/* Online status indicator */}
          {conversation.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row: Customer name and Human tag */}
          <div className={`${layoutClasses.flexCenter} justify-between gap-2 mb-1`}>
            <div className={`${layoutClasses.flexCenter} gap-2 min-w-0`}>
              <h3 className={`font-semibold text-sm text-gray-900 ${layoutClasses.textTruncate}`}>
                {customerName}
              </h3>

              {/* Human tag with person icon */}
              <div className={`${layoutClasses.flexCenter} gap-1 ${getBadgeClasses(getUserTypeBadgeClasses("human"))}`}>
                <User className="h-3 w-3" />
                <span>Human</span>
              </div>
            </div>

            {/* Timestamp with clock icon */}
            <div className={`${layoutClasses.flexCenter} gap-1 text-xs text-gray-500 flex-shrink-0`}>
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Message preview */}
          <p className="text-xs text-gray-600 truncate mb-2 leading-relaxed">
            {conversation.lastMessagePreview || "No messages yet"}
          </p>

          {/* Bottom row: Status badges */}
          <div className={`${layoutClasses.flexCenter} gap-2`}>
            {/* Status badge */}
            <span className={getBadgeClasses(getStatusBadgeClasses(conversation.status))}>
              {conversation.status?.charAt(0).toUpperCase() + conversation.status?.slice(1) || "Open"}
            </span>

            {/* Priority badge */}
            {conversation.priority && (
              <span className={getBadgeClasses(getPriorityBadgeClasses(conversation.priority))}>
                {conversation.priority.charAt(0).toUpperCase() + conversation.priority.slice(1)}
              </span>
            )}

            {/* Unread count */}
            {conversation.unreadCount > 0 && (
              <span className={`${unreadBadgeClasses} ml-auto`}>
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
