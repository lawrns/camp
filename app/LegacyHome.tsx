"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { WidgetProvider } from "@/components/widget";

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
        <div className="min-h-screen home-page">
            {/* Beautiful Homepage with operator.png and rag.png */}
            <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-pulse bg-blue-200 h-8 w-48 rounded mx-auto mb-4"></div>
                        <div className="animate-pulse bg-gray-200 h-4 w-64 rounded mx-auto"></div>
                    </div>
                </div>
            }>
                <BeautifulHomepage />
            </Suspense>

            {/* Enhanced Campfire Widget - Intercom-Quality Design */}
            <WidgetProvider
                organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd"
                debug={false}
            />
        </div>
    );
} 