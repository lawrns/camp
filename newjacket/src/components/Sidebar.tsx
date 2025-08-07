import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  MessageSquare, 
  Users, 
  AtSign, 
  UserMinus, 
  Archive,
  Settings,
  Zap,
  User,
  Info,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ activeSection, setActiveSection, isCollapsed, setIsCollapsed }: SidebarProps) {
  const menuItems = [
    { id: 'inbox', icon: Inbox, label: 'Inbox', count: 46 },
    { id: 'conversations', icon: MessageSquare, label: 'Conversations', count: 19 },
    { id: 'mentions', icon: AtSign, label: 'Mentions', count: 0 },
    { id: 'unassigned', icon: UserMinus, label: 'Unassigned', count: 13 },
    { id: 'all', icon: Users, label: 'All', count: 46 },
  ];

  const bottomItems = [
    { id: 'automation', icon: Zap, label: 'Automation' },
    { id: 'preferences', icon: Settings, label: 'Your preferences' },
    { id: 'about', icon: Info, label: 'About' },
  ];

  const sidebarVariants = {
    expanded: { width: 288 },
    collapsed: { width: 64 }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <motion.div 
      className="bg-card border-r border-border flex flex-col relative"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
      >
        {isCollapsed ? <Menu className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </Button>

      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Inbox className="h-5 w-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h1 
                className="text-xl font-semibold text-foreground"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                Inbox
              </motion.h1>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full justify-start h-auto py-2.5 px-3",
                  isCollapsed && "px-2 justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div 
                      className="flex items-center justify-between w-full ml-3"
                      variants={contentVariants}
                      initial="collapsed"
                      animate="expanded"
                      exit="collapsed"
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.count !== undefined && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.count}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-border">
          <nav className="space-y-2">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full justify-start h-auto py-2.5 px-3",
                    isCollapsed && "px-2 justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span 
                        className="font-medium ml-3"
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "flex items-center space-x-3",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span 
                className="font-medium text-foreground"
                variants={contentVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={{ duration: 0.2 }}
              >
                You
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}