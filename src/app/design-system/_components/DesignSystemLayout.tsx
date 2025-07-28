import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/ui/design-system';

type DesignSystemLayoutProps = {
  children: React.ReactNode;
};

const navigation = [
  { name: 'Overview', href: '/design-system' },
  { name: 'Colors', href: '/design-system/colors' },
  { name: 'Typography', href: '/design-system/typography' },
  { name: 'Spacing', href: '/design-system/spacing' },
  { name: 'Components', href: '/design-system/components' },
];

export function DesignSystemLayout({ children }: DesignSystemLayoutProps) {
  return (
    <div className="min-h-screen bg-ds-color-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-ds-color-border overflow-y-auto bg-ds-color-surface">
          <div className="flex items-center flex-shrink-0 px-6 py-4">
            <h1 className="text-xl font-bold text-ds-color-text">Campfire DS</h1>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-md',
                    'text-ds-color-text-muted hover:bg-ds-color-background-muted hover:text-ds-color-text',
                    'transition-colors duration-150'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DesignSystemLayout;
