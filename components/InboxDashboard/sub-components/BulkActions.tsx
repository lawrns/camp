// Professional Bulk Actions Component
// Provides bulk operations for multiple conversations

import { useState } from 'react';
import { Check, X, Tag, Flag, Clock, Archive, Trash, Users, Download } from '@phosphor-icons/react';
import type { Conversation } from '../types';

interface BulkActionsProps {
  selectedConversations: string[];
  conversations: Conversation[];
  onClearSelection: () => void;
  onBulkUpdate: (conversationIds: string[], updates: Partial<Conversation>) => Promise<void>;
  onBulkDelete: (conversationIds: string[]) => Promise<void>;
  onBulkExport: (conversationIds: string[]) => Promise<void>;
  className?: string;
}

const BULK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: Flag },
  { value: 'medium', label: 'Medium', icon: Flag },
  { value: 'high', label: 'High', icon: Flag },
  { value: 'urgent', label: 'Urgent', icon: Flag },
  { value: 'critical', label: 'Critical', icon: Flag }
];

const BULK_STATUS_OPTIONS = [
  { value: 'open', label: 'Open', icon: Clock },
  { value: 'in_progress', label: 'In Progress', icon: Clock },
  { value: 'waiting', label: 'Waiting', icon: Clock },
  { value: 'resolved', label: 'Resolved', icon: Check },
  { value: 'closed', label: 'Closed', icon: Archive }
];

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedConversations,
  conversations,
  onClearSelection,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const selectedCount = selectedConversations.length;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkAction = async (action: string, value?: unknown) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'priority':
          await onBulkUpdate(selectedConversations, { priority: value });
          break;
        case 'status':
          await onBulkUpdate(selectedConversations, { status: value });
          break;
        case 'archive':
          await onBulkUpdate(selectedConversations, { status: 'closed' });
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedCount} conversation(s)?`)) {
            await onBulkDelete(selectedConversations);
          }
          break;
        case 'export':
          await onBulkExport(selectedConversations);
          break;
      }
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsLoading(false);
      setShowPriorityMenu(false);
      setShowStatusMenu(false);
      setShowAssignMenu(false);
    }
  };

  return (
    <div className={`bulk-actions bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span className="typography-body font-medium text-blue-900">
              {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Actions */}
            <div className="relative">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                disabled={isLoading}
                className="btn-secondary mobile-friendly-button text-xs touch-target"
                aria-label="Set priority for selected conversations"
              >
                <Flag className="h-4 w-4" />
                Priority
              </button>
              {showPriorityMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                  {BULK_PRIORITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleBulkAction('priority', option.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <option.icon className="h-4 w-4 inline mr-2" />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Actions */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isLoading}
                className="btn-secondary text-xs"
              >
                <Clock className="h-4 w-4" />
                Status
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                  {BULK_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleBulkAction('status', option.value)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <option.icon className="h-4 w-4 inline mr-2" />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => handleBulkAction('archive')}
              disabled={isLoading}
              className="btn-secondary text-xs"
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>

            <button
              onClick={() => handleBulkAction('export')}
              disabled={isLoading}
              className="btn-secondary text-xs"
            >
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              onClick={() => handleBulkAction('delete')}
              disabled={isLoading}
              className="btn-secondary text-xs text-red-600 hover:bg-red-50"
            >
              <Trash className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <button
          onClick={onClearSelection}
          className="btn-ghost p-1"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="mt-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="typography-metadata text-blue-700">Processing...</span>
        </div>
      )}
    </div>
  );
};
