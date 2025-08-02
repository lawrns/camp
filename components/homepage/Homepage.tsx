"use client";

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from "react";

// Import the enhanced hero section with optimized performance
import { WorldClassHero } from './WorldClassHero';

// Import the additional sections
import { FeaturesShowcase } from './FeaturesShowcase';
import { SocialProof } from './SocialProof';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

// Animation variants for reuse
const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

// Main Homepage Component (client-only)
export default function Homepage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        console.log("🔥 HomePage useEffect started");

        // Set client flag to prevent hydration mismatch
        setIsClient(true);

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