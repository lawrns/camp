/**
 * LiveCollaboration Component
 *
 * Advanced real-time collaboration features including:
 * - Live cursors and selections
 * - Collaborative editing indicators
 * - Real-time activity feed
 * - Multi-user conversation management
 */

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { PresenceIndicator, usePresence, type PresenceStatus } from "./PresenceIndicator";
import { TypingIndicator, useTypingIndicator } from "./TypingIndicator";

interface LiveActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: "joined" | "left" | "typing" | "message_sent" | "status_changed" | "assigned";
  timestamp: Date;
  details?: string;
  conversationId?: string;
}

interface LiveCollaborationProps {
  /** Current conversation ID */
  conversationId: string;
  /** Current user ID */
  currentUserId: string;
  /** Show activity feed */
  showActivityFeed?: boolean;
  /** Show presence indicators */
  showPresence?: boolean;
  /** Show typing indicators */
  showTyping?: boolean;
  /** Custom className */
  className?: string;
}

export const LiveCollaboration: React.FC<LiveCollaborationProps> = ({
  conversationId,
  currentUserId,
  showActivityFeed = true,
  showPresence = true,
  showTyping = true,
  className = "",
}) => {
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const activityFeedRef = useRef<HTMLDivElement>(null);

  // Real-time hooks
  const { typingUsers, isTyping, startTyping, stopTyping } = useTypingIndicator(conversationId, currentUserId);
  const { users, currentUser, onlineUsers, setStatus } = usePresence(conversationId);

  // Simulate live activities
  useEffect(() => {
    const generateActivity = (): LiveActivity => {
      const actions: LiveActivity["action"][] = ["joined", "message_sent", "status_changed", "assigned"];
      const users = ["Alice Johnson", "Bob Smith", "Carol Williams"];
      const randomAction = actions[Math.floor(Math.random() * actions.length)] || "joined";
      const randomUser = users[Math.floor(Math.random() * users.length)] || "Unknown User";

      return {
        id: `activity-${Date.now()}-${Math.random()}`,
        userId: `user-${Math.random()}`,
        userName: randomUser,
        action: randomAction,
        timestamp: new Date(),
        conversationId,
        details: getActionDetails(randomAction, randomUser),
      };
    };

    const getActionDetails = (action: LiveActivity["action"], userName: string): string => {
      switch (action) {
        case "joined":
          return `${userName} joined the conversation`;
        case "message_sent":
          return `${userName} sent a message`;
        case "status_changed":
          return `${userName} changed their status to Away`;
        case "assigned":
          return `Conversation assigned to ${userName}`;
        default:
          return `${userName} performed an action`;
      }
    };

    // Add initial activity
    const initialActivity = generateActivity();
    setActivities([initialActivity]);

    // Simulate periodic activities
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities((prev) => [newActivity, ...prev.slice(0, 9)]); // Keep last 10 activities
    }, 8000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Auto-scroll activity feed
  useEffect(() => {
    if (activityFeedRef.current && isExpanded) {
      activityFeedRef.current.scrollTop = 0;
    }
  }, [activities, isExpanded]);

  const formatActivityTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getActivityIcon = (action: LiveActivity["action"]) => {
    switch (action) {
      case "joined":
        return "UserPlus";
      case "left":
        return "UserMinus";
      case "typing":
        return "Edit";
      case "message_sent":
        return "MessageCircle";
      case "status_changed":
        return "Activity";
      case "assigned":
        return "UserCheck";
      default:
        return "Activity";
    }
  };

  const getActivityColor = (action: LiveActivity["action"]) => {
    switch (action) {
      case "joined":
        return "text-fl-status-ok";
      case "left":
        return "text-fl-text-muted";
      case "message_sent":
        return "text-fl-brand";
      case "status_changed":
        return "text-fl-status-warn";
      case "assigned":
        return "text-fl-brand";
      default:
        return "text-fl-text-muted";
    }
  };

  return (
    <div className={`bg-fl-bg-base rounded-ds-lg border border-fl-border ${className}`}>
      {/* Header */}
      <div className="border-b border-fl-border spacing-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Users" size={16} className="text-fl-brand" />
            <div>
              <h3 className="font-medium text-fl-text">Live Collaboration</h3>
              <p className="text-sm text-fl-text-muted">
                {onlineUsers.length} online • {users.length} total
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-fl-bg-subtle rounded-ds-lg p-spacing-sm transition-colors"
          >
            <Icon name={isExpanded ? "CaretUp" : "CaretDown"} size={16} className="text-fl-text-muted" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-3 spacing-3">
          {/* Presence Indicators */}
          {showPresence && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-fl-text">Team Members</h4>
              <div className="space-y-spacing-sm">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <PresenceIndicator user={user} size="sm" showStatus={true} showLastSeen={true} />

                    {user.isCurrentUser && (
                      <div className="flex space-x-1">
                        {(["online", "away", "busy"] as PresenceStatus[]).map((status: any) => (
                          <button
                            key={status}
                            onClick={() => setStatus(status)}
                            className={`rounded-ds-md px-2 py-1 text-xs transition-colors ${
                              currentUser?.status === status
                                ? "bg-fl-brand text-white"
                                : "bg-fl-bg-subtle hover:bg-fl-bg-hover text-fl-text-muted"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicators */}
          {showTyping && typingUsers.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-fl-text">Currently Typing</h4>
              <TypingIndicator typingUsers={typingUsers} />
            </div>
          )}

          {/* Activity Feed */}
          {showActivityFeed && (
            <div>
              <h4 className="mb-3 text-sm font-medium text-fl-text">Recent Activity</h4>
              <div ref={activityFeedRef} className="max-h-48 space-y-spacing-sm overflow-y-auto">
                {activities.map((activity: any) => (
                  <div
                    key={activity.id}
                    className="hover:bg-fl-bg-subtle flex items-start space-x-3 rounded-ds-lg p-spacing-sm transition-colors"
                  >
                    <div className={`bg-fl-bg-subtle rounded-ds-full spacing-1.5 ${getActivityColor(activity.action)}`}>
                      <Icon name={getActivityIcon(activity.action) as any} size={12} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-fl-text">{activity.details}</p>
                      <p className="text-tiny text-fl-text-muted">{formatActivityTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="py-4 text-center">
                    <Icon name="Activity" size={24} className="mx-auto mb-2 text-fl-text-muted" />
                    <p className="text-sm text-fl-text-muted">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-fl-border pt-3">
            <h4 className="mb-3 text-sm font-medium text-fl-text">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-ds-2">
              <button
                onClick={startTyping}
                className="bg-fl-bg-subtle hover:bg-fl-bg-hover flex items-center space-x-spacing-sm rounded-ds-lg p-spacing-sm text-sm transition-colors"
              >
                <Icon name="PencilSimple" size={12} />
                <span>Start Typing</span>
              </button>

              <button
                onClick={stopTyping}
                className="bg-fl-bg-subtle hover:bg-fl-bg-hover flex items-center space-x-spacing-sm rounded-ds-lg p-spacing-sm text-sm transition-colors"
              >
                <Icon name="Square" size={12} />
                <span>Stop Typing</span>
              </button>

              <button className="bg-fl-bg-subtle hover:bg-fl-bg-hover flex items-center space-x-spacing-sm rounded-ds-lg p-spacing-sm text-sm transition-colors">
                <Icon name="UserPlus" size={12} />
                <span>Invite User</span>
              </button>

              <button className="bg-fl-bg-subtle hover:bg-fl-bg-hover flex items-center space-x-spacing-sm rounded-ds-lg p-spacing-sm text-sm transition-colors">
                <Icon name="Share" size={12} />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact View */}
      {!isExpanded && (
        <div className="spacing-3">
          <div className="flex items-center justify-between">
            {/* Online Users */}
            <div className="flex -space-x-spacing-sm">
              {onlineUsers.slice(0, 3).map((user: any) => (
                <PresenceIndicator key={user.id} user={user} size="sm" />
              ))}
              {onlineUsers.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-ds-full bg-fl-text-muted text-tiny font-medium text-white">
                  +{onlineUsers.length - 3}
                </div>
              )}
            </div>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && <TypingIndicator typingUsers={typingUsers} compact={true} />}

            {/* Activity Count */}
            {activities.length > 0 && (
              <div className="flex items-center space-x-1 text-tiny text-fl-text-muted">
                <Icon name="Activity" size={12} />
                <span>{activities.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for live collaboration state
 */
export const useLiveCollaboration = (conversationId: string, currentUserId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("excellent");

  const typing = useTypingIndicator(conversationId, currentUserId);
  const presence = usePresence(conversationId);

  // Simulate connection status
  useEffect(() => {
    setIsConnected(true);

    // Simulate occasional connection quality changes
    const interval = setInterval(() => {
      const qualities: (typeof connectionQuality)[] = ["excellent", "good", "poor"];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)] || "good";
      setConnectionQuality(randomQuality);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    connectionQuality,
    ...typing,
    ...presence,
  };
};
