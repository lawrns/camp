/**
 * Feedback Widget Component
 *
 * User-friendly feedback collection interface:
 * - Quick rating system (1-5 stars)
 * - Detailed feedback forms
 * - Performance-aware feedback triggers
 * - Screenshot and log collection
 * - Real-time submission with offline support
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackType, FeedbackCategory, getFeedbackCollector, initializeFeedbackCollector } from "@/lib/feedback";
import { useFeatureFlag } from "@/lib/feature-flags";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

interface FeedbackWidgetProps {
  organizationId: string;
  userId?: string;
  trigger?: "manual" | "performance" | "error" | "session_end";
  onClose?: () => void;
}

export function FeedbackWidget({ organizationId, userId, trigger = "manual", onClose }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"rating" | "details" | "success">("rating");
  const [rating, setRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>(FeedbackCategory.GENERAL);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [includeLogs, setIncludeLogs] = useState(false);

  // Feature flags
  const { isEnabled: feedbackEnabled } = useFeatureFlag("user-feedback-system", false);
  const { isEnabled: screenshotEnabled } = useFeatureFlag("feedback-screenshots", true);
  const { isEnabled: logsEnabled } = useFeatureFlag("feedback-logs", true);

  // Performance monitoring
  const { metrics, shouldReduceAnimations } = usePerformanceMonitor();

  // Initialize feedback collector
  useEffect(() => {
    if (feedbackEnabled) {
      initializeFeedbackCollector({
        enabled: true,
        collectPerformanceMetrics: true,
        enableScreenshots: screenshotEnabled,
        enableConsoleLogs: logsEnabled,
        enableNetworkLogs: false,
        autoSubmitThreshold: 2, // Auto-submit on rating <= 2
        sentimentAnalysisEnabled: true,
        realTimeAlerting: true,
        retentionDays: 90,
      });
    }
  }, [feedbackEnabled, screenshotEnabled, logsEnabled]);

  // Auto-trigger feedback on poor performance
  useEffect(() => {
    if (trigger === "performance" && metrics.averageFps < 20) {
      setIsOpen(true);
      setCategory(FeedbackCategory.PERFORMANCE);
      setTitle("Performance Issue Detected");
      setDescription(`Low frame rate detected: ${metrics.averageFps.toFixed(1)} FPS`);
    }
  }, [trigger, metrics.averageFps]);

  const handleRatingSelect = useCallback((selectedRating: number) => {
    setRating(selectedRating);

    // Auto-submit for high ratings (4-5 stars)
    if (selectedRating >= 4) {
      handleQuickSubmit(selectedRating);
    } else {
      setStep("details");
    }
  }, []);

  const handleQuickSubmit = useCallback(
    async (quickRating: number) => {
      const collector = getFeedbackCollector();
      if (!collector) return;

      setIsSubmitting(true);

      try {
        await collector.createFeedback(FeedbackType.SATISFACTION_RATING, {
          category: FeedbackCategory.GENERAL,
          title: `${quickRating}-star rating`,
          description: `User provided a ${quickRating}-star rating`,
          rating: quickRating,
          userId,
          organizationId,
        });

        setStep("success");
        setTimeout(() => {
          setIsOpen(false);
          onClose?.();
        }, 2000);
      } catch (error) {

      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, organizationId, onClose]
  );

  const handleDetailedSubmit = useCallback(async () => {
    const collector = getFeedbackCollector();
    if (!collector || !title.trim()) return;

    setIsSubmitting(true);

    try {
      const feedbackType = rating <= 2 ? FeedbackType.BUG_REPORT : FeedbackType.GENERAL_FEEDBACK;

      await collector.createFeedback(feedbackType, {
        category,
        title: title.trim(),
        description: description.trim(),
        rating,
        userId,
        organizationId,
        includeScreenshot,
        includeConsoleLogs: includeLogs,
      });

      setStep("success");
      setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, 2000);
    } catch (error) {

    } finally {
      setIsSubmitting(false);
    }
  }, [
    collector,
    title,
    description,
    rating,
    category,
    userId,
    organizationId,
    includeScreenshot,
    includeLogs,
    onClose,
  ]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep("rating");
    setRating(0);
    setTitle("");
    setDescription("");
    onClose?.();
  }, [onClose]);

  if (!feedbackEnabled) {
    return null;
  }

  return (
    <>
      {/* Feedback trigger button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-primary fixed bottom-20 right-4 z-40 rounded-ds-full spacing-3 text-white shadow-card-deep hover:bg-blue-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2 }} // Show after 2 seconds
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </motion.button>
      )}

      {/* Feedback modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 spacing-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="bg-background max-h-[90vh] w-full max-w-md overflow-y-auto rounded-ds-lg shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-spacing-md">
                <h2 className="text-lg font-semibold text-gray-900">
                  {step === "rating" && "How was your experience?"}
                  {step === "details" && "Tell us more"}
                  {step === "success" && "Thank you!"}
                </h2>
                <button onClick={handleClose} className="hover:text-foreground text-gray-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-spacing-md">
                {step === "rating" && (
                  <div className="text-center">
                    <p className="text-foreground mb-6">Rate your experience with our chat widget</p>

                    {/* Star rating */}
                    <div className="mb-6 flex justify-center space-x-spacing-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingSelect(star)}
                          className={`text-3xl transition-colors ${
                            star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                          }`}
                          disabled={isSubmitting}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <p className="text-foreground-muted text-sm">Click a star to rate (5 = excellent, 1 = poor)</p>
                  </div>
                )}

                {step === "details" && (
                  <div className="space-y-3">
                    {/* Category selection */}
                    <div>
                      <label className="text-foreground mb-2 block text-sm font-medium">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                        className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={FeedbackCategory.GENERAL}>General Feedback</option>
                        <option value={FeedbackCategory.PERFORMANCE}>Performance Issue</option>
                        <option value={FeedbackCategory.UI_UX_FEEDBACK}>UI/UX Feedback</option>
                        <option value={FeedbackCategory.ACCESSIBILITY}>Accessibility</option>
                        <option value={FeedbackCategory.MOBILE_EXPERIENCE}>Mobile Experience</option>
                        <option value={FeedbackCategory.AI_RESPONSES}>AI Responses</option>
                        <option value={FeedbackCategory.FUNCTIONALITY}>Functionality</option>
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-foreground mb-2 block text-sm font-medium">Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief summary of your feedback"
                        className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-foreground mb-2 block text-sm font-medium">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide more details about your experience..."
                        rows={4}
                        className="border-ds-border-strong w-full rounded-ds-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={1000}
                      />
                    </div>

                    {/* Options */}
                    <div className="space-y-spacing-sm">
                      {screenshotEnabled && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeScreenshot}
                            onChange={(e) => setIncludeScreenshot(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-foreground text-sm">Include screenshot</span>
                        </label>
                      )}

                      {logsEnabled && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeLogs}
                            onChange={(e) => setIncludeLogs(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-foreground text-sm">Include console logs</span>
                        </label>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      onClick={handleDetailedSubmit}
                      disabled={!title.trim() || isSubmitting}
                      className="bg-primary w-full rounded-ds-md px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center">
                    <div className="mb-4 text-6xl text-green-600">✓</div>
                    <h3 className="mb-2 text-base font-semibold text-gray-900">Feedback Submitted!</h3>
                    <p className="text-foreground">Thank you for helping us improve your experience.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Quick feedback component for specific actions
export function QuickFeedback({ action, onFeedback }: { action: string; onFeedback?: (rating: number) => void }) {
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = useCallback(
    async (selectedRating: number) => {
      setRating(selectedRating);
      setSubmitted(true);

      const collector = getFeedbackCollector();
      if (collector) {
        await collector.createFeedback(FeedbackType.SATISFACTION_RATING, {
          category: FeedbackCategory.FUNCTIONALITY,
          title: `${action} rating`,
          description: `User rated ${action} as ${selectedRating} stars`,
          rating: selectedRating,
        });
      }

      onFeedback?.(selectedRating);

      // Hide after 2 seconds
      setTimeout(() => setSubmitted(false), 2000);
    },
    [action, onFeedback]
  );

  if (submitted) {
    return (
      <div className="py-2 text-center">
        <span className="text-sm text-green-600">Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="py-2 text-center">
      <p className="text-foreground mb-2 text-sm">How was {action}?</p>
      <div className="flex justify-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            className={`text-lg transition-colors ${
              star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeedbackWidget;
