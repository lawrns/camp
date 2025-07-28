"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Create a wrapper that ensures OptimizedMotion is loaded before Sidebar
const SidebarWithMotion = dynamic(() => import("./Sidebar").then((mod) => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="border-ds-border bg-background relative flex h-full w-64 flex-shrink-0 flex-col overflow-hidden border-r">
      <div className="animate-pulse">
        <div className="bg-background h-16"></div>
        <div className="space-y-spacing-sm spacing-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-background h-10 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  ),
});

// Export a wrapper component that handles the dynamic loading
export default function SidebarWrapper(props: any) {
  return (
    <Suspense
      fallback={
        <div className="border-ds-border bg-background relative flex h-full w-64 flex-shrink-0 flex-col overflow-hidden border-r">
          <div className="animate-pulse">
            <div className="bg-background h-16"></div>
            <div className="space-y-spacing-sm spacing-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-background h-10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SidebarWithMotion {...props} />
    </Suspense>
  );
}
