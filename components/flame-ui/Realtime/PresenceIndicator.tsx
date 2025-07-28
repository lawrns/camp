/**
 * PresenceIndicator Component
 *
 * Shows real-time user presence with animated status indicators
 * Supports online, away, busy, and offline states with smart tooltips
 */

import React, { useEffect, useState } from "react";
import { Icon } from "../Icon";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status: PresenceStatus;
  lastSeen?: Date;
  isCurrentUser?: boolean;
}

interface PresenceIndicatorProps {
  /** User to show presence for */
  user: PresenceUser;
  /** Size of the indicator */
  size?: "sm" | "md" | "lg";
  /** Show status text */
  showStatus?: boolean;
  /** Show last seen time */
  showLastSeen?: boolean;
  /** Custom className */
  className?: string;
}

const statusConfig = {
  online: {
    color: "bg-fl-status-ok",
    label: "Online",
    icon: "circle",
    pulse: true,
  },
  away: {
    color: "bg-fl-status-warn",
    label: "Away",
    icon: "moon",
    pulse: false,
  },
  busy: {
    color: "bg-fl-status-late",
    label: "Busy",
    icon: "minus-circle",
    pulse: false,
  },
  offline: {
    color: "bg-fl-text-muted",
    label: "Offline",
    icon: "circle",
    pulse: false,
  },
};

const sizeConfig = {
  sm: {
    avatar: "w-6 h-6",
    indicator: "w-2 h-2",
    text: "text-xs",
    position: "-bottom-0.5 -right-0.5",
  },
  md: {
    avatar: "w-8 h-8",
    indicator: "w-2.5 h-2.5",
    text: "text-sm",
    position: "-bottom-0.5 -right-0.5",
  },
  lg: {
    avatar: "w-12 h-12",
    indicator: "w-3 h-3",
    text: "text-base",
    position: "-bottom-1 -right-1",
  },
};

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  user,
  size = "md",
  showStatus = false,
  showLastSeen = false,
  className = "",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = statusConfig[user.status];
  const sizeConf = sizeConfig[size];

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen || user.status === "online") return null;

    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Avatar */}
      <div className={`relative ${sizeConf.avatar}`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className={`${sizeConf.avatar} rounded-ds-full object-cover`} />
        ) : (
          <div
            className={`${sizeConf.avatar} flex items-center justify-center rounded-ds-full bg-fl-brand font-medium text-white ${sizeConf.text}`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Status Indicator */}
        <div
          className={`absolute ${sizeConf.position} ${sizeConf.indicator} ${config.color} border-fl-bg-base rounded-ds-full border-2`}
        >
          {config.pulse && user.status === "online" && (
            <div className={`absolute inset-0 ${config.color} animate-ping rounded-ds-full opacity-75`} />
          )}
        </div>

        {/* Current User Indicator */}
        {user.isCurrentUser && (
          <div className="border-fl-bg-base absolute -left-1 -top-1 h-3 w-3 rounded-ds-full border-2 bg-fl-brand">
            <Icon name="User" size={10} className="text-white" />
          </div>
        )}
      </div>

      {/* Status Text */}
      {(showStatus || showLastSeen) && (
        <div className="ml-3">
          <div className={`font-medium text-fl-text ${sizeConf.text}`}>{user.name}</div>

          {showStatus && (
            <div className={`text-fl-text-muted ${sizeConf.text} flex items-center space-x-1`}>
              <div className={`h-1.5 w-1.5 ${config.color} rounded-ds-full`} />
              <span>{config.label}</span>
            </div>
          )}

          {showLastSeen && formatLastSeen(user.lastSeen) && (
            <div className={`text-fl-text-muted ${sizeConf.text}`}>{formatLastSeen(user.lastSeen)}</div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="text-fl-bg-base absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-ds-lg bg-fl-text px-3 py-2 text-sm shadow-card-deep">
          <div className="font-medium">{user.name}</div>
          <div className="text-tiny opacity-90">
            {config.label}
            {formatLastSeen(user.lastSeen) && ` • ${formatLastSeen(user.lastSeen)}`}
          </div>

          {/* Tooltip Arrow */}
          <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-fl-text" />
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing user presence
 */
export const usePresence = (conversationId?: string) => {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null);

  // Set current user status
  const setStatus = (status: PresenceStatus) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, status });
    }
  };

  // Initialize with mock data
  useEffect(() => {
    const mockUsers: PresenceUser[] = [
      {
        id: "current-user",
        name: "You",
        status: "online",
        isCurrentUser: true,
      },
      {
        id: "user-1",
        name: "Alice Johnson",
        email: "alice@company.com",
        status: "online",
      },
      {
        id: "user-2",
        name: "Bob Smith",
        email: "bob@company.com",
        status: "away",
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
      },
    ];

    setUsers(mockUsers);
    setCurrentUser(mockUsers[0] || null);
  }, []);

  const onlineUsers = users.filter((u: any) => u.status === "online");
  const awayUsers = users.filter((u: any) => u.status === "away");
  const busyUsers = users.filter((u: any) => u.status === "busy");
  const offlineUsers = users.filter((u: any) => u.status === "offline");

  return {
    users,
    currentUser,
    onlineUsers,
    awayUsers,
    busyUsers,
    offlineUsers,
    setStatus,
    totalOnline: onlineUsers.length,
    totalUsers: users.length,
  };
};
