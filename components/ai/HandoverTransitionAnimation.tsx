"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { ArrowRight, Bot as Bot, CheckCircle, Sparkles as Sparkles, User } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface HandoverTransitionAnimationProps {
  isVisible: boolean;
  fromType: "ai" | "human";
  toType: "ai" | "human";
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

export function HandoverTransitionAnimation({
  isVisible,
  fromType,
  toType,
  duration = 3000,
  onComplete,
  className,
}: HandoverTransitionAnimationProps) {
  const [stage, setStage] = useState<"start" | "transition" | "complete">("start");

  useEffect(() => {
    if (!isVisible) {
      setStage("start");
      return;
    }

    const timer1 = setTimeout(() => setStage("transition"), 500);
    const timer2 = setTimeout(() => setStage("complete"), duration - 500);
    const timer3 = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, duration, onComplete]);

  const getTypeConfig = (type: "ai" | "human") => {
    return type === "ai"
      ? {
          icon: Bot,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          label: "AI Assistant",
        }
      : {
          icon: User,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Human Agent",
        };
  };

  const fromConfig = getTypeConfig(fromType);
  const toConfig = getTypeConfig(toType);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 },
    },
  };

  const iconVariants = {
    start: { scale: 1, rotate: 0 },
    transition: {
      scale: [1, 1.2, 1],
      rotate: [0, 180, 360],
      transition: {
        duration: 1,
        repeat: 2,
        ease: "easeInOut",
      },
    },
    complete: { scale: 1, rotate: 0 },
  } as unknown;

  const arrowVariants = {
    start: { x: -20, opacity: 0 },
    transition: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    complete: {
      x: 20,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  } as unknown;

  const sparkleVariants = {
    start: { scale: 0, opacity: 0 },
    transition: {
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    complete: { scale: 0, opacity: 0 },
  } as unknown;

  if (!isVisible) return null;

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm", className)}
      >
        <div className="bg-background mx-4 w-full max-w-md radius-2xl p-spacing-lg shadow-2xl">
          {/* Header */}
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-base font-semibold text-gray-900">Handover in Progress</h3>
            <p className="text-foreground text-sm">
              Transferring conversation from {fromConfig.label.toLowerCase()} to {toConfig.label.toLowerCase()}
            </p>
          </div>

          {/* Animation Area */}
          <div className="flex items-center justify-center gap-8 py-8">
            {/* From Icon */}
            <div className="relative">
              <OptimizedMotion.div
                variants={iconVariants}
                animate={stage}
                className={cn("flex h-16 w-16 items-center justify-center rounded-ds-full", fromConfig.bgColor)}
              >
                <fromConfig.icon className={cn("h-8 w-8", fromConfig.color)} />
              </OptimizedMotion.div>

              {/* Sparkles around from icon during transition */}
              {stage === "transition" && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <OptimizedMotion.div
                      key={i}
                      variants={sparkleVariants}
                      animate="transition"
                      className="absolute"
                      style={{
                        top: `${20 + Math.sin((i * Math.PI) / 3) * 30}px`,
                        left: `${20 + Math.cos((i * Math.PI) / 3) * 30}px`,
                      }}
                    >
                      <Icon icon={Sparkles} className="text-semantic-warning h-4 w-4" />
                    </OptimizedMotion.div>
                  ))}
                </>
              )}
            </div>

            {/* Arrow */}
            <OptimizedMotion.div variants={arrowVariants} animate={stage}>
              <Icon icon={ArrowRight} className="h-8 w-8 text-gray-400" />
            </OptimizedMotion.div>

            {/* To Icon */}
            <div className="relative">
              <OptimizedMotion.div
                variants={iconVariants}
                animate={stage}
                className={cn("flex h-16 w-16 items-center justify-center rounded-ds-full", toConfig.bgColor)}
              >
                <toConfig.icon className={cn("h-8 w-8", toConfig.color)} />
              </OptimizedMotion.div>

              {/* Success checkmark */}
              <OptimizedAnimatePresence>
                {stage === "complete" && (
                  <OptimizedMotion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: "spring" }}
                    className="bg-semantic-success absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-ds-full"
                  >
                    <Icon icon={CheckCircle} className="h-4 w-4 text-white" />
                  </OptimizedMotion.div>
                )}
              </OptimizedAnimatePresence>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 h-2 w-full rounded-ds-full bg-gray-200">
            <OptimizedMotion.div
              className="bg-primary h-2 rounded-ds-full"
              initial={{ width: "0%" }}
              animate={{
                width: stage === "start" ? "0%" : stage === "transition" ? "70%" : "100%",
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Status Text */}
          <div className="text-center">
            <OptimizedMotion.p
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-foreground text-sm"
            >
              {stage === "start" && "Initializing handover..."}
              {stage === "transition" && "Transferring conversation context..."}
              {stage === "complete" && "Handover completed successfully!"}
            </OptimizedMotion.p>
          </div>

          {/* Animated dots for loading */}
          {stage !== "complete" && (
            <div className="mt-4 flex justify-center gap-1">
              {[...Array(3)].map((_, i) => (
                <OptimizedMotion.div
                  key={i}
                  className="bg-primary h-2 w-2 rounded-ds-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}
