/**
 * Empty State Component
 * Provides consistent empty state UI across the application
 */

import React from "react";
import { cn } from "@/lib/utils";

export type EmptyStateVariants = "default" | "search" | "error" | "loading";

// Constants for EmptyState variants
export const EmptyStateVariantsConfig = {
  searchResults: (query: string) => ({
    title: `No results found for "${query}"`,
    description: "Try adjusting your search terms or browse our knowledge base.",
  }),
  noResults: () => ({
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
  }),
  error: () => ({
    title: "Something went wrong",
    description: "Please try again or contact support if the problem persists.",
  }),
  loading: () => ({
    title: "Loading...",
    description: "Please wait while we fetch your data.",
  }),
  notifications: {
    title: "No notifications",
    description: "You're all caught up! New notifications will appear here.",
  },
};

export interface EmptyStateProps {
  title?: string;
  description?: string;
  variant?: EmptyStateVariants;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title = "No data found",
  description = "There's nothing to display here yet.",
  variant = "default",
  icon,
  action,
  className,
  children,
}: EmptyStateProps) {
  const variantStyles = {
    default: "text-muted-foreground",
    search: "text-muted-foreground",
    error: "text-destructive",
    loading: "text-muted-foreground animate-pulse",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center spacing-8 text-center", className)}>
      {icon && <div className="mb-4 text-4xl opacity-50">{icon}</div>}

      <h3 className={cn("mb-2 text-lg font-semibold", variantStyles[variant])}>{title}</h3>

      {description && <p className={cn("text-typography-sm mb-4 max-w-md", variantStyles[variant])}>{description}</p>}

      {action && <div className="mt-4">{action}</div>}

      {children}
    </div>
  );
}

export default EmptyState;
