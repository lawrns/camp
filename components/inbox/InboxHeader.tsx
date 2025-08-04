"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Keyboard, 
  Search, 
  Filter,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useGreeting, useUserName } from "@/hooks/useGreeting";
import { useAuth } from "@/hooks/useAuth";
import { 
  headerButtonClasses, 
  searchInputClasses, 
  mobileClasses 
} from "@/lib/utils/badge-styles";

interface InboxHeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onNotifications?: () => void;
  onShortcuts?: () => void;
  onSettings?: () => void;
}

export function InboxHeader({
  onSearch,
  onFilter,
  onNotifications,
  onShortcuts,
  onSettings
}: InboxHeaderProps) {
  const { user } = useAuth();
  const greeting = useGreeting();
  const userName = useUserName(user);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
    setShowSearchDialog(false);
  };

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

        {/* Right side: Desktop controls */}
        <div className={`flex items-center gap-2 sm:gap-4 ${mobileClasses.hidden}`}>
          {/* Search */}
          <div className={searchInputClasses.container}>
            <Search className={searchInputClasses.icon} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={searchInputClasses.input}
            />
          </div>

          {/* Filters */}
          <button 
            onClick={onFilter}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          {/* Notifications */}
          <button 
            onClick={onNotifications}
            className={headerButtonClasses.notification}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Keyboard Shortcuts */}
          <button 
            onClick={onShortcuts}
            className={headerButtonClasses.base}
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button 
            onClick={onSettings}
            className={headerButtonClasses.base}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`${mobileClasses.visible} p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors`}
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile search bar */}
      <div className={`mt-4 ${mobileClasses.visible}`}>
        <div className={searchInputClasses.container}>
          <Search className={searchInputClasses.icon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className={searchInputClasses.input}
          />
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className={`mt-4 ${mobileClasses.visible} space-y-2`}>
          <button 
            onClick={onFilter}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <button 
            onClick={onNotifications}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>

          <button 
            onClick={onShortcuts}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Keyboard className="h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </button>

          <button 
            onClick={onSettings}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </div>
  );
}
