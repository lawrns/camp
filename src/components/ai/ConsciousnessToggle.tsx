/**
 * ConsciousnessToggle - The Cunning Animated Handover Button
 * Morphs between human and AI states with sophisticated animations
 * Leverages existing AIStatusIndicators infrastructure
 */

"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIStatusUtils, type AIStatus, type AIConfidenceLevel } from "./AIStatusIndicators";
import { Badge } from "@/components/unified-ui/components/Badge";

export interface ConsciousnessToggleProps {
  conversationId: string;
  isAIActive: boolean;
  aiStatus?: AIStatus;
  confidence?: AIConfidenceLevel;
  accuracy?: number;
  onToggle: (newState: boolean) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  variant?: "button" | "card" | "inline";
  showDetails?: boolean;
  disabled?: boolean;
}

export const ConsciousnessToggle: React.FC<ConsciousnessToggleProps> = ({
  conversationId,
  isAIActive,
  aiStatus = "idle",
  confidence = "medium",
  accuracy,
  onToggle,
  isLoading = false,
  className,
  variant = "button",
  showDetails = true,
  disabled = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get configurations from existing infrastructure
  const statusConfig = AIStatusUtils.getStatusConfig(aiStatus);
  const confidenceConfig = useMemo(() => {
    const configs = {
      high: {
        color: '#10B981',
        glow: 'rgba(16, 185, 129, 0.3)',
        label: 'High Confidence',
        description: 'AI is very confident in its responses'
      },
      medium: {
        color: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.3)',
        label: 'Medium Confidence',
        description: 'AI has moderate confidence'
      },
      low: {
        color: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.3)',
        label: 'Low Confidence',
        description: 'AI has low confidence, consider human review'
      }
    };
    return configs[confidence] || configs.medium;
  }, [confidence]);

  const needsAttention = AIStatusUtils.needsAttention({
    status: aiStatus,
    mode: "autonomous",
    confidence,
    accuracy,
    interventionNeeded: confidence === "low" || (accuracy !== undefined && accuracy < 60),
  });

  // Handle toggle with animation timing
  const handleToggle = async () => {
    if (disabled || isLoading || isAnimating) return;

    const now = isMounted ? Date.now() : 0;
    if (now - lastToggleTime < 1000) return; // Prevent rapid toggling

    setIsAnimating(true);
    setLastToggleTime(now);

    try {
      await onToggle(!isAIActive);
    } catch (error) {
      console.error("ConsciousnessToggle: Failed to toggle state:", error);
    } finally {
      // Allow animation to complete before enabling interactions
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  // Dynamic button text based on state
  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (isAnimating) return isAIActive ? "Switching to Human..." : "Activating AI...";
    if (isAIActive) {
      switch (aiStatus) {
        case "active":
        case "monitoring":
          return "AI Thinking";
        case "active":
          return "AI Active";
        case "uncertain":
          return "AI Needs Help";
        default:
          return "AI Engaged";
      }
    }
    return "Activate AI";
  };

  // Dynamic glow effect based on state
  const getGlowEffect = () => {
    if (isLoading || isAnimating) return "0 0 20px rgba(59, 130, 246, 0.5)";
    if (isAIActive) {
      switch (aiStatus) {
        case "active":
        case "monitoring":
          return "0 0 25px rgba(147, 51, 234, 0.6)";
        case "active":
          return "0 0 20px rgba(34, 197, 94, 0.5)";
        case "uncertain":
          return "0 0 20px rgba(245, 158, 11, 0.5)";
        default:
          return "0 0 15px rgba(59, 130, 246, 0.4)";
      }
    }
    return "0 0 10px rgba(156, 163, 175, 0.3)";
  };

  // Inline variant for composer/header
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.button
          onClick={handleToggle}
          disabled={disabled || isLoading || isAnimating}
          className={cn(
            "relative flex items-center gap-2 rounded-full px-3 py-1.5",
            "border transition-all duration-300",
            "hover:scale-105 active:scale-95",
            isAIActive
              ? `${statusConfig.borderColor} ${statusConfig.bgColor} ${statusConfig.color}`
              : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          style={{
            boxShadow: getGlowEffect(),
          }}
        >
          <AnimatePresence mode="wait">
            {isAIActive ? (
              <motion.div
                key="ai-icon"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                {isLoading || aiStatus === "thinking" ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <statusConfig.icon className="h-4 w-4" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="human-icon"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <User className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>

          <span className="text-sm font-medium">{getButtonText()}</span>

          {showDetails && (
            <Badge
              variant={needsAttention ? "destructive" : "secondary"}
              className="text-xs"
            >
              {confidence === "high" ? "High" : confidence === "medium" ? "Med" : "Low"}
              {accuracy !== undefined && ` ${Math.round(accuracy)}%`}
            </Badge>
          )}
        </motion.button>
      </div>
    );
  }

  // Card variant for detailed views
  if (variant === "card") {
    return (
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-lg border p-4",
          "bg-gradient-to-br from-white to-gray-50",
          statusConfig.borderColor,
          className
        )}
        whileHover={{ scale: 1.02 }}
        style={{
          boxShadow: getGlowEffect(),
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "relative flex h-12 w-12 items-center justify-center rounded-full",
                statusConfig.bgColor
              )}
              animate={{
                rotateY: isAIActive ? 0 : 180,
                scale: isAnimating ? [1, 1.1, 1] : 1,
              }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <AnimatePresence mode="wait">
                {isAIActive ? (
                  <motion.div
                    key="ai-large"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <statusConfig.icon className={cn("h-6 w-6", statusConfig.color)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="human-large"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <User className="h-6 w-6 text-blue-600" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Thinking animation overlay */}
              {(aiStatus === "thinking" || aiStatus === "analyzing") && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-purple-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>

            <div>
              <h3 className="font-semibold text-gray-900">{getButtonText()}</h3>
              <p className="text-sm text-gray-600">
                {isAIActive ? statusConfig.label : "Human Mode"}
              </p>
            </div>
          </div>

          <motion.button
            onClick={handleToggle}
            disabled={disabled || isLoading || isAnimating}
            className={cn(
              "rounded-full px-4 py-2 font-medium transition-all",
              isAIActive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
          >
            {isAIActive ? "Deactivate" : "Activate"}
          </motion.button>
        </div>

        {showDetails && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Confidence:</span>
              <Badge variant={needsAttention ? "destructive" : "success"}>
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
              </Badge>
            </div>
            {accuracy !== undefined && (
              <div className="text-gray-600">
                Accuracy: <span className="font-medium">{Math.round(accuracy)}%</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Default button variant
  return (
    <motion.button
      onClick={handleToggle}
      disabled={disabled || isLoading || isAnimating}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-4 py-2",
        "border font-medium transition-all duration-300",
        "hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isAIActive
          ? `${statusConfig.borderColor} ${statusConfig.bgColor} ${statusConfig.color}`
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      style={isMounted ? {
        boxShadow: getGlowEffect(),
      } : {}}
    >
      {/* Main icon with flip animation */}
      <motion.div
        className="relative h-5 w-5"
        animate={isMounted ? {
          rotateY: isAIActive ? 0 : 180,
          scale: isAnimating ? [1, 1.2, 1] : 1,
        } : {}}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
      >
        {isMounted ? (
          <AnimatePresence mode="wait">
            {isAIActive ? (
              <motion.div
                key="ai-button"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {isLoading || aiStatus === "active" ? (
                  <Clock className="h-5 w-5 animate-spin" />
                ) : (
                  <statusConfig.icon className="h-5 w-5" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="human-button"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <User className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          // SSR fallback - static icons without animation
          <div className="absolute inset-0 flex items-center justify-center">
            {isAIActive ? (
              <statusConfig.icon className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
        )}
      </motion.div>

      <span>{getButtonText()}</span>

      {showDetails && (
        <Badge
          variant={needsAttention ? "destructive" : "secondary"}
          className="ml-1 text-xs"
        >
          {confidence === "high" ? "High" : confidence === "medium" ? "Med" : "Low"}
          {accuracy !== undefined && ` ${Math.round(accuracy)}%`}
        </Badge>
      )}

      {/* Attention indicator */}
      {needsAttention && (
        <motion.div
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
};

export default ConsciousnessToggle;
