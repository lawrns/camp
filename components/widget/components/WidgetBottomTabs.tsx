"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { House, MessageCircle, HelpCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { SPACING, COLORS, RADIUS, LAYOUT, ANIMATIONS } from '../design-system/tokens';

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
      icon: MessageCircle,
      description: "Chat with Support"
    },
    { 
      id: "help" as WidgetTabType, 
      label: "Help", 
      icon: HelpCircle,
      description: "FAQ & Knowledge Base"
    },
  ];

  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 flex justify-around items-center",
        "shadow-lg z-10",
        className
      )}
      style={{
        height: LAYOUT.tabBar.height,
        padding: LAYOUT.tabBar.padding,
        backgroundColor: 'white',
        borderTop: `1px solid ${COLORS.border}`,
        borderBottomLeftRadius: RADIUS.widget,
        borderBottomRightRadius: RADIUS.widget,
      }}
      data-campfire-widget-tabs
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center justify-center transition-all",
              "focus:outline-none focus:ring-2",
              "min-w-[60px] min-h-[60px]"
            )}
            style={{
              padding: SPACING.sm,
              borderRadius: RADIUS.button,
              transitionDuration: ANIMATIONS.normal,
              backgroundColor: isActive ? COLORS.primary[50] : 'transparent',
              color: isActive ? COLORS.primary[600] : COLORS.agent.timestamp,
            }}
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
            <span 
              className="text-xs font-medium"
              style={{
                color: isActive ? COLORS.primary[600] : COLORS.agent.timestamp,
                fontSize: '11px',
                lineHeight: '14px',
              }}
            >
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
