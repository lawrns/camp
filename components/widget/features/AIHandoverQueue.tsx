"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Clock, Users } from "lucide-react";
import { useAIHandoverQueue, HandoverQueueStatus } from "@/hooks/useAIHandoverQueue";

interface AIHandoverQueueProps {
  conversationId: string;
  organizationId: string;
  onHandoverComplete?: (agentName: string) => void;
  onHandoverCancelled?: () => void;
  className?: string;
}

export function AIHandoverQueue({
  conversationId,
  organizationId,
  onHandoverComplete,
  onHandoverCancelled,
  className = "",
}: AIHandoverQueueProps) {
  const { shouldShowHandoverUI, handoverStatus, handoverMessage, assignedAgentName, isLoading, error } =
    useAIHandoverQueue({
      conversationId,
      organizationId,
      onHandoverComplete,
      onHandoverCancelled,
    });

  if (!shouldShowHandoverUI) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}
        className={`mb-4 rounded-ds-lg border border-[var(--fl-color-info-muted)] bg-gradient-to-r from-blue-50 to-indigo-50 spacing-4 shadow-sm backdrop-blur-sm ${className} `}
      >
        <HandoverStatusDisplay
          status={handoverStatus}
          message={handoverMessage}
          agentName={assignedAgentName}
          isLoading={isLoading}
          error={error}
        />
      </motion.div>
    </AnimatePresence>
  );
}

interface HandoverStatusDisplayProps {
  status: HandoverQueueStatus | null;
  message: string;
  agentName: string | null;
  isLoading: boolean;
  error: string | null;
}

function HandoverStatusDisplay({ status, message, agentName, isLoading, error }: HandoverStatusDisplayProps) {
  if (error) {
    return (
      <div className="flex items-center space-x-3 text-red-600">
        <div className="h-2 w-2 animate-pulse rounded-ds-full bg-red-500" />
        <span className="text-sm font-medium">Connection failed</span>
        <span className="text-tiny text-[var(--fl-color-danger)]">{error}</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  switch (status.status) {
    case "connecting":
      return <ConnectingStatus message={message} estimatedWaitTime={status.estimatedWaitTime} />;

    case "in_queue":
      return (
        <QueueStatus
          message={message}
          estimatedWaitTime={status.estimatedWaitTime}
          queuePosition={status.queuePosition}
        />
      );

    case "assigned":
      return <AssignedStatus message={message} agentName={agentName} />;

    default:
      return (
        <div className="text-foreground flex items-center space-x-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{message || "Processing..."}</span>
        </div>
      );
  }
}

function ConnectingStatus({ message, estimatedWaitTime }: { message: string; estimatedWaitTime?: number }) {
  return (
    <div className="flex items-center space-x-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-5 w-5 rounded-ds-full border-2 border-[var(--fl-color-brand)] border-t-transparent"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-blue-700">{message}</div>
        {estimatedWaitTime && (
          <div className="mt-1 flex items-center text-tiny text-[var(--fl-color-info)]">
            <Clock className="mr-1 h-3 w-3" />
            Estimated wait: {estimatedWaitTime}s
          </div>
        )}
      </div>
    </div>
  );
}

function QueueStatus({
  message,
  estimatedWaitTime,
  queuePosition,
}: {
  message: string;
  estimatedWaitTime?: number;
  queuePosition?: number;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Users className="h-5 w-5 text-blue-600" />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-primary absolute -right-1 -top-1 h-3 w-3 rounded-ds-full"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-blue-700">{message}</div>
        <div className="mt-1 flex items-center space-x-3 text-tiny text-[var(--fl-color-info)]">
          {queuePosition && (
            <div className="flex items-center">
              <Users className="mr-1 h-3 w-3" />
              Position: {queuePosition}
            </div>
          )}
          {estimatedWaitTime && (
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />~{estimatedWaitTime}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedStatus({ message, agentName }: { message: string; agentName: string | null }) {
  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center space-x-3"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        className="flex h-5 w-5 items-center justify-center rounded-ds-full bg-green-500"
      >
        <User className="h-3 w-3 text-white" />
      </motion.div>
      <div className="flex-1">
        <div className="text-sm font-medium text-green-700">{message}</div>
        {agentName && <div className="mt-1 text-tiny text-green-600">You're now chatting with {agentName}</div>}
      </div>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="h-2 w-2 rounded-ds-full bg-green-500"
      />
    </motion.div>
  );
}

// Confidence indicator component for debugging/admin
export function AIConfidenceIndicator({
  confidence,
  threshold = 0.7,
}: {
  confidence: number | null;
  threshold?: number;
}) {
  if (confidence === null) return null;

  const isLow = confidence < threshold;
  const percentage = Math.round(confidence * 100);

  return (
    <div className="flex items-center space-x-spacing-sm text-tiny">
      <span className="text-[var(--fl-color-text-muted)]">AI Confidence:</span>
      <div
        className={`rounded-ds-full px-2 py-1 text-xs font-medium ${
          isLow
            ? "border border-[var(--fl-color-danger-muted)] bg-red-100 text-red-700"
            : "border border-[var(--fl-color-success-muted)] bg-green-100 text-green-700"
        } `}
      >
        {percentage}%
      </div>
      {isLow && (
        <span className="text-tiny text-[var(--fl-color-danger)]">
          (Below {Math.round(threshold * 100)}% threshold)
        </span>
      )}
    </div>
  );
}

// Export the hook for external use
export { useAIHandoverQueue, useAIConfidenceMonitor } from "@/hooks/useAIHandoverQueue";
