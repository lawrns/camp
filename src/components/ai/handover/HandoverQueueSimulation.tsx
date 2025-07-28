"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { Loader2, User, Bot, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HandoverQueueSimulationProps {
  isVisible: boolean;
  onComplete: (agentName: string) => void;
  className?: string;
}

const AGENT_NAMES = ["Sarah", "Michael", "Emma", "James", "Olivia", "David", "Sophie", "Alex"];

export function HandoverQueueSimulation({ isVisible, onComplete, className }: HandoverQueueSimulationProps) {
  const [stage, setStage] = useState<"connecting" | "queuing" | "assigning" | "complete">("connecting");
  const [progress, setProgress] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string>("");

  useEffect(() => {
    if (!isVisible) {
      // Reset state when hidden
      setStage("connecting");
      setProgress(0);
      setSelectedAgent("");
      return;
    }

    // Simulate queue process
    const stages = [
      { stage: "connecting" as const, duration: 1000, progress: 30 },
      { stage: "queuing" as const, duration: 2000 + Math.random() * 3000, progress: 70 }, // 2-5 seconds
      { stage: "assigning" as const, duration: 1000, progress: 90 },
      { stage: "complete" as const, duration: 500, progress: 100 },
    ];

    let currentStageIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const runStage = () => {
      if (currentStageIndex >= stages.length) {
        return;
      }

      const currentStage = stages[currentStageIndex];
      if (!currentStage) return;
      
      setStage(currentStage.stage || "connecting");
      setProgress(currentStage.progress || 0);

      if (currentStage.stage === "assigning") {
        // Select a random agent name
        const agentName = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
        setSelectedAgent(agentName);
      }

      if (currentStage.stage === "complete" && selectedAgent) {
        // Notify parent component
        onComplete(selectedAgent);
        return;
      }

      timeoutId = setTimeout(() => {
        currentStageIndex++;
        runStage();
      }, currentStage.duration);
    };

    runStage();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, onComplete, selectedAgent]);

  if (!isVisible) return null;

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn("fixed inset-x-0 bottom-24 z-50 mx-auto max-w-md px-4", className)}
      >
        <div className="bg-background rounded-ds-lg border border-[var(--fl-color-info-muted)] p-spacing-md shadow-card-deep">
          {/* Progress Bar */}
          <div className="mb-4 h-2 w-full overflow-hidden rounded-ds-full bg-gray-200">
            <OptimizedMotion.div
              className="h-full rounded-ds-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Stage Content */}
          <div className="flex items-center justify-center space-x-3">
            {stage === "connecting" && (
              <>
                <Bot className="h-6 w-6 text-[var(--fl-color-info)]" />
                <div className="text-center">
                  <p className="font-medium text-gray-900">Analyzing your request...</p>
                  <p className="text-sm text-[var(--fl-color-text-muted)]">Determining best support path</p>
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-[var(--fl-color-info)]" />
              </>
            )}

            {stage === "queuing" && (
              <>
                <div className="relative">
                  <User className="h-6 w-6 text-purple-500" />
                  <OptimizedMotion.div
                    className="absolute -right-1 -top-1 h-2 w-2 rounded-ds-full bg-purple-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Connecting to agent...</p>
                  <div className="mt-1 flex items-center justify-center space-x-1">
                    <p className="text-sm text-[var(--fl-color-text-muted)]">Finding available specialist</p>
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <OptimizedMotion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-ds-full bg-purple-400"
                          animate={{
                            y: [0, -6, 0],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {stage === "assigning" && (
              <>
                <OptimizedMotion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <User className="h-6 w-6 text-[var(--fl-color-success)]" />
                </OptimizedMotion.div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Agent found!</p>
                  <p className="text-sm text-[var(--fl-color-text-muted)]">
                    Assigning {selectedAgent} to your conversation
                  </p>
                </div>
                <OptimizedMotion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle className="h-5 w-5 text-[var(--fl-color-success)]" />
                </OptimizedMotion.div>
              </>
            )}

            {stage === "complete" && (
              <OptimizedMotion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex w-full items-center justify-center space-x-spacing-sm"
              >
                <CheckCircle className="h-6 w-6 text-[var(--fl-color-success)]" />
                <p className="font-medium text-green-700">Agent {selectedAgent} assigned</p>
              </OptimizedMotion.div>
            )}
          </div>

          {/* Additional Info */}
          {stage === "queuing" && (
            <OptimizedMotion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 0.5 }}
              className="mt-4 rounded-ds-md bg-[var(--fl-color-info-subtle)] spacing-3"
            >
              <p className="text-tiny text-blue-700">
                💡 While you wait, you can continue typing your message. Your agent will see your full conversation
                history.
              </p>
            </OptimizedMotion.div>
          )}
        </div>
      </OptimizedMotion.div>
    </OptimizedAnimatePresence>
  );
}
