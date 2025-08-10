/**
 * Status Dropdown Component - Missing component identified in testing
 * Provides agent status management functionality
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusDropdownProps {
  currentStatus?: 'online' | 'away' | 'busy' | 'offline';
  onStatusChange?: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  className?: string;
}

const StatusDropdown = React.memo(({ 
  currentStatus = 'online', 
  onStatusChange,
  className = ''
}: StatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions = [
    { 
      value: 'online', 
      label: 'Online', 
      color: 'bg-green-500',
      description: 'Available for new conversations'
    },
    { 
      value: 'away', 
      label: 'Away', 
      color: 'bg-yellow-500',
      description: 'Temporarily unavailable'
    },
    { 
      value: 'busy', 
      label: 'Busy', 
      color: 'bg-red-500',
      description: 'Do not disturb'
    },
    { 
      value: 'offline', 
      label: 'Offline', 
      color: 'bg-gray-500',
      description: 'Not available'
    },
  ] as const;

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

  const handleStatusSelect = (status: typeof currentStatus) => {
    setIsOpen(false);
    onStatusChange?.(status);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-3"
        data-testid="status-dropdown"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Circle className={`h-3 w-3 ${currentStatusOption?.color} rounded-full`} />
        <span className="text-sm font-medium">{currentStatusOption?.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50"
              data-testid="status-dropdown-menu"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  Set your status
                </div>
                
                {statusOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`
                      w-full flex items-start gap-3 px-2 py-2 rounded-md text-left transition-colors
                      ${currentStatus === option.value 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    data-testid={`status-option-${option.value}`}
                  >
                    <Circle className={`h-3 w-3 ${option.color} rounded-full mt-0.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                    {currentStatus === option.value && (
                      <div className="text-xs text-primary">✓</div>
                    )}
                  </motion.button>
                ))}
              </div>
              
              <div className="border-t border-border p-2">
                <div className="text-xs text-muted-foreground px-2">
                  Your status is visible to team members and affects conversation routing.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

StatusDropdown.displayName = 'StatusDropdown';

export { StatusDropdown };
