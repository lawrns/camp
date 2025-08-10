/**
 * Enhanced Sidebar Component - Extracted from InboxDashboard for performance
 * Prevents remounting on every state change
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, Users, MessageSquare, Archive, Settings } from 'lucide-react';

interface EnhancedSidebarProps {
  filteredConversations: any[];
  conversations: any[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  isCollapsed: boolean;
}

const EnhancedSidebar = React.memo(({ 
  filteredConversations, 
  conversations, 
  activeFilter, 
  onFilterChange,
  isCollapsed 
}: EnhancedSidebarProps) => {
  // Derived counts for sidebar sections
  const inboxCount = filteredConversations.filter((c) => c.status === 'open').length;
  const unassignedCount = filteredConversations.filter((c) => !c.assigneeId).length;
  const allCount = conversations?.length || 0;

  const sidebarVariants = {
    expanded: { width: '280px', opacity: 1 },
    collapsed: { width: '80px', opacity: 0.9 }
  };

  const menuItems = [
    { id: 'all', label: 'All Conversations', icon: MessageSquare, count: allCount },
    { id: 'unread', label: 'Unread', icon: Inbox, count: inboxCount },
    { id: 'unassigned', label: 'Unassigned', icon: Users, count: unassignedCount },
    { id: 'ai-managed', label: 'AI Managed', icon: MessageSquare, count: 0 },
    { id: 'human-managed', label: 'Human Managed', icon: Users, count: 0 },
    { id: 'archived', label: 'Archived', icon: Archive, count: 0 },
  ];

  return (
    <motion.div
      className="bg-card border-r border-border flex flex-col"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      initial={false}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className={`font-semibold text-foreground ${isCollapsed ? 'text-center text-sm' : 'text-lg'}`}>
          {isCollapsed ? 'Inbox' : 'Conversations'}
        </h2>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2" data-testid="filter-buttons">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeFilter === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onFilterChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors mb-1
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={false}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.count > 0 && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full
                      ${isActive 
                        ? 'bg-primary-foreground text-primary' 
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-border">
        <motion.button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={false}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </motion.button>
      </div>
    </motion.div>
  );
});

EnhancedSidebar.displayName = 'EnhancedSidebar';

export { EnhancedSidebar };
