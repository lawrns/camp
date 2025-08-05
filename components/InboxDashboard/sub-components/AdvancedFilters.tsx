// Advanced Filters Component
// Provides comprehensive filtering options for conversations

import { useState, useEffect } from 'react';
import { Funnel, X, Calendar, User, Tag, Flag, Clock } from "lucide-react";

interface FilterOptions {
  status: string[];
  priority: string[];
  assignedTo: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  unreadOnly: boolean;
  aiHandled: boolean;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  currentFilters: Partial<FilterOptions>;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'waiting', label: 'Waiting', color: 'bg-blue-100 text-blue-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-gray-100 text-gray-700' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-200 text-gray-800' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
  { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-800' }
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  onClearFilters,
  currentFilters,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    priority: [],
    assignedTo: [],
    tags: [],
    dateRange: { start: '', end: '' },
    unreadOnly: false,
    aiHandled: false,
    ...currentFilters
  });

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Load available tags and agents
      loadFilterOptions();
    }
  }, [isOpen]);

  const loadFilterOptions = async () => {
    try {
      // Load available tags
      const tagsResponse = await fetch('/api/conversations/tags');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setAvailableTags(tagsData.tags || []);
      }

      // Load available agents
      const agentsResponse = await fetch('/api/users/agents');
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json();
        setAvailableAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterOptions, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMultiSelectChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => {
      const currentValues = prev[key] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [key]: newValues
      };
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: FilterOptions = {
      status: [],
      priority: [],
      assignedTo: [],
      tags: [],
      dateRange: { start: '', end: '' },
      unreadOnly: false,
      aiHandled: false
    };
    setFilters(clearedFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.values(value).some(v => v !== '');
    return value === true;
  });

  if (!isOpen) return null;

  return (
    <div className={`advanced-filters fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mobile-padding ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto mobile-full-width">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="typography-section-title flex items-center gap-2">
              <Funnel className="h-5 w-5" />
              Advanced Filters
            </h2>
            <button onClick={onClose} className="btn-ghost p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <label className="typography-body font-medium mb-3 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMultiSelectChange('status', option.value)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      filters.status.includes(option.value)
                        ? option.color
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="typography-body font-medium mb-3 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMultiSelectChange('priority', option.value)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      filters.priority.includes(option.value)
                        ? option.color
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="typography-body font-medium mb-3 block flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="typography-metadata block mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="typography-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="typography-metadata block mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="typography-input w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <label className="typography-body font-medium mb-3 block flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleMultiSelectChange('tags', tag)}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        filters.tags.includes(tag)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Filters */}
            <div>
              <label className="typography-body font-medium mb-3 block">Quick Filters</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.unreadOnly}
                    onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                    className="rounded"
                  />
                  <span className="typography-body">Unread conversations only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.aiHandled}
                    onChange={(e) => handleFilterChange('aiHandled', e.target.checked)}
                    className="rounded"
                  />
                  <span className="typography-body">AI-handled conversations</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="btn-ghost text-sm disabled:opacity-50"
            >
              Clear All
            </button>
            <div className="flex items-center gap-3 mobile-stack">
              <button onClick={onClose} className="btn-secondary mobile-friendly-button touch-target mobile-full-width" aria-label="Cancel filter changes">
                Cancel
              </button>
              <button onClick={handleApply} className="btn-primary mobile-friendly-button touch-target mobile-full-width" aria-label="Apply selected filters">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
