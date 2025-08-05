import React from 'react';
import { House, MessageCircle, HelpCircle } from "lucide-react";
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: 'home' | 'messages' | 'help';
  onTabChange: (tab: 'home' | 'messages' | 'help') => void;
  className?: string;
}

export function BottomNavigation({ activeTab, onTabChange, className }: BottomNavigationProps) {
  const tabs = [
    { id: 'home' as const, icon: House, label: 'Home' },
    { id: 'messages' as const, icon: MessageCircle, label: 'Messages' },
    { id: 'help' as const, icon: HelpCircle, label: 'Help' }
  ];

  return (
    <div className={cn(
      'bg-white border-t border-gray-200 px-4 py-2',
      className
    )} data-testid="bottom-navigation">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
                    <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          data-testid={`tab-${tab.id}`}
          className={cn(
            'flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors',
            isActive && 'text-green-500',
            !isActive && 'text-gray-400 hover:text-gray-600'
          )}
        >
              <Icon className={cn(
                'w-6 h-6',
                isActive && 'text-green-500',
                !isActive && 'text-gray-400'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'text-green-500',
                !isActive && 'text-gray-400'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
} 