"use client";

import { useEffect } from "react";

// Import the enhanced hero section with optimized performance
import { WorldClassHero } from './WorldClassHero';

// Import the additional sections
import { FeaturesShowcase } from './FeaturesShowcase';
import { SocialProof } from './SocialProof';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

// Main Homepage Component (client-only)
export default function Homepage() {
    useEffect(() => {
        console.log("🔥 HomePage useEffect started");
        // Widget is loaded in the layout - no need to load it here
    }, []);

    useEffect(() => {
        console.log("🔥 Homepage mounted - widget should already be loaded from layout");
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Enhanced Hero Section */}
            <WorldClassHero />
            
            {/* Features Showcase Section */}
            <FeaturesShowcase />
            
            {/* Social Proof Section */}
            <SocialProof />
            
            {/* Final CTA Section */}
            <FinalCTA />
            
            {/* Footer */}
            <Footer />
        </div>
    );
}