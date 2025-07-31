"use client";

import { FadeIn } from '@/lib/performance/lightweight-animations';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Bot, Brain, CheckCircle, Flame, MessageCircle, Pause, Play, Quote, Sparkles, Target, Users, Zap } from 'lucide-react';
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Animation variants with stable dimensions
const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const scaleOnHover = {
    scale: 1.05,
    transition: { duration: 0.3, ease: "easeOut" },
};

// Animated Navigation (from homepage)
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
                    <Link href="/">
                        <FadeIn whileHover={{ scale: 1.05 }} className="flex items-center space-x-2 cursor-pointer">
                            <Flame size={24} className="text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">Campfire</span>
                        </FadeIn>
                    </Link>

                    <div className="hidden md:flex items-center space-x-8">
                        <FadeIn
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ y: -2 }}
                        >
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
                            >
                                Home
                            </Link>
                        </FadeIn>
                        {["Features", "Pricing", "Enterprise"].map((item, index) => (
                            <motion.a
                                key={item}
                                href={`/${item.toLowerCase()}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * (index + 2) }}
                                whileHover={{ y: -2 }}
                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                            >
                                {item}
                            </motion.a>
                        ))}
                    </div>

                    <div className="flex items-center space-x-4">
                        <FadeIn whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                                Sign In
                            </Link>
                        </FadeIn>
                        <FadeIn whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/register"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                            >
                                <span>Get Started</span>
                                <ArrowRight size={16} />
                            </Link>
                        </FadeIn>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

// Typing animation component
const TypingAnimation = () => {
    const [text, setText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    const messages = [
        "Hey there! How can I help you today?",
        "I noticed you're looking at our pricing page...",
        "Actually, let me correct that - our *new* pricing page",
        "Sorry, I meant to say our updated pricing structure 😅",
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const currentMessage = messages[currentIndex];
        if (!currentMessage) return;

        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (text.length < currentMessage.length) {
                        setText(currentMessage.slice(0, text.length + 1));
                    } else {
                        setTimeout(() => setIsDeleting(true), 2000);
                    }
                } else if (text.length > 0) {
                    setText(text.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setCurrentIndex((prev) => (prev + 1) % messages.length);
                }
            },
            isDeleting ? 50 : Math.random() * 150 + 50
        );

        return () => clearTimeout(timeout);
    }, [text, isDeleting, currentIndex, messages, mounted]);

    if (!mounted) return null;

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-200/50 max-w-md">
            <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 mb-1">Comrad</div>
                    <div className="text-gray-700 min-h-[1.5rem]">
                        {text}
                        <FadeIn
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-0.5 h-4 bg-blue-500 ml-1"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stunning gradient background
const GradientBackground = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Main gradient layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50/50 via-transparent to-pink-50/50" />

            {/* Animated gradient orbs */}
            <FadeIn
                className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <FadeIn
                className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-bl from-purple-400/25 to-pink-400/25 rounded-full blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
            <FadeIn
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-t from-indigo-400/20 to-transparent rounded-full blur-3xl"
                animate={{
                    scale: [1, 1.1, 1],
                    x: [-50, 50, -50],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Floating particles */}
            {Array.from({ length: 12 }, (_, i) => (
                <FadeIn
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
                    animate={{
                        y: [0, -100, 0],
                        x: [0, Math.sin(i) * 50, 0],
                        opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                    }}
                    style={{
                        left: `${10 + (i * 8)}%`,
                        top: `${20 + Math.sin(i) * 30}%`,
                    }}
                />
            ))}
        </div>
    );
};

// Human Behavior Simulation Demo
const HumanBehaviorDemo = () => {
    const [currentDemo, setCurrentDemo] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    const demos = [
        {
            title: "Natural Typing Patterns",
            description: "Watch Comrad type like a real human - with hesitations, corrections, and natural rhythm",
            conversation: [
                { type: "user", text: "Can you help me with my billing issue?" },
                { type: "comrad", text: "Of course! I'd be happy to help with your billing. Let me just...", typing: true },
                { type: "comrad", text: "Actually, let me pull up your account first. What's your email address?", correction: true }
            ]
        },
        {
            title: "Emotional Intelligence",
            description: "Comrad reads between the lines and responds with appropriate empathy",
            conversation: [
                { type: "user", text: "This is the third time I'm contacting support about this. I'm really frustrated." },
                { type: "comrad", text: "I completely understand your frustration - three times is definitely too many. Let me make sure we get this resolved for you right now.", empathy: true }
            ]
        },
        {
            title: "Context Memory",
            description: "Comrad remembers previous conversations and builds on them naturally",
            conversation: [
                { type: "user", text: "Hi, I'm back about that integration issue from yesterday" },
                { type: "comrad", text: "Welcome back! Yes, I remember - you were setting up the Slack integration and ran into the webhook configuration issue. Did the solution I provided work out?", memory: true }
            ]
        }
    ];

    useEffect(() => {
        if (!isPlaying) return;

        const timer = setInterval(() => {
            setCurrentDemo((prev) => (prev + 1) % demos.length);
        }, 8000);

        return () => clearInterval(timer);
    }, [isPlaying, demos.length]);

    return (
        <section className="py-32 bg-gradient-to-b from-white to-blue-50/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent" />

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <FadeIn
                    initial="hidden"
                    whileInView="visible"
                    variants={staggerContainer}
                    className="text-center mb-20"
                >
                    <FadeIn variants={fadeInUp} className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-full mb-6">
                        <Brain size={16} className="text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">Human Behavior Simulation</span>
                    </FadeIn>

                    <motion.h2 variants={fadeInUp} className="text-6xl font-bold text-gray-900 mb-6">
                        The Turing Test for
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Customer Support
                        </span>
                    </motion.h2>

                    <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-3xl mx-auto">
                        87% of customers can't tell they're talking to AI. Here's why Comrad feels impossibly human.
                    </motion.p>
                </FadeIn>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Demo Controls */}
                    <FadeIn
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center space-x-4 mb-8">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <div className="text-sm text-gray-600">
                                {isPlaying ? "Auto-playing demos" : "Paused"}
                            </div>
                        </div>

                        {demos.map((demo, index) => (
                            <FadeIn
                                key={index}
                                onClick={() => setCurrentDemo(index)}
                                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ${currentDemo === index
                                    ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg"
                                    : "bg-white/60 border border-gray-200 hover:bg-white/80"
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`w-3 h-3 rounded-full mt-2 ${currentDemo === index ? "bg-blue-500" : "bg-gray-300"
                                        }`} />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">{demo.title}</h3>
                                        <p className="text-gray-600 text-sm">{demo.description}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </FadeIn>

                    {/* Chat Demo */}
                    <FadeIn
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 min-h-[500px]"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <div className="text-sm text-gray-500">Customer Support Chat</div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="wait">
                                {demos[currentDemo]?.conversation?.map((message, index) => (
                                    <FadeIn
                                        key={`${currentDemo}-${index}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.5 }}
                                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-xs px-4 py-3 rounded-2xl ${message.type === "user"
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {(message as any).correction && (
                                                <div className="text-xs opacity-70 mb-1 line-through">
                                                    Of course! I'd be happy to help with your billing. Let me just...
                                                </div>
                                            )}
                                            <div className="relative">
                                                {message.text}
                                                {(message as any).typing && (
                                                    <FadeIn
                                                        animate={{ opacity: [1, 0] }}
                                                        transition={{ duration: 0.8, repeat: Infinity }}
                                                        className="inline-block w-0.5 h-4 bg-gray-600 ml-1"
                                                    />
                                                )}
                                            </div>
                                            {(message as any).empathy && (
                                                <div className="text-xs mt-2 opacity-70 italic">
                                                    ↳ Empathy detected and applied
                                                </div>
                                            )}
                                            {(message as any).memory && (
                                                <div className="text-xs mt-2 opacity-70 italic">
                                                    ↳ Previous context recalled
                                                </div>
                                            )}
                                        </div>
                                    </FadeIn>
                                ))}
                            </AnimatePresence>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

// Pricing Transparency Section
const PricingTransparency = () => {
    const [selectedPlan, setSelectedPlan] = useState("resolution");

    const pricingModels = [
        {
            id: "resolution",
            name: "Per Resolution",
            price: "$0.49",
            unit: "per resolved ticket",
            description: "Only pay when Comrad successfully resolves a customer issue",
            features: [
                "No setup fees",
                "No monthly minimums",
                "No per-message charges",
                "No token counting",
                "Unlimited conversations until resolution"
            ],
            highlight: "Most Popular"
        },
        {
            id: "traditional",
            name: "Traditional AI",
            price: "$0.02-0.15",
            unit: "per message",
            description: "How other AI chatbots charge (for comparison)",
            features: [
                "Charged per message sent",
                "No resolution guarantee",
                "Token-based pricing",
                "Costs add up quickly",
                "No outcome alignment"
            ],
            highlight: "Industry Standard"
        }
    ];

    return (
        <section className="py-32 bg-gradient-to-b from-blue-50/30 to-purple-50/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 via-transparent to-purple-100/10" />

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <FadeIn
                    initial="hidden"
                    whileInView="visible"
                    variants={staggerContainer}
                    className="text-center mb-20"
                >
                    <FadeIn variants={fadeInUp} className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full mb-6">
                        <Target size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-700">Outcome-Based Pricing</span>
                    </FadeIn>

                    <motion.h2 variants={fadeInUp} className="text-6xl font-bold text-gray-900 mb-6">
                        Pay for Results,
                        <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            Not Messages
                        </span>
                    </motion.h2>

                    <motion.p variants={fadeInUp} className="text-xl text-gray-600 max-w-3xl mx-auto">
                        While others charge per message, we only charge when your customers are actually helped.
                    </motion.p>
                </FadeIn>

                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {pricingModels.map((model) => (
                            <FadeIn
                                key={model.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className={`relative p-8 rounded-3xl border-2 transition-all duration-300 ${model.id === "resolution"
                                    ? "border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl"
                                    : "border-gray-200 bg-white/60 hover:bg-white/80"
                                    }`}
                            >
                                {model.highlight && (
                                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium ${model.id === "resolution"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-500 text-white"
                                        }`}>
                                        {model.highlight}
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{model.name}</h3>
                                    <div className="flex items-baseline justify-center mb-2">
                                        <span className="text-5xl font-bold text-gray-900">{model.price}</span>
                                        <span className="text-gray-600 ml-2">{model.unit}</span>
                                    </div>
                                    <p className="text-gray-600">{model.description}</p>
                                </div>

                                <div className="space-y-4">
                                    {model.features.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <CheckCircle
                                                size={20}
                                                className={model.id === "resolution" ? "text-blue-500" : "text-gray-400"}
                                            />
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {model.id === "resolution" && (
                                    <div className="mt-8 p-4 bg-blue-100/50 rounded-xl">
                                        <div className="text-sm text-blue-800">
                                            <strong>Example:</strong> If Comrad resolves 100 tickets this month, you pay $49.
                                            If it takes 500 messages to resolve those tickets, you still pay $49.
                                        </div>
                                    </div>
                                )}
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-16 text-center"
                    >
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-3xl shadow-xl">
                            <h3 className="text-2xl font-bold mb-4">Ready to try outcome-based pricing?</h3>
                            <p className="text-blue-100 mb-6">Start with 50 free resolutions. No credit card required.</p>
                            <Link
                                href="/register"
                                className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

// Social Proof Section
const SocialProof = () => {
    const testimonials = [
        {
            quote: "Our customers started asking if we hired new support agents. Turns out it was just Comrad being impossibly human.",
            author: "Sarah Chen",
            role: "Head of Customer Success",
            company: "TechFlow",
            avatar: "SC",
            metric: "94% CSAT"
        },
        {
            quote: "We went from 12-hour response times to instant resolutions. Comrad doesn't just answer questions—it solves problems.",
            author: "Marcus Rodriguez",
            role: "Support Director",
            company: "DataVault",
            avatar: "MR",
            metric: "89% First Contact Resolution"
        },
        {
            quote: "The ROI was immediate. Comrad pays for itself by the third resolved ticket. Everything after that is pure savings.",
            author: "Emily Watson",
            role: "Operations Manager",
            company: "CloudSync",
            avatar: "EW",
            metric: "$127k Annual Savings"
        }
    ];

    return (
        <section className="py-32 bg-gradient-to-b from-purple-50/30 to-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/10 via-transparent to-blue-100/10" />

            <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <FadeIn
                    initial="hidden"
                    whileInView="visible"
                    variants={staggerContainer}
                    className="text-center mb-20"
                >
                    <FadeIn variants={fadeInUp} className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full mb-6">
                        <Users size={16} className="text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Customer Stories</span>
                    </FadeIn>

                    <motion.h2 variants={fadeInUp} className="text-6xl font-bold text-gray-900 mb-6">
                        Teams That Chose
                        <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Human-Like AI
                        </span>
                    </motion.h2>
                </FadeIn>

                <div className="grid lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <FadeIn
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                            className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="mb-6">
                                <Quote size={32} className="text-purple-400 mb-4" />
                                <p className="text-gray-700 text-lg leading-relaxed">"{testimonial.quote}"</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                                        <div className="text-sm text-gray-500">{testimonial.company}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-bold text-purple-600">{testimonial.metric.split(' ')[0]}</div>
                                    <div className="text-xs text-gray-600">{testimonial.metric.split(' ').slice(1).join(' ')}</div>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center space-x-8 bg-white/60 backdrop-blur-sm px-8 py-6 rounded-2xl border border-gray-200/50">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">87%</div>
                            <div className="text-sm text-gray-600">Can't tell it's AI</div>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">42%</div>
                            <div className="text-sm text-gray-600">CSAT increase</div>
                        </div>
                        <div className="w-px h-12 bg-gray-300"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">5s</div>
                            <div className="text-sm text-gray-600">Response time</div>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

// Main Comrad page component
export default function ComradPage() {
    const { scrollYProgress } = useScroll();
    const heroRef = useRef(null);
    const isHeroInView = useInView(heroRef, { once: true });

    const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

    return (
        <div className="min-h-screen bg-white overflow-hidden">
            {/* Navigation */}
            <AnimatedNav />

            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
                <GradientBackground />

                <div className="container mx-auto px-6 lg:px-8 relative z-10">
                    <FadeIn
                        initial="hidden"
                        animate={isHeroInView ? "visible" : "hidden"}
                        variants={staggerContainer}
                        className="text-center max-w-6xl mx-auto"
                    >
                        {/* Badge */}
                        <FadeIn
                            variants={fadeInUp}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-blue-200/50 shadow-lg"
                        >
                            <Sparkles size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">
                                Your indistinguishably human RAG-powered AI agent
                            </span>
                        </FadeIn>

                        {/* Main Headline */}
                        <motion.h1
                            variants={fadeInUp}
                            className="text-6xl lg:text-8xl font-bold text-gray-900 mb-6 leading-tight"
                        >
                            Talk to your customers{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                                like a human.
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <FadeIn variants={fadeInUp} className="mb-4">
                            <div className="text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent mb-2">
                                Powered by Comrad. Priced like a machine.
                            </div>
                        </FadeIn>

                        <motion.p variants={fadeInUp} className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                            Meet Comrad, the world's first RAG-native chat assistant trained to emulate human behavior—slips, charm,
                            personality, memory, and all. Built for the era of indistinguishable AI support.
                        </motion.p>

                        {/* CTA Buttons */}
                        <FadeIn
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8"
                        >
                            <FadeIn whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/register"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl flex items-center space-x-3 text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
                                >
                                    <Zap size={24} />
                                    <span>Start Free Trial</span>
                                    <FadeIn animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                        <ArrowRight size={20} />
                                    </FadeIn>
                                </Link>
                            </FadeIn>

                            <FadeIn whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="#demo"
                                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 text-gray-700 px-10 py-5 rounded-xl flex items-center space-x-3 text-lg font-semibold hover:border-blue-500/50 hover:bg-white/90 transition-all duration-300 shadow-lg"
                                >
                                    <Play size={24} />
                                    <span>Watch Comrad in Action</span>
                                </Link>
                            </FadeIn>
                        </FadeIn>

                        {/* Price Note */}
                        <FadeIn
                            variants={fadeInUp}
                            className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200/50 shadow-lg"
                        >
                            <MessageCircle size={20} className="text-blue-600" />
                            <span className="text-gray-700 font-medium">
                                Just $0.49 per resolution. No usage fluff. No per-message traps.
                            </span>
                        </FadeIn>
                    </FadeIn>
                </div>

                {/* Floating Chat Demo */}
                <FadeIn
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block"
                >
                    <TypingAnimation />
                </FadeIn>
            </section>

            {/* Human Behavior Demo */}
            <HumanBehaviorDemo />

            {/* Pricing Transparency */}
            <PricingTransparency />

            {/* Social Proof */}
            <SocialProof />

            {/* Final CTA */}
            <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-cyan-600/90" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                </div>
                <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
                    <FadeIn
                        initial="hidden"
                        whileInView="visible"
                        variants={staggerContainer}
                        className="max-w-4xl mx-auto"
                    >
                        <motion.h2 variants={fadeInUp} className="text-5xl font-bold text-white mb-6">
                            Let Comrad Handle the Traffic
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-xl text-blue-100 mb-12">
                            "Comrad resolves more tickets than your team—without ever sounding like a bot."
                        </motion.p>

                        <FadeIn
                            variants={fadeInUp}
                            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
                        >
                            <FadeIn whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/register"
                                    className="bg-white text-blue-600 px-10 py-5 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-xl"
                                >
                                    Start Free Trial – no credit card needed
                                </Link>
                            </FadeIn>

                            <FadeIn whileHover={scaleOnHover} whileTap={{ scale: 0.95 }}>
                                <Link
                                    href="/demo"
                                    className="border-2 border-white text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-gray-100 hover:text-blue-700 transition-colors"
                                >
                                    Book a Live Demo
                                </Link>
                            </FadeIn>
                        </FadeIn>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
} 