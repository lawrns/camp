/**
 * ThinkingSidebar - Real-time AI thinking visualization
 * Leverages existing reasoning service and status indicators
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Eye,
  Zap,
  Target,
  TrendingUp,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Card, CardContent, CardHeader } from "@/components/unified-ui/components/Card";
import { Progress } from "@/components/unified-ui/components/Progress";
import { AIActivityIndicator, AIConfidenceIndicator, type AIStatus, type AIConfidenceLevel } from "./AIStatusIndicators";
import { useReasoningStream } from "@/hooks/useAIConsciousness";

export interface ThinkingSidebarProps {
  conversationId: string;
  isVisible: boolean;
  aiStatus: AIStatus;
  confidence: AIConfidenceLevel;
  accuracy?: number;
  isThinking: boolean;
  reasoning?: string;
  className?: string;
  onClose?: () => void;
}

interface ReasoningStep {
  id: string;
  text: string;
  timestamp: Date;
  type: "analysis" | "decision" | "confidence" | "action";
  confidence?: number;
}

export const ThinkingSidebar: React.FC<ThinkingSidebarProps> = ({
  conversationId,
  isVisible,
  aiStatus,
  confidence,
  accuracy,
  isThinking,
  reasoning,
  className,
  onClose,
}) => {
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Leverage existing reasoning stream
  const { reasoning: streamReasoning, isThinking: streamThinking } = useReasoningStream(conversationId);

  // Add new reasoning step
  const addReasoningStep = (text: string, type: ReasoningStep["type"] = "analysis") => {
    const step: ReasoningStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      timestamp: new Date(),
      type,
      confidence: type === "confidence" ? Math.random() * 100 : undefined,
    };

    setReasoningSteps(prev => [...prev.slice(-9), step]); // Keep last 10 steps
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  // Process reasoning text into steps
  useEffect(() => {
    if (reasoning || streamReasoning) {
      const text = reasoning || streamReasoning;
      if (text && text !== currentStep) {
        setCurrentStep(text);
        addReasoningStep(text);
      }
    }
  }, [reasoning, streamReasoning, currentStep]);

  // Simulate processing progress
  useEffect(() => {
    if (isThinking || streamThinking) {
      setProcessingProgress(0);
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setProcessingProgress(100);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  }, [isThinking, streamThinking]);

  // Get step icon based on type
  const getStepIcon = (type: ReasoningStep["type"]) => {
    switch (type) {
      case "analysis": return Eye;
      case "decision": return Target;
      case "confidence": return TrendingUp;
      case "action": return Zap;
      default: return Brain;
    }
  };

  // Get step color based on type
  const getStepColor = (type: ReasoningStep["type"]) => {
    switch (type) {
      case "analysis": return "text-blue-600";
      case "decision": return "text-green-600";
      case "confidence": return "text-purple-600";
      case "action": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "fixed right-0 top-0 h-full w-80 bg-white shadow-2xl border-l",
        "flex flex-col z-50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              rotate: isThinking || streamThinking ? 360 : 0,
              scale: isThinking || streamThinking ? [1, 1.1, 1] : 1,
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <Brain className="h-5 w-5 text-purple-600" />
          </motion.div>
          <h2 className="font-semibold text-gray-900">AI Thinking</h2>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Status Overview */}
      <div className="p-4 border-b bg-gray-50">
        <div className="space-y-3">
          {/* AI Activity Indicator - Leverage existing component */}
          <AIActivityIndicator
            isActive={isThinking || streamThinking}
            message={isThinking || streamThinking ? "AI is thinking..." : "AI is ready"}
          />

          {/* Confidence Indicator - Leverage existing component */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Confidence:</span>
            <AIConfidenceIndicator
              confidence={confidence}
              accuracy={accuracy}
              showPercentage
              size="sm"
            />
          </div>

          {/* Processing Progress */}
          {(isThinking || streamThinking) && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Processing:</span>
                <span className="text-gray-900">{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Reasoning Stream */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Reasoning Stream</h3>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-3"
          style={{ maxHeight: "calc(100vh - 300px)" }}
        >
          <AnimatePresence>
            {reasoningSteps.map((step, index) => {
              const StepIcon = getStepIcon(step.type);
              const stepColor = getStepColor(step.type);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-l-4 border-l-blue-400">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className={cn("mt-0.5", stepColor)}>
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {step.text}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {step.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {step.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {step.confidence !== undefined && (
                            <div className="mt-1">
                              <Progress 
                                value={step.confidence} 
                                className="h-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Current thinking indicator */}
          {(isThinking || streamThinking) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
              </motion.div>
              <span className="text-sm text-blue-800">
                {currentStep || "Processing your request..."}
              </span>
            </motion.div>
          )}

          {/* Empty state */}
          {reasoningSteps.length === 0 && !isThinking && !streamThinking && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                AI thinking will appear here when active
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with quick stats */}
      <div className="border-t bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {reasoningSteps.length}
            </div>
            <div className="text-xs text-gray-600">Thoughts</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {accuracy ? `${Math.round(accuracy)}%` : "N/A"}
            </div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ThinkingSidebar;
