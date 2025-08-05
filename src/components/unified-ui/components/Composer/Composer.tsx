"use client";

import { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Mic as Mic, Paperclip, Send as Send, Smile as Smile } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

// BACKUP: Original basic composer moved to Composer.basic.tsx
// This file now contains the comprehensive composer with all sophisticated features

interface ComposerProps {
  className?: string;
  children?: ReactNode;
}

/**
 * LEGACY: Flame UI Message Composer (Basic Version)
 *
 * This is the original basic composer - kept for backward compatibility
 * For the new sophisticated composer, use the index.tsx export
 */
export function Composer({ className, children }: ComposerProps) {
  return (
    <div
      className={cn(
        "flame-composer", // PostCSS class for complex focus interactions
        "flex flex-col gap-2 spacing-4",
        "border-t border-fl-border bg-fl-surface",
        "safe-bottom", // Mobile safe area support
        className
      )}
    >
      {children}
    </div>
  );
}

interface ComposerInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

/**
 * Flame UI Composer Input
 *
 * Auto-growing textarea with modern field-sizing support
 * Replaces complex CSS with simple Tailwind utilities
 */
export function ComposerInput({ className, ...props }: ComposerInputProps) {
  return (
    <div className="flame-composer-border flex items-end gap-ds-2 rounded-ds-md border border-fl-border bg-fl-background-muted p-spacing-sm transition-all duration-150 ease-out">
      {/* Left tools */}
      <ComposerTools side="left">
        <ComposerTool icon={Paperclip as unknown} label="Attach file" />
        <ComposerTool icon={Smile as unknown} label="Add emoji" />
      </ComposerTools>

      {/* Textarea */}
      <textarea
        className={cn(
          // Layout
          "max-h-[120px] min-h-[44px] flex-1 resize-none",

          // Reset styles
          "border-none bg-transparent outline-none",

          // Typography
          "text-typography-base leading-normal text-fl-text placeholder:text-fl-text-subtle",

          // Modern auto-resize (with fallback)
          "field-sizing-content", // Modern browsers

          className
        )}
        placeholder="Type a message..."
        {...props}
      />

      {/* Right tools */}
      <ComposerTools side="right">
        <ComposerTool icon={Mic as unknown} label="Voice message" />
        <ComposerSendButton />
      </ComposerTools>
    </div>
  );
}

interface ComposerToolsProps {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}

/**
 * Flame UI Composer Tools Container
 *
 * Handles the slide-in animation for tool buttons
 */
export function ComposerTools({ children, side = "left", className }: ComposerToolsProps) {
  return (
    <div
      className={cn(
        "flame-composer-tools", // PostCSS class for slide-in animation
        "flex items-center gap-1",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ComposerToolProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  className?: string;
}

/**
 * Flame UI Composer Tool Button
 *
 * Touch-friendly button with icon and accessibility
 * Replaces .inbox-composer-tool-btn CSS
 */
export function ComposerTool({ icon: Icon, label, active = false, className, ...props }: ComposerToolProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        // Layout & touch targets
        "flex items-center justify-center",
        "touch-target h-8 w-8", // Minimum 44px touch target from Tailwind plugin

        // Styling
        "rounded-ds-sm border-none bg-transparent",
        "text-fl-text-muted",

        // Interactions
        "transition-all duration-150 ease-out",
        "hover:scale-105 hover:bg-fl-hover hover:text-fl-text",
        "active:scale-95",
        "flame-focus", // Custom focus ring
        "touch-manipulation", // Optimize for touch

        // Active state
        active && "bg-fl-brand text-fl-text-inverse",

        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface ComposerSendButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  className?: string;
}

/**
 * Flame UI Composer Send Button
 *
 * Primary action button with improved styling
 * Replaces .inbox-composer-send-btn CSS
 */
export function ComposerSendButton({ loading = false, disabled, className, ...props }: ComposerSendButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="submit"
      aria-label="Send message"
      disabled={isDisabled}
      className={cn(
        // Layout & touch targets
        "flex items-center justify-center",
        "touch-comfortable h-9 w-9", // Comfortable 48px touch target

        // Styling
        "rounded-ds-sm border-none",
        "bg-fl-brand text-fl-text-inverse",

        // Interactions (when not disabled)
        !isDisabled && [
          "transition-all duration-150 ease-out",
          "hover:-translate-y-px hover:bg-fl-brand-hover hover:shadow-md",
          "active:translate-y-0 active:shadow-sm",
        ],

        // Disabled state
        isDisabled && ["bg-fl-border-strong text-fl-text-subtle", "cursor-not-allowed"],

        // Focus
        "flame-focus",
        "touch-manipulation",

        className
      )}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-ds-full border-2 border-current border-t-transparent" />
      ) : (
        <Icon icon={Send} className="h-4 w-4" />
      )}
    </button>
  );
}

interface ComposerAISuggestionsProps {
  suggestions: {
    id: string;
    content: string;
    confidence: "high" | "medium" | "low";
    category: string;
  }[];
  onSelectSuggestion: (suggestion: unknown) => void;
  className?: string;
}

/**
 * Flame UI AI Suggestions
 *
 * Replaces .inbox-ai-suggestions CSS with Tailwind utilities
 * Shows AI-powered response suggestions
 */
export function ComposerAISuggestions({ suggestions, onSelectSuggestion, className }: ComposerAISuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 spacing-4",
        "rounded-ds-md border border-fl-border bg-fl-background-muted",
        className
      )}
    >
      <h4 className="text-sm font-medium text-fl-text-muted">AI Suggestions</h4>

      <div className="flex flex-col gap-ds-2">
        {suggestions.map((suggestion: unknown) => (
          <button
            key={suggestion.id}
            onClick={() => onSelectSuggestion(suggestion)}
            className={cn(
              // Layout
              "flex items-start gap-2 spacing-2",
              "rounded-ds-sm border border-fl-border bg-fl-surface",
              "text-left",

              // Interactions
              "transition-all duration-150 ease-out",
              "hover:-translate-y-px hover:border-fl-border-interactive hover:bg-fl-hover",
              "flame-focus",
              "touch-manipulation"
            )}
          >
            <div className="flex-1">
              <p className="text-sm text-fl-text">{suggestion.content}</p>
            </div>

            <AIConfidenceBadge confidence={suggestion.confidence} />
          </button>
        ))}
      </div>
    </div>
  );
}

interface AIConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
}

/**
 * AI Confidence Badge
 *
 * Replaces .inbox-ai-confidence CSS with Tailwind utilities
 */
function AIConfidenceBadge({ confidence }: AIConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        "text-typography-xs inline-flex items-center radius-xs px-2 py-1 font-medium",
        confidence === "high" && "bg-fl-success text-fl-text-inverse",
        confidence === "medium" && "bg-fl-warning text-fl-text-inverse",
        confidence === "low" && "bg-fl-border-strong text-fl-text"
      )}
    >
      {confidence}
    </span>
  );
}
