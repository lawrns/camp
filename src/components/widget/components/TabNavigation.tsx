/**
 * Tab Navigation Component
 *
 * Split from Panel.tsx for HMR optimization
 * Handles tab switching between chat, FAQ, and help
 */

import React from "react";
import { OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { ChatCircle, Question, Lifebuoy } from "../icons/OptimizedIcons";

export type TabType = "chat" | "faq" | "help";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, className = "" }) => {
  const tabs = [
    { id: "chat" as TabType, label: "Chat", icon: ChatCircle },
    { id: "faq" as TabType, label: "FAQ", icon: Question },
    { id: "help" as TabType, label: "Help", icon: Lifebuoy },
  ];

  return (
    <div className={`flex border-b border-[var(--fl-color-border-subtle)] ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex flex-1 items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            aria-pressed={isActive}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
          >
            <Icon size={18} weight={isActive ? "duotone" : "regular"} />
            <span>{tab.label}</span>

            {/* Active tab indicator */}
            {isActive && (
              <OptimizedMotion.div
                className="bg-primary absolute bottom-0 left-0 right-0 h-0.5"
                layoutId="activeTab"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
