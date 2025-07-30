'use client';

import { Suspense } from 'react';
import SidebarWrapper from '@/components/layout/SidebarWrapper';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Suspense fallback={
          <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
            <div className="animate-pulse p-4">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <SidebarWrapper />
        </Suspense>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onOpenChange={setIsMobileSidebarOpen}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
