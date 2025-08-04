"use client";

/**
 * WIDGET ORCHESTRATOR
 *
 * The central orchestration component that manages widget state,
 * real-time connections, and provides a seamless user experience.
 * This component implements the Intercom-quality architecture
 * with proper state management and dynamic welcome experiences.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UltimateWidget } from './design-system/UltimateWidget';

// ============================================================================
// TYPES
// ============================================================================

export interface UltimateWidgetConfig {
  organizationName: string;
  welcomeMessage: string;
  showWelcomeMessage: boolean;
  primaryColor: string;
  position: string;
  theme: string;
  soundEnabled: boolean;
  enableFileUpload: boolean;
  enableReactions: boolean;
  enableThreading: boolean;
  maxFileSize: number;
  maxFiles: number;
  acceptedFileTypes: string[];
  showAgentTyping: boolean;
  enableSound: boolean;
}

export interface WidgetOrchestratorProps {
  organizationId: string;
  conversationId?: string;
  config?: Partial<UltimateWidgetConfig>;
  className?: string;
}

export interface WelcomeExperience {
  title: string;
  description: string;
  ctaText: string;
  features: string[];
  isPersonalized: boolean;
}

// ============================================================================
// WELCOME EXPERIENCE GENERATOR
// ============================================================================
function generateWelcomeExperience(
  organizationName: string,
  isReturningUser: boolean
): WelcomeExperience {
  if (isReturningUser) {
    return {
      title: `Welcome back to ${organizationName}`,
      description: "We're here to help you continue where you left off.",
      ctaText: "Continue conversation",
      features: ["Pick up where you left off", "See your message history", "Get personalized help"],
      isPersonalized: true,
    };
  }

  return {
    title: `Welcome to ${organizationName}`,
    description: "We're here to help you get the most out of our service.",
    ctaText: "Start conversation",
    features: [
      "Get instant answers to your questions",
      "Share files and screenshots easily",
      "Connect with our expert team",
    ],
    isPersonalized: false,
  };
}

// ============================================================================
// DYNAMIC WELCOME COMPONENT
// ============================================================================
function DynamicWelcomeExperience({ 
  experience, 
  onStartConversation 
}: { 
  experience: WelcomeExperience;
  onStartConversation: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center h-full p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="mb-6"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-2xl">👋</span>
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-xl font-semibold text-gray-900 mb-2"
      >
        {experience.title}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="text-gray-600 mb-6 max-w-xs"
      >
        {experience.description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="space-y-3 mb-8 w-full max-w-sm"
      >
        {experience.features.map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
            className="flex items-center space-x-3 text-sm text-gray-700"
          >
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
            <span>{feature}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        onClick={onStartConversation}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {experience.ctaText}
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// CONNECTION STATUS INDICATOR (REMOVED)
// ============================================================================
// Connection status is now handled within the UltimateWidget component itself
// to prevent UI pollution in the main application layout

// ============================================================================
// MAIN ORCHESTRATOR COMPONENT
// ============================================================================
export function WidgetOrchestrator({
  organizationId,
  conversationId: initialConversationId,
  config: userConfig,
  className,
}: WidgetOrchestratorProps) {
  const [showWelcome, setShowWelcome] = useState(false); // Start with widget, not welcome
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Enhanced configuration with defaults
  const config = useMemo<UltimateWidgetConfig>(() => ({
    organizationName: userConfig?.organizationName || 'Campfire',
    welcomeMessage: userConfig?.welcomeMessage || "Hi! How can we help you today?",
    showWelcomeMessage: userConfig?.showWelcomeMessage !== false,
    primaryColor: userConfig?.primaryColor || '#3b82f6',
    position: userConfig?.position || 'bottom-right',
    theme: userConfig?.theme || 'light',
    soundEnabled: userConfig?.soundEnabled !== false,
    enableFileUpload: userConfig?.enableFileUpload !== false,
    enableReactions: userConfig?.enableReactions !== false,
    enableThreading: userConfig?.enableThreading !== false,
    maxFileSize: userConfig?.maxFileSize || 10,
    maxFiles: userConfig?.maxFiles || 5,
    acceptedFileTypes: userConfig?.acceptedFileTypes || ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
    showAgentTyping: userConfig?.showAgentTyping !== false,
    enableSound: userConfig?.enableSound !== false,
    ...userConfig,
  }), [userConfig]);

  // Check for returning user
  useEffect(() => {
    const hasVisited = localStorage.getItem(`widget-visited-${organizationId}`);
    setIsReturningUser(!!hasVisited);
    
    if (!hasVisited) {
      localStorage.setItem(`widget-visited-${organizationId}`, 'true');
    }
  }, [organizationId]);

  const welcomeExperience = useMemo(
    () => generateWelcomeExperience(config.organizationName, isReturningUser),
    [config.organizationName, isReturningUser]
  );

  const handleStartConversation = useCallback(async () => {
    setShowWelcome(false);
    // Connection handling is now managed within the UltimateWidget component
  }, []);

  const handleClose = useCallback(() => {
    setShowWelcome(true);
  }, []);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <DynamicWelcomeExperience
            key="welcome"
            experience={welcomeExperience}
            onStartConversation={handleStartConversation}
          />
        ) : (
          <motion.div
            key="widget"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <UltimateWidget
              organizationId={organizationId}
              conversationId={initialConversationId}
              config={config}
              onClose={handleClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}