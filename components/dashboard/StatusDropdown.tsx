'use client';

import React, { useState } from 'react';
import { ChevronDown, Circle } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus?: 'online' | 'away' | 'offline';
  onStatusChange?: (status: 'online' | 'away' | 'offline') => void;
  className?: string;
}

export function StatusDropdown({ 
  currentStatus = 'online', 
  onStatusChange,
  className = '' 
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { value: 'online', label: 'Online', color: 'bg-green-500' },
    { value: 'away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500' }
  ] as const;

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  const handleStatusSelect = (status: 'online' | 'away' | 'offline') => {
    try {
      // Broadcast to other tabs/windows (customer widget) via localStorage
      localStorage.setItem('campfire-agent-status', status);
    } catch {}
    onStatusChange?.(status);
    setIsOpen(false);
    console.log('[StatusDropdown] Status changed to:', status);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        data-testid="status-dropdown"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Circle className={`w-3 h-3 ${currentStatusOption.color} rounded-full`} />
        <span>{currentStatusOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusSelect(option.value)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              data-testid={`status-${option.value}`}
            >
              <Circle className={`w-3 h-3 ${option.color} rounded-full`} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* E2E test hooks: reflect current status with hidden test ids */}
      <span data-testid={currentStatus === 'away' ? 'agent-status-away' : 'agent-status-online'} className="sr-only">
        {currentStatus === 'away' ? 'Away' : 'Online'}
      </span>
    </div>
  );
}

export default StatusDropdown;
