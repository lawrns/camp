"use client";

/**
 * Simple AI Handover - Lightweight Feature Component
 *
 * Basic AI handover interface without external dependencies.
 * Only loads when AI confidence is low or user requests human agent.
 */

import React, { useState } from "react";

interface AIHandoverProps {
  onHandover: (reason: string, priority: "low" | "medium" | "high") => void;
  className?: string;
  aiConfidence?: number;
}

export const AIHandoverQueue: React.FC<AIHandoverProps> = ({ onHandover, className = "", aiConfidence = 0.5 }) => {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for the handover");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      onHandover(reason, priority);
      setIsSubmitting(false);
    }, 1000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className={`mt-2 rounded-ds-lg border border-[var(--fl-color-border)] bg-white spacing-4 shadow-lg ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Request Human Agent</h4>
        <div className="flex items-center space-x-spacing-sm">
          <span className="text-foreground-muted text-tiny">AI Confidence:</span>
          <span className={`text-xs font-medium ${getConfidenceColor(aiConfidence)}`}>
            {getConfidenceText(aiConfidence)} ({Math.round(aiConfidence * 100)}%)
          </span>
        </div>
      </div>

      {/* AI Confidence Indicator */}
      <div className="mb-4">
        <div className="text-foreground-muted mb-1 flex justify-between text-tiny">
          <span>AI Assistance</span>
          <span>Human Agent</span>
        </div>
        <div className="h-2 w-full rounded-ds-full bg-gray-200">
          <div
            className={`h-2 rounded-ds-full transition-all duration-300 ${
              aiConfidence >= 0.8 ? "bg-green-500" : aiConfidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${aiConfidence * 100}%` }}
          ></div>
        </div>
        {aiConfidence < 0.7 && (
          <p className="mt-1 text-tiny text-orange-600">⚠️ AI confidence is low. Consider human handover.</p>
        )}
      </div>

      {/* Reason Input */}
      <div className="mb-3">
        <label className="text-foreground mb-1 block text-tiny font-medium">Reason for handover</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe why you need human assistance..."
          className="border-ds-border-strong w-full resize-none rounded border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* Priority Selection */}
      <div className="mb-4">
        <label className="text-foreground mb-2 block text-tiny font-medium">Priority Level</label>
        <div className="flex space-x-spacing-sm">
          {[
            { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
            { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
            { value: "high", label: "High", color: "bg-red-100 text-red-800" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPriority(option.value as "low" | "medium" | "high")}
              className={`flex-1 rounded px-3 py-2 text-xs font-medium transition-colors ${
                priority === option.value ? option.color : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Reason Buttons */}
      <div className="mb-4">
        <p className="text-foreground mb-2 text-tiny font-medium">Quick reasons:</p>
        <div className="flex flex-wrap gap-1">
          {[
            "Complex technical issue",
            "Billing question",
            "Account access problem",
            "Product complaint",
            "Feature request",
          ].map((quickReason) => (
            <button
              key={quickReason}
              onClick={() => setReason(quickReason)}
              className="bg-background rounded px-2 py-1 text-tiny transition-colors hover:bg-gray-200"
            >
              {quickReason}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-spacing-sm">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !reason.trim()}
          className="bg-primary flex-1 rounded px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Requesting..." : "Request Human Agent"}
        </button>
        <button
          onClick={() => {
            setReason("");
            setPriority("medium");
          }}
          className="bg-background text-foreground rounded px-3 py-2 text-sm transition-colors hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>

      {/* Estimated Wait Time */}
      <div className="text-foreground-muted mt-3 text-center text-tiny">
        <p>Estimated wait time: {priority === "high" ? "< 2 min" : priority === "medium" ? "5-10 min" : "15-30 min"}</p>
      </div>
    </div>
  );
};
