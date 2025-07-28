import React from "react";
import { SkipNavigation } from "@/lib/accessibility/components";

interface AccessibleLayoutProps {
  children: React.ReactNode;
  hasNavigation?: boolean;
  hasSidebar?: boolean;
}

export const AccessibleLayout: React.FC<AccessibleLayoutProps> = ({
  children,
  hasNavigation = true,
  hasSidebar = false,
}) => {
  return (
    <>
      <SkipNavigation />

      {hasNavigation && (
        <nav id="navigation" role="navigation" aria-label="Main navigation">
          {/* Navigation content will be injected here */}
        </nav>
      )}

      <div className="flex">
        {hasSidebar && (
          <aside role="complementary" aria-label="Sidebar">
            {/* Sidebar content will be injected here */}
          </aside>
        )}

        <main id="main-content" role="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </div>
    </>
  );
};
