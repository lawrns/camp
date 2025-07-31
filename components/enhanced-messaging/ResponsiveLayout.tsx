"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Menu } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Breakpoint detection hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Mobile-first responsive container
export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'max-w-4xl'
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div className={cn(
      'w-full mx-auto px-4 sm:px-6 lg:px-8',
      maxWidth,
      className
    )}>
      {children}
    </div>
  );
}

// Responsive grid system
export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'gap-4',
  className
}: {
  children: React.ReactNode;
  cols?: { mobile: number; tablet: number; desktop: number };
  gap?: string;
  className?: string;
}) {
  const gridCols = `grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div className={cn('grid', gridCols, gap, className)}>
      {children}
    </div>
  );
}

// Mobile drawer component
export function MobileDrawer({
  isOpen,
  onClose,
  children,
  title,
  position = 'right',
  className
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getDrawerStyles = () => {
    switch (position) {
      case 'left':
        return {
          container: 'inset-y-0 left-0',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: 'w-80 max-w-[80vw]',
        };
      case 'bottom':
        return {
          container: 'inset-x-0 bottom-0',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          width: 'w-full max-h-[80vh]',
        };
      default: // right
        return {
          container: 'inset-y-0 right-0',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          width: 'w-80 max-w-[80vw]',
        };
    }
  };

  const styles = getDrawerStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, transform: styles.transform }}
            animate={{ opacity: 1, transform: 'translate(0)' }}
            exit={{ opacity: 0, transform: styles.transform }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              'fixed bg-background shadow-xl z-50 flex flex-col',
              styles.container,
              styles.width,
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">{title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mobile-optimized message composer
export function MobileComposer({
  children,
  isExpanded,
  onToggleExpand,
  className
}: {
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layout
      className={cn(
        'bg-background border-t',
        isExpanded ? 'fixed inset-x-0 bottom-0 z-40 max-h-[60vh]' : 'relative',
        className
      )}
    >
      {isExpanded && (
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-medium">Compose Message</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className={cn(
        'transition-all duration-200',
        isExpanded ? 'p-4' : 'p-3'
      )}>
        {children}
      </div>
    </motion.div>
  );
}

// Touch-optimized button
export function TouchButton({
  children,
  onClick,
  size = 'default',
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const getSizeClasses = () => {
    if (isMobile) {
      // Larger touch targets on mobile
      switch (size) {
        case 'sm':
          return 'h-10 px-4 text-sm';
        case 'lg':
          return 'h-14 px-8 text-lg';
        default:
          return 'h-12 px-6';
      }
    } else {
      // Standard sizes on desktop
      switch (size) {
        case 'sm':
          return 'h-8 px-3 text-sm';
        case 'lg':
          return 'h-12 px-8 text-lg';
        default:
          return 'h-10 px-4';
      }
    }
  };

  return (
    <Button
      onClick={onClick}
      className={cn(
        getSizeClasses(),
        'touch-manipulation', // Improves touch responsiveness
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Responsive navigation
export function ResponsiveNavigation({
  items,
  activeItem,
  onItemClick,
  className
}: {
  items: Array<{ id: string; label: string; icon?: React.ComponentType<{ className?: string }> }>;
  activeItem: string;
  onItemClick: (itemId: string) => void;
  className?: string;
}) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (isMobile) {
    // Bottom navigation on mobile
    return (
      <div className={cn(
        'fixed bottom-0 inset-x-0 bg-background border-t z-30',
        'flex items-center justify-around py-2',
        className
      )}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                'min-w-[60px] touch-manipulation',
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Sidebar navigation on desktop
  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
              isActive 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Responsive layout wrapper
export function ResponsiveLayout({
  sidebar,
  main,
  header,
  footer,
  sidebarWidth = 'w-64',
  className
}: {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: string;
  className?: string;
}) {
  const breakpoint = useBreakpoint();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = breakpoint === 'mobile';

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            {isMobile && sidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {header}
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {isMobile ? (
              <MobileDrawer
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                position="left"
                title="Navigation"
              >
                {sidebar}
              </MobileDrawer>
            ) : (
              <aside className={cn('sticky top-0 h-screen border-r bg-gray-50', sidebarWidth)}>
                <div className="p-4">
                  {sidebar}
                </div>
              </aside>
            )}
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {main}
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer className="border-t bg-gray-50">
          {footer}
        </footer>
      )}
    </div>
  );
}
