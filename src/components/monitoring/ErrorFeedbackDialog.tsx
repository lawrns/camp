/**
 * Error Feedback Dialog
 * Collects user feedback when errors occur
 */

import React, { useState } from "react";
import { AlertTriangle, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { errorReporter, type UserFeedback } from "@/lib/monitoring/error-reporter";
import { Icon } from "@/lib/ui/Icon";

interface ErrorFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  errorMessage?: string;
  context?: {
    feature?: string;
    action?: string;
  };
}

export function ErrorFeedbackDialog({ isOpen, onClose, eventId, errorMessage, context }: ErrorFeedbackDialogProps) {
  const [feedback, setFeedback] = useState<UserFeedback>({
    comments: "",
    category: "bug",
  });
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Collect user feedback
      errorReporter.collectUserFeedback(eventId, {
        ...feedback,
        rating,
      });

      // Add breadcrumb for feedback submission
      errorReporter.addBreadcrumb("User submitted error feedback", "user_feedback", "info", {
        event_id: eventId,
        rating,
        category: feedback.category,
        has_comments: !!feedback.comments,
        feature: context?.feature,
        action: context?.action,
      });

      setIsSubmitted(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFeedback({ comments: "", category: "bug" });
        setRating(0);
      }, 2000);
    } catch (error) {

      errorReporter.reportError(error instanceof Error ? error : new Error("Failed to submit feedback"), {
        feature: "error_feedback",
        action: "submit_feedback",
        metadata: { event_id: eventId },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-ds-full bg-fl-success/10 spacing-3">
              <Icon icon={Send} className="h-6 w-6 text-fl-success" />
            </div>
            <h3 className="text-base font-semibold text-fl-text">Thank you!</h3>
            <p className="text-fl-text-muted">
              Your feedback has been submitted and will help us improve the experience.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-ds-full bg-fl-warning/10 p-spacing-sm">
              <Icon icon={AlertTriangle} className="h-5 w-5 text-fl-warning" />
            </div>
            <div>
              <DialogTitle>Something went wrong</DialogTitle>
              <p className="text-sm text-fl-text-muted">Help us improve by sharing what happened</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Context */}
          {(errorMessage || context) && (
            <div className="rounded-ds-lg bg-fl-background-muted spacing-3">
              <h4 className="mb-2 text-sm font-medium text-fl-text">Error Details</h4>
              {errorMessage && (
                <p className="mb-1 text-tiny text-fl-text-muted">
                  <strong>Message:</strong> {errorMessage}
                </p>
              )}
              {context?.feature && (
                <p className="mb-1 text-tiny text-fl-text-muted">
                  <strong>Feature:</strong> {context.feature}
                </p>
              )}
              {context?.action && (
                <p className="text-tiny text-fl-text-muted">
                  <strong>Action:</strong> {context.action}
                </p>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="space-y-spacing-sm">
            <Label htmlFor="rating">How would you rate your experience?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  className="rounded spacing-1 transition-colors hover:bg-fl-background-muted"
                  aria-label={`Rate ${value} stars`}
                >
                  <Icon
                    icon={Star}
                    className={`h-5 w-5 ${
                      value <= rating ? "fill-fl-warning text-fl-warning" : "text-fl-border-strong"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-spacing-sm">
            <Label htmlFor="category">What type of issue is this?</Label>
            <Select
              value={feedback.category || "bug"}
              onValueChange={(value) =>
                setFeedback((prev) => ({ ...prev, category: (value || "bug") as UserFeedback["category"] }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug / Error</SelectItem>
                <SelectItem value="performance">Performance Issue</SelectItem>
                <SelectItem value="ui">UI / Design Issue</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-spacing-sm">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={feedback.name || ""}
                onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-spacing-sm">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={feedback.email || ""}
                onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-spacing-sm">
            <Label htmlFor="comments">What were you trying to do when this happened? *</Label>
            <Textarea
              id="comments"
              value={feedback.comments}
              onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
              placeholder="Please describe what you were doing when the error occurred..."
              rows={4}
              required
            />
          </div>

          {/* Privacy Notice */}
          <div className="rounded bg-fl-background-subtle spacing-3 text-tiny text-fl-text-muted">
            <p>
              <strong>Privacy:</strong> This feedback will be sent to our development team to help improve the
              application. We do not share your information with third parties.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Skip
            </Button>
            <Button type="submit" disabled={isSubmitting || !feedback.comments.trim()} className="min-w-[100px]">
              {isSubmitting ? (
                <div className="flex items-center gap-ds-2">
                  <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-current border-t-transparent" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-ds-2">
                  <Icon icon={Send} className="h-4 w-4" />
                  Send Feedback
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy error feedback collection
export function useErrorFeedback() {
  const [feedbackState, setFeedbackState] = useState<{
    isOpen: boolean;
    eventId: string;
    errorMessage?: string;
    context?: {
      feature?: string;
      action?: string;
    };
  }>({
    isOpen: false,
    eventId: "",
  });

  const showFeedback = (eventId: string, errorMessage?: string, context?: { feature?: string; action?: string }) => {
    setFeedbackState({
      isOpen: true,
      eventId,
      errorMessage,
      context,
    });
  };

  const hideFeedback = () => {
    setFeedbackState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    showFeedback,
    hideFeedback,
    FeedbackDialog: () => {
      const props: ErrorFeedbackDialogProps = {
        isOpen: feedbackState.isOpen,
        onClose: hideFeedback,
        eventId: feedbackState.eventId,
      };
      if (feedbackState.errorMessage !== undefined) {
        props.errorMessage = feedbackState.errorMessage;
      }
      if (feedbackState.context !== undefined) {
        props.context = feedbackState.context;
      }
      return <ErrorFeedbackDialog {...props} />;
    },
  };
}
