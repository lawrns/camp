"use client";

import Homepage from "./Homepage";

// Widget configuration is now handled by React components via WidgetProvider

export default function ClientHomePage() {
  return (
    <div>
      <Homepage />

      {/* Widget is now handled by React components via WidgetProvider in app/page.tsx */}
    </div>
  );
}
