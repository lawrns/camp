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
        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
