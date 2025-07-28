"use client";

import React from "react";

interface DefinitiveButtonProps {
  onClick: () => void;
  isOpen: boolean;
  messageCount?: number;
}

export const DefinitiveButton: React.FC<DefinitiveButtonProps> = ({
  onClick,
  isOpen,
  messageCount = 0
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-4 right-4 z-[9998]
        w-14 h-14 bg-ds-color-primary-600 hover:bg-ds-color-primary-700
        text-white ds-rounded-ds-full shadow-lg
        flex items-center justify-center
        transition-all duration-200 ease-out
        ${isOpen ? 'scale-95' : 'scale-100 hover:scale-105'}
        focus:outline-none focus:ring-4 focus:ring-ds-color-primary-300
      `}
      data-testid="widget-button"
      data-campfire-widget-button
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      {/* Chat Icon with smooth rotation */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {isOpen ? (
          // Close icon (X)
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // Chat icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        )}
      </div>

      {/* Message count badge */}
      {messageCount > 0 && !isOpen && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-tiny font-bold rounded-ds-full w-6 h-6 flex items-center justify-center animate-pulse">
          {messageCount > 99 ? '99+' : messageCount}
        </div>
      )}

      {/* Pulse animation when closed */}
      {!isOpen && (
        <div className="absolute inset-0 bg-primary rounded-ds-full animate-ping opacity-20"></div>
      )}
    </button>
  );
};
