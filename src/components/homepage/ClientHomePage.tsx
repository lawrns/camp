"use client";

import { useEffect } from "react";
import Homepage from "./Homepage";

// Type declarations for Widget V2 are still useful here for type safety
declare global {
  interface Window {
    CampfireWidgetConfig?: {
      organizationId: string;
      apiKey?: string;
      apiUrl?: string;
      supabaseUrl?: string;
      supabaseAnonKey?: string;
      companyName?: string;
      greeting?: string;
      debug?: boolean;
      primaryColor?: string;
      position?: string;
    };
    CampfireWidget?: any;
    __campfireWidgetInstance?: any;
    __campfireWidgetInitialized?: boolean;
  }
}

export default function ClientHomePage() {
  // Ensure body can scroll on homepage
  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.overflowX = "auto";
    document.body.style.overflowY = "auto";
  }, []);

  return (
    <div>
      <Homepage />

      {/* Widget is now handled by React components via WidgetProvider in app/page.tsx */}
    </div>
  );
}
