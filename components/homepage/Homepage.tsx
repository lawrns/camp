"use client";

import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from "react";

// Force dynamic rendering to avoid localStorage issues during build
// Use default dynamic/static behavior for homepage
import { ArrowRight, Bot, CheckCircle, Flame, MessageCircle, Shield, Sparkles, Star, Terminal, User } from 'lucide-react';
import Link from "next/link";

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

// Interactive Handover Animation Component with Memory Management
const HandoverChatBubble = ({ onAnimationStateChange }: { onAnimationStateChange?: (state: string) => void }) => {
    const [animationState, setAnimationState] = useState('human-typing'); // human-typing, cursor-moving, handover, ai-response, complete
    const [typedText, setTypedText] = useState('');
    const [showHandoverButton, setShowHandoverButton] = useState(false);
    const [showCursor, setShowCursor] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const [handoverProgress, setHandoverProgress] = useState(0);

    // Refs to track timers for cleanup
    const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());

    // Notify parent of animation state changes
    useEffect(() => {
        onAnimationStateChange?.(animationState);
    }, [animationState, onAnimationStateChange]);

    const humanMessage = "Thanks for your patience. I'm reviewing your billing discrepancy case now and will have this resolved for you shortly...";
    const aiMessage = "Alright, I've looked into the discrepancy. Here's what happened: there was a duplicate charge on March 15th. I'm processing the refund now and you'll see it within 2-3 business days. I've also added account protection to prevent this in the future...";

    // Helper function to add timer to tracking set
    const addTimer = (timer: NodeJS.Timeout) => {
        timersRef.current.add(timer);
        return timer;
    };

    // Helper function to clear and remove timer
    const clearTimer = (timer: NodeJS.Timeout) => {
        clearTimeout(timer);
        timersRef.current.delete(timer);
    };

    // Cleanup all timers
    const clearAllTimers = () => {
        timersRef.current.forEach(timer => clearTimeout(timer));
        timersRef.current.clear();
    };

    // Reset animation cycle with cleanup
    const resetAnimation = () => {
        clearAllTimers();
        setAnimationState('human-typing');
        setTypedText('');
        setShowHandoverButton(false);
        setShowCursor(false);
        setCursorPosition({ x: 0, y: 0 });
        setHandoverProgress(0);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, []);

    // Human typing animation with memory leak prevention
    useEffect(() => {
        if (animationState === 'human-typing') {
            const timer = addTimer(setTimeout(() => {
                if (typedText.length < humanMessage.length) {
                    setTypedText(humanMessage.slice(0, typedText.length + 1));
                } else {
                    setShowHandoverButton(true);
                    // Start cursor animation after a brief pause
                    const cursorTimer = addTimer(setTimeout(() => {
                        setShowCursor(true);
                        setAnimationState('cursor-moving');
                    }, 1000));
                }
            }, 13 + Math.random() * 14)); // Increased typing speed by 50% more (was 20-40ms, now 13-27ms)

            return () => clearTimer(timer);
        }
    }, [typedText, animationState, humanMessage]);

    // Cursor movement animation
    useEffect(() => {
        if (animationState === 'cursor-moving') {
            // Animate cursor moving to the handover button
            const timer = addTimer(setTimeout(() => {
                setCursorPosition({ x: 280, y: -10 }); // Position near the handover button
                // After cursor reaches button, trigger click
                const clickTimer = addTimer(setTimeout(() => {
                    setAnimationState('handover');
                    setShowHandoverButton(false);
                    setShowCursor(false);
                }, 1500));
            }, 100));
            return () => clearTimer(timer);
        }
    }, [animationState]);

    // Handover progress animation
    useEffect(() => {
        if (animationState === 'handover') {
            const timer = addTimer(setTimeout(() => {
                if (handoverProgress < 100) {
                    setHandoverProgress(prev => Math.min(prev + 2, 100));
                } else {
                    setAnimationState('ai-response');
                    setTypedText('');
                }
            }, 50));
            return () => clearTimer(timer);
        }
    }, [handoverProgress, animationState]);

    // AI typing animation
    useEffect(() => {
        if (animationState === 'ai-response') {
            const timer = addTimer(setTimeout(() => {
                if (typedText.length < aiMessage.length) {
                    setTypedText(aiMessage.slice(0, typedText.length + 1));
                } else {
                    const completeTimer = addTimer(setTimeout(() => {
                        setAnimationState('complete');
                        const resetTimer = addTimer(setTimeout(resetAnimation, 3000)); // Reset after 3 seconds
                    }, 2000));
                }
            }, 11 + Math.random() * 16)); // Increased typing speed by 50% more (was 16-40ms, now 11-27ms)
            return () => clearTimer(timer);
        }
    }, [typedText, animationState, aiMessage]);

    const handleHandoverClick = () => {
        setAnimationState('handover');
        setShowHandoverButton(false);
        setShowCursor(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 max-w-xs z-10 mx-auto"
        >
            {/* Animated Cursor */}
            <AnimatePresence>
                {showCursor && (
                    <motion.div
                        initial={{ x: 150, y: 80, opacity: 0 }}
                        animate={{
                            x: cursorPosition.x,
                            y: cursorPosition.y,
                            opacity: 1
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 1.2,
                            ease: "easeInOut",
                            x: { type: "spring", stiffness: 100, damping: 20 },
                            y: { type: "spring", stiffness: 100, damping: 20 }
                        }}
                        className="absolute pointer-events-none z-50"
                        style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="text-gray-800"
                        >
                            <path
                                d="M5.5 3L19 16.5L13 15L11.5 21L5.5 3Z"
                                fill="currentColor"
                                stroke="white"
                                strokeWidth="1"
                            />
                        </svg>
                        {/* Click animation effect */}
                        {animationState === 'cursor-moving' && cursorPosition.x > 200 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.3, delay: 1.2 }}
                                className="absolute -top-1 -left-1 w-4 h-4 border-2 border-blue-500 rounded-full"
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header with avatar and status */}
            <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: animationState === 'handover' ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.5, repeat: animationState === 'handover' ? Infinity : 0 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${animationState === 'human-typing' || animationState === 'complete'
                            ? 'bg-blue-100'
                            : animationState === 'handover'
                                ? 'bg-gradient-to-r from-blue-100 to-purple-100'
                                : 'bg-purple-100'
                            }`}
                    >
                        <AnimatePresence mode="wait">
                            {(animationState === 'human-typing' || animationState === 'complete') && (
                                <motion.div
                                    key="human"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <User size={16} className="text-blue-600" />
                                </motion.div>
                            )}
                            {animationState === 'handover' && (
                                <motion.div
                                    key="transition"
                                    initial={{ opacity: 0, rotate: 0 }}
                                    animate={{ opacity: 1, rotate: 360 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles size={16} className="text-purple-600" />
                                </motion.div>
                            )}
                            {animationState === 'ai-response' && (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Bot size={16} className="text-purple-600" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">
                            Jimmy Bob - Support Agent
                        </span>
                        {/* Internal System Status - Only visible in internal view */}
                        {(animationState === 'handover' || animationState === 'ai-response') && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-full h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60"
                                />
                            </motion.div>
                        )}
                        {(animationState === 'human-typing' || animationState === 'ai-response') && (
                            <div className="flex space-x-1">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                    className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Internal Enhancement Button */}
                <AnimatePresence>
                    {showHandoverButton && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleHandoverClick}
                            className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                            title="Activate Comrad Enhancement"
                        >
                            <Sparkles size={12} className="text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Internal System Activation Overlay */}
            {animationState === 'handover' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3"
                >
                    <div className="flex items-center space-x-2 mb-2">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles size={12} className="text-purple-600" />
                        </motion.div>
                        <span className="text-xs text-purple-600 font-medium">
                            Comrad Operator Activated
                        </span>
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full"
                        >
                            AUTO
                        </motion.div>
                    </div>

                    {/* Command Line Style Progress */}
                    <div className="font-mono text-xs text-gray-600 space-y-1">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: handoverProgress > 20 ? 1 : 0 }}
                            className="flex items-center space-x-2"
                        >
                            <span className="text-green-500">&gt;</span>
                            <span>context: billing_discrepancy</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: handoverProgress > 50 ? 1 : 0 }}
                            className="flex items-center space-x-2"
                        >
                            <span className="text-green-500">&gt;</span>
                            <span>session_id: {Math.random().toString(36).substr(2, 8)}</span>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: handoverProgress > 80 ? 1 : 0 }}
                            className="flex items-center space-x-2"
                        >
                            <span className="text-green-500">&gt;</span>
                            <span>escalation: autonomous_mode</span>
                        </motion.div>
                    </div>


                </motion.div>
            )}

            {/* Message Content */}
            <div className="min-h-[80px]">
                <div className="text-sm text-gray-700 font-medium leading-relaxed">
                    {animationState === 'handover' ? (
                        <span className="text-gray-500 italic">
                            {/* Show last part of human message during internal handover */}
                            {humanMessage.slice(-50)}...
                        </span>
                    ) : (
                        <>
                            {typedText}
                            {(animationState === 'human-typing' || animationState === 'ai-response') && (
                                <motion.div
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Chat bubble tail pointing upward to operator */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45 z-[-1]"></div>
        </motion.div>
    );
};

const scaleOnHover = {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" },
};

// Parallax Background Component
const ParallaxBackground = () => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

    return (
        <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
                style={{ y: y1 }}
                className="absolute w-96 h-96 bg-gradient-to-r from-blue-600/10 to-blue-800/10 rounded-full blur-3xl -top-20 -left-20"
            />
            <motion.div
                style={{ y: y2 }}
                className="absolute w-64 h-64 bg-gradient-to-l from-blue-500/10 to-transparent rounded-full blur-2xl top-1/3 -right-20"
            />
            <motion.div
                style={{ y: y1 }}
                className="absolute w-80 h-80 bg-gradient-to-r from-blue-400/8 to-transparent rounded-full blur-3xl bottom-1/4 left-1/3"
            />
        </div>
    );
};

// Animated Navigation
const AnimatedNav = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`border-b border-gray-200 sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/90"
                }`}
        >
            <div className="container mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-2">
                        <Flame size={24} className="text-blue-600" />
                        <span className="text-xl font-bold text-gray-900">Campfire</span>
                    </motion.div>

                    <div className="hidden md:flex items-center space-x-8">
                        {["Features", "Pricing", "Enterprise"].map((item, index) => (
                            <motion.a
                                key={item}
                                href={`/${item.toLowerCase()}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ y: -2 }}
                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                            >
                                {item}
                            </motion.a>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                                Sign In
                            </Link>
                        </motion.div>
                        <motion.div whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/register"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                            >
                                <span>Get Started</span>
                                <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

// Animated Hero Section
const HeroSection = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [chatAnimationState, setChatAnimationState] = useState('human-typing');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const handleChatAnimationStateChange = (state: string) => {
        setChatAnimationState(state);
    };

    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16">
            <ParallaxBackground />

            {/* Interactive cursor follower */}
            <motion.div
                className="absolute w-4 h-4 bg-blue-600/20 rounded-full pointer-events-none z-10"
                animate={{
                    x: mousePosition.x - 8,
                    y: mousePosition.y - 8,
                }}
                transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 200,
                    mass: 0.5,
                }}
            />

            <div className="container mx-auto px-6 lg:px-8 relative z-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
                    {/* Left Column - Text Content */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="text-left"
                    >
                        {/* Badge */}
                        <motion.div
                            variants={fadeInUp}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/10 to-blue-800/10 px-4 py-2 rounded-full mb-8"
                        >
                            <Sparkles size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">AI-Powered Customer Service Platform</span>
                        </motion.div>

                        {/* Animated Headline */}
                        <motion.h1 variants={fadeInUp} className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-none">
                            Transform Customer Service Into Your{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                Competitive Advantage
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p variants={fadeInUp} className="text-xl text-gray-600 mb-8 leading-relaxed">
                            AI support so advanced, your customers can't tell it's not human. Deliver instant, intelligent responses that feel completely natural while reducing costs and increasing satisfaction.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
                        >
                            <motion.div whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/demo"
                                    className="bg-blue-600 text-white px-8 py-4 rounded-lg flex items-center space-x-2 text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    <Terminal size={20} />
                                    <span>Start Free Trial</span>
                                    <motion.div
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <ArrowRight size={16} />
                                    </motion.div>
                                </Link>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/comrad"
                                    className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg flex items-center space-x-2 text-lg font-medium hover:border-blue-600 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <MessageCircle size={20} />
                                    <span>Meet Comrad</span>
                                </Link>
                            </motion.div>
                        </motion.div>

                        {/* Trust Indicators */}
                        <motion.div variants={fadeInUp} className="flex items-center space-x-8 text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                                <Shield size={16} />
                                <span>SOC 2 Compliant</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                <span>98.9% Uptime</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Star size={16} className="text-orange-500" />
                                <span>Fortune 500 Trusted</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Operator Image with Chat Bubble */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative flex flex-col items-center lg:items-end"
                    >
                        {/* Main Operator Image with Transition */}
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                {(chatAnimationState === 'human-typing' || chatAnimationState === 'cursor-moving' || chatAnimationState === 'complete') ? (
                                    <motion.img
                                        key="human-operator"
                                        src="/images/operator.png"
                                        alt="Human Customer Service Operator"
                                        className="w-full h-auto max-w-md lg:max-w-lg object-contain transform -scale-x-100"
                                        transition={{
                                            opacity: { duration: 0.5 }
                                        }}
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                ) : (
                                    <motion.img
                                        key="ai-operator"
                                        src="/images/rag.png"
                                        alt="AI Customer Service Specialist"
                                        className="w-full h-auto max-w-md lg:max-w-lg object-contain transform -scale-x-100"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            opacity: { duration: 1.5, ease: "easeInOut" }
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Floating Metrics - repositioned for better layout */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 0.5 }}
                                className="absolute bottom-8 -right-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg"
                            >
                                <div className="text-2xl font-bold">12s</div>
                                <div className="text-sm opacity-90">Response time</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2, duration: 0.5 }}
                                className="absolute top-1/3 -right-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg"
                            >
                                <div className="text-2xl font-bold">96%</div>
                                <div className="text-sm opacity-90">CSAT Score</div>
                            </motion.div>
                        </div>

                        {/* Interactive Handover Chat Bubble - Overlay on Images */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                            <HandoverChatBubble onAnimationStateChange={handleChatAnimationStateChange} />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
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

    // Widget is already loaded in the layout - no need to load it again
    useEffect(() => {
        console.log("🔥 Homepage mounted - widget should already be loaded from layout");
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <AnimatedNav />
            <HeroSection />
            {/* Other sections would continue here but keeping this minimal for now */}
        </div>
    );
} 