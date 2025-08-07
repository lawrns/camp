import * as React from 'react';
import { useMemo } from 'react';
import { Button } from 'components/ui/Button-unified';
import { Badge } from 'components/unified-ui/components/Badge';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'unread' | 'assigned' | 'urgent' | 'ai';

type FilterTabsProps = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  conversationCount: number;
  unreadCount: number;
  className?: string;
};

export function FilterTabs({
  activeFilter,
  onFilterChange,
  conversationCount,
  unreadCount,
  className,
}: FilterTabsProps) {
  const filters = useMemo(() => [
    { key: 'all' as FilterType, label: 'All', count: conversationCount },
    { key: 'unread' as FilterType, label: 'Unread', count: unreadCount },
    { key: 'assigned' as FilterType, label: 'Assigned to me' },
    { key: 'urgent' as FilterType, label: 'Urgent' },
    { key: 'ai' as FilterType, label: 'AI' },
  ], [conversationCount, unreadCount]);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            'h-8 px-3 text-sm font-medium rounded-md transition-colors',
            activeFilter === filter.key
              ? 'bg-[var(--ds-color-primary-100)] text-[var(--ds-color-primary-800)] hover:bg-[var(--ds-color-primary-200)]'
              : 'text-[var(--ds-color-text)] hover:text-[var(--ds-color-primary-700)] hover:bg-[var(--ds-color-primary-50)]'
          )}
        >
          <div className="flex items-center gap-1 flex-nowrap">
            {filter.key === 'ai' && <Bot className="h-3.5 w-3.5 flex-shrink-0 text-[var(--ds-color-primary-600)]" />}
            <span className="whitespace-nowrap">{filter.label}</span>
          </div>
          {filter.count !== undefined && filter.count > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                'ml-1 h-4 px-1 text-xs',
                activeFilter === filter.key
                  ? 'bg-[var(--ds-color-primary-200)] text-[var(--ds-color-primary-800)]'
                  : 'bg-[var(--ds-color-neutral-200)] text-[var(--ds-color-text)]'
              )}
            >
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}