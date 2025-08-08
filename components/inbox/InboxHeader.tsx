"use client";

import React, { useState } from "react";
import { 
  Bell,
  Menu,
  X
} from "lucide-react";
import { useGreeting, useUserName } from "@/hooks/useGreeting";
import { useAuth } from "@/hooks/useAuth";
import { 
  headerButtonClasses,
  mobileClasses 
} from "@/lib/utils/badge-styles";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface InboxHeaderProps {
  onNotifications?: () => void;
}

export function InboxHeader({ onNotifications }: InboxHeaderProps) {
  const { user } = useAuth();
  const greeting = useGreeting();
  const userName = useUserName(user);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side: Greeting and description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-sm text-gray-600 hidden sm:block">
            Manage customer conversations and support requests
          </p>
        </div>

        {/* Right side: Avatar with dropdown and notifications */}
        <div className={`flex items-center gap-2 sm:gap-3 ${mobileClasses.hidden}`}>
          <button 
            onClick={onNotifications}
            className={headerButtonClasses.notification}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>
          {/* Avatar dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button aria-label="User menu" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold select-none hover:bg-gray-300">
                {userName?.charAt(0) ?? "U"}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 rounded-md border border-gray-200 bg-white shadow-md py-1">
              <DropdownMenu.Item onSelect={(e) => { e.preventDefault(); onNotifications?.(); }} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                Notifications
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`${mobileClasses.visible} p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors`}
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* No mobile search/filters here; search and filters live in Conversation List */}

      {/* Mobile menu: only notifications for now */}
      {showMobileMenu && (
        <div className={`mt-4 ${mobileClasses.visible} space-y-2`}>
          <button 
            onClick={onNotifications}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </div>
      )}
    </div>
  );
}
