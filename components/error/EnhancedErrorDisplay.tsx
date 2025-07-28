/**
 * Enhanced Error Display Component
 *
 * User-friendly error displays with reporting, recovery options,
 * and contextual help based on error type
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Send,
  Shield,
  User,
  Wifi,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { ErrorContext } from "./UnifiedErrorBoundary";

interface EnhancedErrorDisplayProps {
  context: ErrorContext;
  className?: string;
  showTechnicalDetails?: boolean;
  enableReporting?: boolean;
  showRecoveryOptions?: boolean;
}

interface ErrorSuggestion {
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export function EnhancedErrorDisplay({
  context,
  className,
  showTechnicalDetails = false,
  enableReporting = true,
  showRecoveryOptions = true,
}: EnhancedErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(showTechnicalDetails);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);

  const { error, errorInfo, domain, severity, retryCount, errorId, resetError } = context;

  // Get error category and suggestions
  const errorCategory = categorizeError(error);
  const suggestions = getErrorSuggestions(error, errorCategory, resetError);
  const helpResources = getHelpResources(errorCategory);

  // Auto-retry with progress for certain error types
  useEffect(() => {
    if (errorCategory === "network" && retryCount < 2) {
      const timer = setTimeout(() => {
        setRetryProgress(100);
        setTimeout(resetError, 500);
      }, 3000);

      const progressTimer = setInterval(() => {
        setRetryProgress((prev) => Math.min(prev + 2, 100));
      }, 60);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [errorCategory, retryCount, resetError]);

  const handleReportError = async () => {
    setIsReporting(true);

    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        level: domain === "critical" ? "critical" : "component",
        context: domain,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        retryCount,
        additionalData: {
          severity,
          domain,
          category: errorCategory,
        },
      };

      const response = await fetch("/api/errors/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorReport),
      });

      if (response.ok) {
        setReportSent(true);
      }
    } catch (reportError) {

    } finally {
      setIsReporting(false);
    }
  };

  const handleCopyError = async () => {
    const errorText = `
Error ID: ${errorId}
Message: ${error.message}
Domain: ${domain}
Severity: ${severity}
Category: ${errorCategory}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
Stack: ${error.stack}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
    } catch (err) {

    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-[var(--fl-color-danger-muted)]";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-[var(--fl-color-warning-muted)]";
      default:
        return "text-blue-600 bg-blue-50 border-[var(--fl-color-border-interactive)]";
    }
  };

  const getCategoryIcon = () => {
    switch (errorCategory) {
      case "network":
        return <Wifi className="h-5 w-5" />;
      case "authentication":
        return <User className="h-5 w-5" />;
      case "authorization":
        return <Shield className="h-5 w-5" />;
      case "database":
        return <Database className="h-5 w-5" />;
      case "performance":
        return <Zap className="h-5 w-5" />;
      default:
        return <Bug className="h-5 w-5" />;
    }
  };

  return (
    <div className={cn("flex items-center justify-center spacing-4", className)}>
      <Card className={cn("w-full max-w-2xl", getSeverityColor())}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                "rounded-ds-full spacing-2",
                severity === "critical"
                  ? "bg-red-100"
                  : severity === "high"
                    ? "bg-orange-100"
                    : severity === "medium"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
              )}
            >
              {getCategoryIcon()}
            </div>

            <div className="flex-1">
              <CardTitle className="text-base">{getErrorTitle(errorCategory, severity)}</CardTitle>
              <CardDescription>{getErrorDescription(errorCategory, error.message)}</CardDescription>
            </div>

            <div className="flex flex-col items-end space-y-1">
              <Badge variant={severity === "critical" ? "destructive" : "secondary"}>{severity.toUpperCase()}</Badge>
              <Badge variant="outline" className="text-tiny">
                {errorCategory}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Auto-retry progress */}
          {errorCategory === "network" && retryCount < 2 && (
            <div className="rounded-ds-lg border border-[var(--fl-color-border-interactive)] bg-blue-50 spacing-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Automatically retrying...</span>
                <span className="text-sm text-blue-600">{retryProgress}%</span>
              </div>
              <Progress value={retryProgress} className="h-2" />
            </div>
          )}

          {/* Error suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Suggested Solutions:</h4>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-background flex items-start space-x-3 rounded-ds-lg border spacing-3">
                  {suggestion.icon && <div className="mt-0.5 flex-shrink-0">{suggestion.icon}</div>}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{suggestion.title}</h5>
                    <p className="text-foreground mt-1 text-sm">{suggestion.description}</p>
                    {suggestion.action && suggestion.actionLabel && (
                      <Button variant="outline" size="sm" onClick={suggestion.action} className="mt-2">
                        {suggestion.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help resources */}
          {helpResources.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Help & Resources:</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {helpResources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-background flex items-center space-x-spacing-sm rounded-ds-lg border spacing-3 transition-colors hover:border-[var(--fl-color-border-interactive)]"
                  >
                    <ExternalLink className="text-ds-brand h-4 w-4" />
                    <span className="text-sm font-medium text-gray-900">{resource.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Error details */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span>Technical Details</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="space-y-3">
                <div className="bg-background rounded-ds-lg spacing-3">
                  <p className="mb-2 text-sm font-medium text-gray-900">Error Details:</p>
                  <div className="text-foreground space-y-1 text-tiny">
                    <div>
                      <strong>ID:</strong> {errorId}
                    </div>
                    <div>
                      <strong>Domain:</strong> {domain}
                    </div>
                    <div>
                      <strong>Retry Count:</strong> {retryCount}
                    </div>
                    <div>
                      <strong>Message:</strong> {error.message}
                    </div>
                  </div>
                </div>

                {error.stack && (
                  <div className="bg-background rounded-ds-lg spacing-3">
                    <p className="mb-2 text-sm font-medium text-gray-900">Stack Trace:</p>
                    <pre className="text-foreground max-h-32 overflow-auto whitespace-pre-wrap text-tiny">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {showRecoveryOptions && (
            <div className="flex flex-wrap gap-3 pt-4">
              <Button onClick={resetError} className="min-w-[120px] flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>

              <Button variant="outline" onClick={() => window.location.reload()} className="min-w-[120px] flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>

              <Button variant="outline" onClick={handleCopyError} className="min-w-[120px] flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy Details
              </Button>

              {enableReporting && (
                <Button
                  variant="outline"
                  onClick={handleReportError}
                  disabled={isReporting || reportSent}
                  className="min-w-[120px] flex-1"
                >
                  {isReporting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : reportSent ? (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {reportSent ? "Reported" : "Report Error"}
                </Button>
              )}
            </div>
          )}

          {reportSent && (
            <div className="rounded-ds-lg border border-[var(--fl-color-success-muted)] bg-green-50 spacing-3">
              <p className="text-sm text-green-800">
                ✅ Error report sent successfully. Our team has been notified.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function categorizeError(error: Error): string {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || "";

  if (message.includes("network") || message.includes("fetch") || message.includes("connection")) return "network";
  if (message.includes("auth") || message.includes("unauthorized") || message.includes("token"))
    return "authentication";
  if (message.includes("permission") || message.includes("forbidden") || message.includes("access"))
    return "authorization";
  if (message.includes("timeout") || message.includes("slow")) return "performance";
  if (stack.includes("supabase") || message.includes("database")) return "database";
  if (stack.includes("react") || stack.includes("component")) return "ui";

  return "general";
}

function getErrorTitle(category: string, severity: string): string {
  if (severity === "critical") return "Critical System Error";

  switch (category) {
    case "network":
      return "Connection Problem";
    case "authentication":
      return "Authentication Required";
    case "authorization":
      return "Access Denied";
    case "database":
      return "Data Access Error";
    case "performance":
      return "Performance Issue";
    case "ui":
      return "Display Problem";
    default:
      return "Something Went Wrong";
  }
}

function getErrorDescription(category: string, message: string): string {
  switch (category) {
    case "network":
      return "Unable to connect to our servers. Please check your internet connection.";
    case "authentication":
      return "Your session may have expired. Please sign in again.";
    case "authorization":
      return "You don't have permission to access this resource.";
    case "database":
      return "We're having trouble accessing your data. Please try again.";
    case "performance":
      return "The operation is taking longer than expected.";
    case "ui":
      return "There's a problem displaying this content.";
    default:
      return "An unexpected error occurred. We're working to fix this.";
  }
}

function getErrorSuggestions(error: Error, category: string, resetError: () => void): ErrorSuggestion[] {
  const suggestions: ErrorSuggestion[] = [];

  switch (category) {
    case "network":
      suggestions.push({
        title: "Check Your Connection",
        description: "Verify that you're connected to the internet and try again.",
        action: resetError,
        actionLabel: "Retry",
        icon: <Wifi className="text-ds-brand h-4 w-4" />,
      });
      break;

    case "authentication":
      suggestions.push({
        title: "Sign In Again",
        description: "Your session may have expired. Please sign in to continue.",
        action: () => (window.location.href = "/login"),
        actionLabel: "Go to Login",
        icon: <User className="text-ds-brand h-4 w-4" />,
      });
      break;

    case "authorization":
      suggestions.push({
        title: "Contact Administrator",
        description: "You may need additional permissions to access this feature.",
        icon: <Shield className="h-4 w-4 text-orange-500" />,
      });
      break;
  }

  return suggestions;
}

function getHelpResources(category: string): Array<{ title: string; url: string }> {
  const baseUrl = "/help";

  switch (category) {
    case "network":
      return [
        { title: "Connection Troubleshooting", url: `${baseUrl}/connection-issues` },
        { title: "System Status", url: "/status" },
      ];
    case "authentication":
      return [
        { title: "Login Help", url: `${baseUrl}/login-issues` },
        { title: "Account Recovery", url: `${baseUrl}/account-recovery` },
      ];
    case "authorization":
      return [
        { title: "Permissions Guide", url: `${baseUrl}/permissions` },
        { title: "Contact Support", url: `${baseUrl}/contact` },
      ];
    default:
      return [
        { title: "General Help", url: `${baseUrl}` },
        { title: "Contact Support", url: `${baseUrl}/contact` },
      ];
  }
}

// Compact error display for smaller spaces
export function CompactErrorDisplay({ context, onRetry }: { context: ErrorContext; onRetry?: () => void }) {
  const category = categorizeError(context.error);

  return (
    <div className="flex items-center space-x-3 rounded-ds-lg border border-[var(--fl-color-danger-muted)] bg-red-50 spacing-3">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-red-800">{getErrorTitle(category, context.severity)}</p>
        <p className="truncate text-tiny text-red-600">{context.error.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
