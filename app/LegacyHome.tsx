"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import { Suspense } from "react";

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

            {/* Campfire Intercom-Style Widget - True Intercom-Level Design */}
            <Script
                src={`/widget-intercom.js?v=production-clean-v5&t=${Date.now()}`}
                strategy="afterInteractive"
                data-organization-id="b5e80170-004c-4e82-a88c-3e2166b169dd"
                data-primary-color="#6366F1"
                data-position="bottom-right"
                data-company-name="Campfire"
                data-greeting="Hi there! 👋 Welcome to Campfire. How can we help you today?"
                onLoad={() => {
                    console.log('🔥 Campfire Intercom Widget loaded with true Intercom-level design');
                    // Widget will auto-initialize via script with proper backend integration
                }}
            />
        </div>
    );
} 