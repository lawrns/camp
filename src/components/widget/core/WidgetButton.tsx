"use client";

/**
 * Widget Button - Ultra-Lightweight Core Component
 * Target: <2KB bundle size
 */

import React from "react";

interface WidgetButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export const WidgetButton: React.FC<WidgetButtonProps> = ({ onClick, isOpen, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-14 w-14 transform items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 ${isOpen ? "rotate-45" : ""} ${className}`}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isOpen ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </>
        ) : (
          <>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <circle cx="9" cy="10" r="1"></circle>
            <circle cx="15" cy="10" r="1"></circle>
          </>
        )}
      </svg>
      {!isOpen && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>}
    </button>
  );
};
