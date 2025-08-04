import React from "react";
import { ChatCircle, Users, Gear, Bell } from "@phosphor-icons/react";

interface BottomNavProps {
  activeTab: "conversations" | "customers" | "settings" | "notifications";
  onTabChange: (tab: "conversations" | "customers" | "settings" | "notifications") => void;
  unreadCount?: number;
  className?: string;
}

/**
 * Bottom navigation component for mobile layout
 * Extracted from main InboxDashboard for better separation of concerns
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount = 0,
  className = "",
}) => {
  const tabs = [
    {
      id: "conversations" as const,
      label: "Conversations",
      icon: ChatCircle,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: "customers" as const,
      label: "Customers",
      icon: Users,
    },
    {
      id: "notifications" as const,
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "settings" as const,
      label: "Settings",
      icon: Gear,
    },
  ];

  return (
    <div className={`bg-white border-t border-gray-200 px-2 py-1 ${className}`}>
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative ${
                isActive
                  ? "text-[var(--ds-color-primary-500)] bg-[var(--ds-color-primary-50)]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              aria-label={tab.label}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              
              {/* Badge for unread count */}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
