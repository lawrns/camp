"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Mobile layout - simplified without navigation
  if (isMobile) {
    return <div className="safe-area-pb min-h-screen">{children}</div>;
  }

  // Tablet and Desktop layout
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className={cn("flex flex-1 flex-col overflow-hidden", className)}>{children}</div>
    </div>
  );
}
