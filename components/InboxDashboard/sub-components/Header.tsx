// Header component for inbox dashboard

import { Search, Plus } from "lucide-react";
import * as React from "react";
import { memo } from "react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Header component with search, filters, and actions - memoized for performance
 */
export const Header: React.FC<HeaderProps> = memo(({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  searchInputRef,
}) => {
  // Handle search with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0" role="banner" data-testid="inbox-header">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between px-6 py-4 bg-white">
        {/* Left side - Clean search and filter */}
        <div className="flex items-center gap-3 flex-1 max-w-2xl" role="search">
          {/* Clean search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 focus:outline-none"
              aria-label="Search conversations"
              role="searchbox"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Search through your conversations by customer name, message content, or status
            </div>
          </div>

          {/* Simple filter dropdown */}
          <label htmlFor="status-filter" className="sr-only">Filter conversations by status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-700"
            aria-label="Filter conversations by status"
          >
            <option value="">All conversations</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Right side - Clean actions only */}
        <div className="flex items-center gap-3">
          {/* New conversation button only */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="Start new conversation"
            type="button"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            New
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
