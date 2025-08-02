"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { EnhancedWidgetProvider } from "@/components/widget/enhanced";
import { ObjectRenderErrorBoundary } from "@/components/error/ObjectRenderErrorBoundary";

// Beautiful Homepage with animations - imported from components
const BeautifulHomepage = dynamic(() => import("../components/homepage/Homepage"), {
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-xl font-semibold text-gray-700">Loading Campfire...</div>
            </div>
        </div>
    ),
    ssr: false
});

/**
 * Legacy Homepage Component
 * 
 * This component now contains the enhanced commie homepage content.
 * The name is kept for backward compatibility but the content has been replaced.
 */
export default function LegacyHome() {
    return (
        <div className="min-h-screen home-page hero-container">
            {/* Beautiful Homepage with operator.png and rag.png */}
            <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-pulse bg-blue-200 h-8 w-48 rounded mx-auto mb-4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 w-64 rounded mx-auto"></div>
                    </div>
                </div>
            }>
                <ObjectRenderErrorBoundary>
                    <BeautifulHomepage />
                </ObjectRenderErrorBoundary>
            </Suspense>

            {/* Enhanced Campfire Widget - Intercom-Quality Design with Tabs */}
            <EnhancedWidgetProvider
                organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd"
                debug={false}
                config={{
                    organizationName: "Campfire",
                    primaryColor: "#6366F1",
                    position: "bottom-right",
                    welcomeMessage: "Hi there! 👋 Welcome to Campfire. How can we help you today?",
                    showWelcomeMessage: true,
                    enableFAQ: true,
                    enableHelp: true,
                    contactInfo: {
                        email: "support@campfire.com",
                        phone: "+1 (555) 123-4567",
                        website: "https://campfire.com",
                        businessHours: {
                            monday: "9:00 AM - 6:00 PM",
                            tuesday: "9:00 AM - 6:00 PM",
                            wednesday: "9:00 AM - 6:00 PM",
                            thursday: "9:00 AM - 6:00 PM",
                            friday: "9:00 AM - 6:00 PM",
                            saturday: "10:00 AM - 4:00 PM",
                            sunday: "Closed"
                        }
                    }
                }}
            />
        </div>
    );
} 