"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  House, 
  ChatCircle, 
  Lifebuoy 
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type WidgetTabType = "home" | "messages" | "help";

interface WidgetBottomTabsProps {
  activeTab: WidgetTabType;
  onTabChange: (tab: WidgetTabType) => void;
  className?: string;
}

export const WidgetBottomTabs: React.FC<WidgetBottomTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  className = "" 
}) => {
  const tabs = [
    { 
      id: "home" as WidgetTabType, 
      label: "Home", 
      icon: House,
      description: "Welcome & Quick Actions"
    },
    { 
      id: "messages" as WidgetTabType, 
      label: "Messages", 
      icon: ChatCircle,
      description: "Chat with Support"
    },
    { 
      id: "help" as WidgetTabType, 
      label: "Help", 
      icon: Lifebuoy,
      description: "FAQ & Knowledge Base"
    },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2",
      "flex justify-around items-center",
      "shadow-lg",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200",
              "min-w-[60px] min-h-[60px]",
              "focus:outline-none focus:ring-2 focus:ring-blue-300",
              isActive 
                ? "bg-blue-50 text-blue-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
            aria-pressed={isActive}
            role="tab"
            aria-selected={isActive}
            aria-label={`${tab.label} - ${tab.description}`}
            tabIndex={isActive ? 0 : -1}
          >
            {/* Icon */}
            <Icon 
              size={20} 
              weight={isActive ? "duotone" : "regular"}
              className="mb-1"
            />
            
            {/* Label */}
            <span className={cn(
              "text-xs font-medium",
              isActive ? "text-blue-600" : "text-gray-500"
            )}>
              {tab.label}
            </span>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                layoutId="activeIndicator"
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

export default WidgetBottomTabs;
